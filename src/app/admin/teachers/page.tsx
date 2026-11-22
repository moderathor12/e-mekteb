'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Users, Plus, BookOpen, GraduationCap, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Profile, SchoolClass, Subject, TeacherAssignment } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';

export default function AdminTeachersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal üçün state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);
      await fetchData();
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();
    const [tchs, cls, subs, asg] = await Promise.all([
      supabase.from('profiles').select('*').in('role', ['teacher', 'admin']).order('first_name'),
      supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
      supabase.from('subjects').select('*').eq('is_archived', false).order('name'),
      supabase.from('teacher_assignments').select('*, teacher:profiles!teacher_id(*), class:classes(*), subject:subjects(*)'),
    ]);

    setTeachers(tchs.data || []);
    setClasses(cls.data || []);
    setSubjects(subs.data || []);
    setAssignments(asg.data || []);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedClassId || !selectedSubjectId) {
      alert('Zəhmət olmasa bütün xanaları seçin!');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('teacher_assignments').insert({
      teacher_id: selectedTeacherId,
      class_id: selectedClassId,
      subject_id: selectedSubjectId,
      academic_year: '2026-2027',
    });

    if (error) {
      alert('Xəta baş verdi: ' + error.message);
    } else {
      alert('Müəllim uğurla sinif və fənnə təyin olundu!');
      setIsAssignModalOpen(false);
      await fetchData();
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Bu təyinatı silmək istədiyinizdən əminsiniz?')) return;
    const supabase = createClient();
    await supabase.from('teacher_assignments').delete().eq('id', id);
    await fetchData();
  };

  const handleDeleteTeacher = async (teacherId: string, teacherName: string, role: string) => {
    if (role === 'admin') {
      alert('Administrator hesabını silmək təhlükəsizlik səbəbindən qadağandır!');
      return;
    }
    if (!confirm(`${teacherName} adlı müəllimi sistemdən silmək istədiyinizdən əminsiniz?`)) return;

    const supabase = createClient();
    // first clean up assignments
    await supabase.from('teacher_assignments').delete().eq('teacher_id', teacherId);
    const { error } = await supabase.from('profiles').delete().eq('id', teacherId);
    if (error) {
      await supabase.from('profiles').update({ is_active: false }).eq('id', teacherId);
      alert('Müəllim deaktiv edildi (əlaqəli qiymətləndirmə qeydləri qorundu).');
    } else {
      alert('Müəllim uğurla silindi.');
    }
    await fetchData();
  };

  const handleToggleStatus = async (teacherId: string, currentStatus?: boolean) => {
    const isCurrentlyActive = currentStatus !== false;
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isCurrentlyActive })
      .eq('id', teacherId);

    if (error) {
      alert('Xəta: ' + error.message);
    } else {
      alert(!isCurrentlyActive ? 'Müəllim hesabı aktivləşdirildi!' : 'Müəllim hesabı deaktiv edildi.');
      await fetchData();
    }
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Müəllimlər və Təyinatlar</h1>
            <p className="text-sm text-slate-500">Məktəb müəllimlərinin siniflər və fənlər üzrə təyinatı</p>
          </div>
          <Button variant="primary" onClick={() => setIsAssignModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Sinif-Fənn Təyinatı
          </Button>
        </div>

        {/* Müəllimlər Siyahısı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Müəllim</th>
                <th className="px-6 py-3.5">E-poçt</th>
                <th className="px-6 py-3.5">Rol</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Təyin Olunduğu Siniflər və Fənlər</th>
                <th className="px-6 py-3.5 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Müəllim tapılmadı.
                  </td>
                </tr>
              ) : (
                teachers.map((t) => {
                  const teacherAssignments = assignments.filter((a) => a.teacher_id === t.id);
                  const isActive = t.is_active !== false;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {t.first_name} {t.last_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">{t.email}</td>
                      <td className="px-6 py-4">
                        <Badge variant={t.role === 'admin' ? 'purple' : 'blue'}>
                          {t.role === 'admin' ? 'Admin' : 'Müəllim'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.id, t.is_active)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold border border-rose-200'
                          }`}
                          title="Statusu dəyişmək üçün klikləyin"
                        >
                          {isActive ? 'Aktiv' : 'Deaktiv (Aktiv et)'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {teacherAssignments.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Təyinat yoxdur</span>
                          ) : (
                            teacherAssignments.map((asg) => (
                              <span
                                key={asg.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs"
                              >
                                <strong>{asg.class?.name}</strong> • {asg.subject?.name}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(asg.id)}
                                  className="text-slate-400 hover:text-rose-600 ml-1"
                                  title="Təyinatı sil"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {t.role === 'admin' ? (
                          <span className="text-xs text-slate-400 font-medium italic">Qorunur (Admin)</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteTeacher(t.id, `${t.first_name} ${t.last_name}`, t.role)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                            title="Müəllimi sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Sil
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Təyinat Modalı */}
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Müəllimə Sinif və Fənn Təyin Et"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Müəllim *</label>
              <select
                required
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Müəllim seçin</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name} ({t.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sinif *</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Sinif seçin</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatClassName(c.name)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fənn *</label>
              <select
                required
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Fənn seçin</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsAssignModalOpen(false)}>
                İmtina
              </Button>
              <Button type="submit" variant="primary">
                Təyinatı Təsdiqlə
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
