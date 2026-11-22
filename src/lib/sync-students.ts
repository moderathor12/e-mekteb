import { createClient } from '@/lib/supabase/client';
import { Student } from '@/types';

/**
 * Təsdiqlənmiş valideyn müraciətlərini yoxlayır və students / parent_student_links
 * cədvəllərində çatışmayan şagird qeydlərini avtomatik bərpa edir.
 */
export async function syncApprovedParentRequests(): Promise<void> {
  const supabase = createClient();

  try {
    // 1. Təsdiqlənmiş müraciətləri alırıq
    const { data: approvedReqs, error: reqErr } = await supabase
      .from('parent_connection_requests')
      .select('*')
      .eq('status', 'approved');

    if (reqErr || !approvedReqs || approvedReqs.length === 0) return;

    // 2. Mövcud şagirdləri və aktiv sinifləri alırıq
    const [stRes, clsRes] = await Promise.all([
      supabase.from('students').select('*'),
      supabase.from('classes').select('*').order('grade_level'),
    ]);

    const existingStudents = stRes.data || [];
    const availableClasses = (clsRes.data || []).filter((c) => c.is_archived !== true);
    const defaultClassId = availableClasses[0]?.id || clsRes.data?.[0]?.id;

    for (const req of approvedReqs) {
      const fName = (req.student_first_name || '').trim().toLowerCase();
      const lName = (req.student_last_name || '').trim().toLowerCase();

      // Mövcud şagirdi axtarırıq
      let student = existingStudents.find(
        (s) =>
          s.first_name.trim().toLowerCase() === fName &&
          s.last_name.trim().toLowerCase() === lName
      );

      // Əgər şagird yoxdursa və sinif mövcuddursa, yaradırıq
      if (!student && defaultClassId) {
        let targetClassId = req.class_id;

        // Əgər müraciətdə class_id yoxdursa amma student_code və ya başqa ipucu varsa
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

        const { data: created, error: crErr } = await supabase
          .from('students')
          .insert({
            first_name: req.student_first_name.trim(),
            last_name: req.student_last_name.trim(),
            class_id: targetClassId,
            student_code: newCode,
            is_archived: false,
          })
          .select('*')
          .maybeSingle();

        if (created) {
          student = created;
          existingStudents.push(created);

          // Əgər müraciətdə class_id boş idisə, onu da sinifə bağlayaq
          if (!req.class_id && targetClassId) {
            await supabase
              .from('parent_connection_requests')
              .update({ class_id: targetClassId })
              .eq('id', req.id);
          }
        } else if (crErr) {
          console.error('Error creating student from approved request:', crErr);
        }
      }

      // Əgər şagird tapıldısa və ya yaradıldısa, parent_student_links cədvəlində bağlayırıq
      if (student && req.parent_id) {
        await supabase.from('parent_student_links').upsert(
          {
            parent_id: req.parent_id,
            student_id: student.id,
            relationship_type: req.relationship_type || 'valideyn',
            status: 'approved',
          },
          { onConflict: 'parent_id,student_id' }
        );
      }
    }
  } catch (err) {
    console.error('syncApprovedParentRequests exception:', err);
  }
}
