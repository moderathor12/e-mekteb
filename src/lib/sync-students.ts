import { createClient } from '@/lib/supabase/client';
import { Student } from '@/types';

let lastSyncAt = 0;
let inFlightSync: Promise<void> | null = null;
const SYNC_COOLDOWN_MS = 60_000;

/**
 * Təsdiqlənmiş valideyn müraciətlərini yoxlayır və students / parent_student_links
 * cədvəllərində çatışmayan şagird qeydlərini toplu (batch) şəkildə bərpa edir.
 */
export async function syncApprovedParentRequests(options?: { force?: boolean }): Promise<void> {
  if (!options?.force && Date.now() - lastSyncAt < SYNC_COOLDOWN_MS) {
    return;
  }

  if (inFlightSync) {
    return inFlightSync;
  }

  inFlightSync = (async () => {
    const supabase = createClient();

    try {
      // 1. Bütün lazımi məlumatları paralel şəkildə alırıq
      const [reqRes, stRes, clsRes, linkRes] = await Promise.all([
        supabase
          .from('parent_connection_requests')
          .select('id, parent_id, student_first_name, student_last_name, student_code, class_id, relationship_type')
          .eq('status', 'approved'),
        supabase.from('students').select('id, first_name, last_name'),
        supabase.from('classes').select('id, name, is_archived, grade_level').order('grade_level'),
        supabase.from('parent_student_links').select('parent_id, student_id'),
      ]);

      if (reqRes.error || !reqRes.data || reqRes.data.length === 0) {
        lastSyncAt = Date.now();
        return;
      }

      const approvedReqs = reqRes.data;
      const studentMap = new Map<string, string>();
      for (const s of stRes.data || []) {
        const key = `${s.first_name.trim().toLowerCase()}|${s.last_name.trim().toLowerCase()}`;
        if (!studentMap.has(key)) {
          studentMap.set(key, s.id);
        }
      }

      const existingLinks = new Set<string>(
        (linkRes.data || []).map((l) => `${l.parent_id}|${l.student_id}`)
      );

      const availableClasses = (clsRes.data || []).filter((c) => c.is_archived !== true);
      const defaultClassId = availableClasses[0]?.id || clsRes.data?.[0]?.id;

      // 2. Çatışmayan şagirdləri müəyyən edirik
      const studentsToInsert: Array<{
        first_name: string;
        last_name: string;
        class_id: string;
        student_code: string;
        is_archived: boolean;
      }> = [];
      const pendingClassUpdates: Array<{ reqId: string; classId: string }> = [];
      const seenNewStudentKeys = new Set<string>();

      for (const req of approvedReqs) {
        const fName = (req.student_first_name || '').trim();
        const lName = (req.student_last_name || '').trim();
        const key = `${fName.toLowerCase()}|${lName.toLowerCase()}`;

        if (!studentMap.has(key) && !seenNewStudentKeys.has(key) && defaultClassId) {
          let targetClassId = req.class_id;

          if (!targetClassId && req.student_code) {
            const matched = availableClasses.find((c) =>
              c.name.toLowerCase().includes(req.student_code.toLowerCase())
            );
            if (matched) targetClassId = matched.id;
          }

          if (!targetClassId) {
            targetClassId = defaultClassId;
          }

          const newCode =
            req.student_code && req.student_code.startsWith('SAG-')
              ? req.student_code
              : `SAG-${Math.floor(10000 + Math.random() * 90000)}`;

          seenNewStudentKeys.add(key);
          studentsToInsert.push({
            first_name: fName,
            last_name: lName,
            class_id: targetClassId,
            student_code: newCode,
            is_archived: false,
          });

          if (!req.class_id && targetClassId) {
            pendingClassUpdates.push({ reqId: req.id, classId: targetClassId });
          }
        }
      }

      // 3. Yalnız çatışmayan şagirdlər varsa tək sorğu ilə əlavə edirik
      if (studentsToInsert.length > 0) {
        const { data: createdStudents, error: crErr } = await supabase
          .from('students')
          .insert(studentsToInsert)
          .select('id, first_name, last_name');

        if (crErr) {
          console.error('Error creating students from approved requests:', crErr);
        } else {
          for (const created of createdStudents || []) {
            const key = `${created.first_name.trim().toLowerCase()}|${created.last_name.trim().toLowerCase()}`;
            studentMap.set(key, created.id);
          }

          if (pendingClassUpdates.length > 0) {
            await Promise.all(
              pendingClassUpdates.map((u) =>
                supabase
                  .from('parent_connection_requests')
                  .update({ class_id: u.classId })
                  .eq('id', u.reqId)
              )
            );
          }
        }
      }

      // 4. Yalnız çatışmayan valideyn-şagird əlaqələrini tək sorğu ilə upsert edirik
      const linksToUpsertMap = new Map<
        string,
        { parent_id: string; student_id: string; relationship_type: string; status: string }
      >();

      for (const req of approvedReqs) {
        if (!req.parent_id) continue;
        const key = `${(req.student_first_name || '').trim().toLowerCase()}|${(req.student_last_name || '').trim().toLowerCase()}`;
        const studentId = studentMap.get(key);
        if (!studentId) continue;

        const linkKey = `${req.parent_id}|${studentId}`;
        if (!existingLinks.has(linkKey) && !linksToUpsertMap.has(linkKey)) {
          linksToUpsertMap.set(linkKey, {
            parent_id: req.parent_id,
            student_id: studentId,
            relationship_type: req.relationship_type || 'valideyn',
            status: 'approved',
          });
        }
      }

      if (linksToUpsertMap.size > 0) {
        await supabase
          .from('parent_student_links')
          .upsert(Array.from(linksToUpsertMap.values()), { onConflict: 'parent_id,student_id' });
      }

      lastSyncAt = Date.now();
    } catch (err) {
      console.error('syncApprovedParentRequests exception:', err);
    } finally {
      inFlightSync = null;
    }
  })();

  return inFlightSync;
}

/**
 * Şagirdi sistemdən tamamilə silir:
 * 1. parent_student_links əlaqələrini silir
 * 2. assessments qeydlərini silir
 * 3. Əlaqəli parent_connection_requests qeydlərini silir (ki, təkrar bərpa olunmasın)
 * 4. students cədvəlindən şagirdi silir
 */
export async function deleteStudentCompletely(id: string, firstName?: string, lastName?: string): Promise<boolean> {
  const supabase = createClient();

  try {
    let fName = firstName;
    let lName = lastName;

    if (!fName || !lName) {
      const { data: st } = await supabase
        .from('students')
        .select('first_name, last_name')
        .eq('id', id)
        .maybeSingle();
      if (st) {
        fName = st.first_name;
        lName = st.last_name;
      }
    }

    // 1. Əlaqəli valideyn bağlantılarını silirik
    await supabase.from('parent_student_links').delete().eq('student_id', id);

    // 2. Qiymətləndirmələri silirik
    await supabase.from('assessments').delete().eq('student_id', id);

    // 3. Əlaqəli valideyn müraciətlərini silirik
    if (fName && lName) {
      await supabase
        .from('parent_connection_requests')
        .delete()
        .ilike('student_first_name', fName.trim())
        .ilike('student_last_name', lName.trim());
    }

    // 4. Şagirdi bazadan silirik
    const { error: delError } = await supabase.from('students').delete().eq('id', id);

    if (delError) {
      console.warn('Direct delete failed, marking archived:', delError);
      await supabase.from('students').update({ is_archived: true }).eq('id', id);
    }

    return true;
  } catch (err) {
    console.error('deleteStudentCompletely error:', err);
    return false;
  }
}
