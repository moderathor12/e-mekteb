'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Profile, SchoolClass } from '@/types';

export default function AdminClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('5');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        await fetchClasses();
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchClasses = async () => {
    const supabase = createClient();
    const { data: cls } = await supabase
      .from('classes')
      .select('*')
      .eq('is_archived', false)
      .order('grade_level');

    setClasses(cls || []);

    // Şagird sayları
    const { data: students } = await supabase.from('students').select('class_id').eq('is_archived', false);
    const counts: Record<string, number> = {};
    (students || []).forEach((s) => {
      counts[s.class_id] = (counts[s.class_id] || 0) + 1;
    });
    setStudentCounts(counts);
  };

  const handleOpenAdd = () => {
    setEditingClass(null);
    setName('');
    setGradeLevel('5');
    setAcademicYear('2026-2027');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: SchoolClass) => {
    setEditingClass(c);
    setName(c.name);
    setGradeLevel(c.grade_level.toString());
    setAcademicYear(c.academic_year);
    setIsModalOpen(true);
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
              <Card key={c.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-lg flex items-center justify-center">
                      {c.name}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{c.name} sinfi</h3>
                      <p className="text-xs text-slate-500">{c.grade_level}-ci sinif • {c.academic_year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-4 h-4 text-slate-400" /> {studentCounts[c.id] || 0} şagird
                  </span>
                  <Badge variant="blue">{c.academic_year}</Badge>
                </div>
              </Card>
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
            <Input
              label="Sinfin Adı *"
              required
              placeholder="Məs: 5A, 6B, 10C"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sinif pilləsi (1 - 11) *</label>
              <select
                required
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}-ci sinif
                  </option>
                ))}
              </select>
            </div>

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
      </div>
    </DashboardLayout>
  );
}
