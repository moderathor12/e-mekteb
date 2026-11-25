'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { GraduationCap, Users, CalendarCheck, ArrowRight, Trash2 } from 'lucide-react';
import { Profile, SchoolClass, Student } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';
import { syncApprovedParentRequests, deleteStudentCompletely } from '@/lib/sync-students';

export default function TeacherClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Sinif şagirdləri modalı
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<SchoolClass | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const fetchClassesAndStudents = async () => {
    await syncApprovedParentRequests();

    const supabase = createClient();
    const [clsRes, stRes] = await Promise.all([
      supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
      supabase.from('students').select('*').order('first_name'),
    ]);

    setClasses(clsRes.data || []);

    const grouped: Record<string, Student[]> = {};
    (stRes.data || [])
      .filter((st) => st.is_archived !== true)
      .forEach((st) => {
        if (!grouped[st.class_id]) grouped[st.class_id] = [];
        grouped[st.class_id].push(st);
      });
    setStudentsByClass(grouped);
    setIsLoading(false);
  };

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);
      await fetchClassesAndStudents();
    }

    load();
  }, []);

  const handleOpenClassStudents = async (c: SchoolClass) => {
    setSelectedClassForStudents(c);
    setIsLoadingStudents(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', c.id)
      .order('first_name');

    if (error) {
      console.error(error);
    }
    setClassStudents((data || []).filter((st) => st.is_archived !== true));
    setIsLoadingStudents(false);
  };

  const handleDeleteStudentInClass = async (id: string, fullName: string) => {
    if (!confirm(`"${fullName}" adlı şagirdi sistemdən tamamilə silmək istədiyinizə əminsiniz?`)) {
      return;
    }

    const parts = fullName.trim().split(' ');
    const fName = parts[0] || '';
    const lName = parts.slice(1).join(' ') || '';

    await deleteStudentCompletely(id, fName, lName);

    if (selectedClassForStudents) {
      await handleOpenClassStudents(selectedClassForStudents);
    }
    await fetchClassesAndStudents();
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Siniflərim</h1>
          <p className="text-sm text-slate-500">Tədris etdiyiniz siniflər və şagird kontingenti</p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Yüklənir...</div>
        ) : classes.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-slate-500">Heç bir sinif tapılmadı.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const students = studentsByClass[cls.id] || [];
              return (
                <Card
                  key={cls.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleOpenClassStudents(cls)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center text-center p-1 leading-tight group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {cls.name}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {formatClassName(cls.name)}
                        </h3>
                        <p className="text-xs text-slate-500">{cls.grade_level}-ci sinif • {cls.academic_year}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenClassStudents(cls)}
                      className="flex items-center gap-1 font-medium text-slate-700 hover:text-indigo-600 hover:underline cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-slate-400" /> {students.length} şagird
                    </button>
                    <Link href={`/teacher/assessments/new?class=${cls.id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" /> Qiymətləndir
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Sinfin Şagirdləri Modalı */}
        <Modal
          isOpen={!!selectedClassForStudents}
          onClose={() => setSelectedClassForStudents(null)}
          title={`${formatClassName(selectedClassForStudents?.name)} — Şagirdlər Siyahısı`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span>{selectedClassForStudents?.grade_level}-ci sinif • {selectedClassForStudents?.academic_year}</span>
              <span className="font-semibold text-slate-700">Cəmi: {classStudents.length} şagird</span>
            </div>

            {isLoadingStudents ? (
              <div className="py-8 text-center text-slate-400">Şagirdlər yüklənir...</div>
            ) : classStudents.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">Bu sinifdə hələ heç bir şagird qeydiyyatda deyil.</p>
                <p className="text-slate-400 text-xs mt-1">Valideyn müraciəti təsdiqləndikdə avtomatik burada görünəcək.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto overflow-x-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Şagird</th>
                      <th className="px-4 py-2.5">Kod</th>
                      <th className="px-4 py-2.5 text-right">Əməliyyatlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {st.first_name} {st.last_name} {st.father_name ? `(${st.father_name} qızı/oğlu)` : ''}
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-600 font-medium">
                          {st.student_code}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link href={`/teacher/assessments/new?class=${selectedClassForStudents?.id}&student=${st.id}`}>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200"
                              >
                                <CalendarCheck className="w-3 h-3" /> Qiymətləndir
                              </button>
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudentInClass(st.id, `${st.first_name} ${st.last_name}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                              title="Şagirdi sil"
                            >
                              <Trash2 className="w-3 h-3" /> Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="secondary" onClick={() => setSelectedClassForStudents(null)}>
                Bağla
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
