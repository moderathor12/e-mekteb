'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, Plus, Edit, Trash2, Users, UserPlus, ChevronRight } from 'lucide-react';
import { Profile, SchoolClass, Student } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';
import { syncApprovedParentRequests, deleteStudentCompletely } from '@/lib/sync-students';

const CLASS_SECTIONS = ['A', 'B', 'C', 'Ç', 'D', 'E'];

export default function AdminClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal (Sinif əlavə/redaktə)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [name, setName] = useState('5A');
  const [gradeLevel, setGradeLevel] = useState('5');
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Sinfin şagirdlərinə baxış modalı
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<SchoolClass | null>(null);
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);
      await fetchClasses();
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchClasses = async () => {
    // Təsdiqlənmiş valideyn müraciətlərini şagirdlər cədvəlinə sinxron edirik
    await syncApprovedParentRequests();

    const supabase = createClient();
    const [{ data: cls }, { data: students }] = await Promise.all([
      supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
      supabase.from('students').select('class_id, is_archived'),
    ]);

    setClasses(cls || []);

    // Şagird sayları (is_archived true olmayanların hamısını sayırıq)
    const counts: Record<string, number> = {};
    (students || [])
      .filter((s) => s.is_archived !== true)
      .forEach((s) => {
        counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      });
    setStudentCounts(counts);
  };

  const handleOpenClassStudents = async (c: SchoolClass) => {
    setSelectedClassForStudents(c);
    setIsLoadingStudents(true);
    const supabase = createClient();
    const { data: st } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', c.id)
      .order('first_name');

    const activeSt = (st || []).filter((s) => s.is_archived !== true);
    setClassStudents(activeSt);
    setIsLoadingStudents(false);
  };

  const handleDeleteStudentInClass = async (id: string, fullName: string) => {
    if (!confirm(`${fullName} adlı şagirdi sistemdən tamamilə silmək istədiyinizdən əminsiniz?`)) return;

    // UI-dan dərhal çıxarırıq
    setClassStudents((prev) => prev.filter((s) => s.id !== id));

    const parts = fullName.trim().split(' ');
    const fName = parts[0] || '';
    const lName = parts.slice(1).join(' ') || '';

    await deleteStudentCompletely(id, fName, lName);

    if (selectedClassForStudents) {
      await handleOpenClassStudents(selectedClassForStudents);
    }
    await fetchClasses();
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setGradeLevel('5');
    setSection('A');
    setName('5A');
    setAcademicYear('2026-2027');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: SchoolClass) => {
    setEditingClass(c);
    setName(c.name);
    setGradeLevel(c.grade_level.toString());
    const match = c.name.trim().match(/^(\d+)\s*([A-ZƏÇĞİÖŞÜa-zəçğıöşü]+)$/);
    setSection(match ? match[2].toUpperCase() : '');
    setAcademicYear(c.academic_year);
    setIsModalOpen(true);
  };

  const handleGradeLevelChange = (newGrade: string) => {
    setGradeLevel(newGrade);
    setName(section ? `${newGrade}${section}` : newGrade);
  };

  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    setName(newSection ? `${gradeLevel}${newSection}` : gradeLevel);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    if (editingClass) {
      const { error } = await supabase
        .from('classes')
        .update({
          name: name.trim().toUpperCase(),
          grade_level: parseInt(gradeLevel, 10),
          academic_year: academicYear.trim(),
        })
        .eq('id', editingClass.id);

      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('classes').insert({
        name: name.trim().toUpperCase(),
        grade_level: parseInt(gradeLevel, 10),
        academic_year: academicYear.trim(),
      });

      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    await fetchClasses();
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Bu sinfi arxivləşdirmək istədiyinizdən əminsiniz?')) return;
    const supabase = createClient();
    await supabase.from('classes').update({ is_archived: true }).eq('id', id);
    await fetchClasses();
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Siniflər</h1>
            <p className="text-sm text-slate-500">Məktəb sinifləri və şagird kontingenti</p>
          </div>
          <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Sinif Əlavə Et
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 p-12 text-center text-slate-400">Yüklənir...</div>
          ) : classes.length === 0 ? (
            <div className="col-span-3 p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              Heç bir sinif tapılmadı.
            </div>
          ) : (
            classes.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenClassStudents(c)}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center text-center p-1 leading-tight group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {c.name}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {formatClassName(c.name)}
                      </h3>
                      <p className="text-xs text-slate-500">{c.grade_level}-ci sinif • {c.academic_year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                      title="Redaktə et"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                      title="Arxivləşdir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:underline">
                    <Users className="w-4 h-4" /> {studentCounts[c.id] || 0} şagird • Siyahıya bax →
                  </span>
                  <Badge variant="blue">{c.academic_year}</Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Əlavə / Redaktə Modalı */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingClass ? 'Sinif Məlumatlarını Yenilə' : 'Yeni Sinif Əlavə Et'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sinif pilləsi (1 - 11) *</label>
                <select
                  required
                  value={gradeLevel}
                  onChange={(e) => handleGradeLevelChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}-ci sinif
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sinif kateqoriyası *</label>
                <select
                  value={section}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {CLASS_SECTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {gradeLevel}{sec} ({sec} bölməsi)
                    </option>
                  ))}
                  {section && !CLASS_SECTIONS.includes(section) && (
                    <option value={section}>
                      {gradeLevel}{section} ({section} bölməsi)
                    </option>
                  )}
                  <option value="">Bölməsiz (fərdi ad)</option>
                </select>
              </div>
            </div>

            <Input
              label="Sinfin Adı *"
              required
              placeholder="Məs: 5A, 9B, 10C"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Tədris İli *"
              required
              placeholder="2026-2027"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                İmtina
              </Button>
              <Button type="submit" variant="primary">
                Yadda saxla
              </Button>
            </div>
          </form>
        </Modal>

        {/* Sinfin Şagirdləri Modalı */}
        <Modal
          isOpen={!!selectedClassForStudents}
          onClose={() => setSelectedClassForStudents(null)}
          title={`${formatClassName(selectedClassForStudents?.name)} — Şagirdlər Siyahısı`}
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
                <p className="text-slate-400 text-xs mt-1">Valideyn müraciəti təsdiqləndikdə və ya admin tərəfindən əlavə olunduqda burada görünəcək.</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Şagird</th>
                      <th className="px-4 py-2.5">Kod</th>
                      <th className="px-4 py-2.5">Cins</th>
                      <th className="px-4 py-2.5 text-right">Əməliyyat</th>
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
                        <td className="px-4 py-3 text-slate-600">
                          {st.gender === 'male' ? 'Kişi' : st.gender === 'female' ? 'Qadın' : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteStudentInClass(st.id, `${st.first_name} ${st.last_name}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                            title="Şagirdi sil"
                          >
                            <Trash2 className="w-3 h-3" /> Sil
                          </button>
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
