'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { UserCheck, Plus, Search, Edit, Trash2, Key } from 'lucide-react';
import { Profile, Student, SchoolClass } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';

export default function AdminStudentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [classId, setClassId] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

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
    const [stRes, clsRes] = await Promise.all([
      supabase.from('students').select('*, class:classes(*)').eq('is_archived', false).order('first_name'),
      supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
    ]);

    setStudents(stRes.data || []);
    setClasses(clsRes.data || []);
  };

  const generateCode = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    return `SAG-${randomDigits}`;
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFirstName('');
    setLastName('');
    setFatherName('');
    setClassId(classes[0]?.id || '');
    setStudentCode(generateCode());
    setGender('male');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFirstName(s.first_name);
    setLastName(s.last_name);
    setFatherName(s.father_name || '');
    setClassId(s.class_id);
    setStudentCode(s.student_code);
    setGender(s.gender || 'male');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    if (editingStudent) {
      const { error } = await supabase
        .from('students')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          father_name: fatherName.trim() || null,
          class_id: classId,
          student_code: studentCode.trim().toUpperCase(),
          gender,
        })
        .eq('id', editingStudent.id);

      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('students').insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        father_name: fatherName.trim() || null,
        class_id: classId,
        student_code: studentCode.trim().toUpperCase(),
        gender,
      });

      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    await fetchData();
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Bu şagirdi arxivləşdirmək istədiyinizdən əminsiniz?')) return;
    const supabase = createClient();
    await supabase.from('students').update({ is_archived: true }).eq('id', id);
    await fetchData();
  };

  const filtered = students.filter((s) => {
    const nameMatch = `${s.first_name} ${s.last_name} ${s.student_code}`.toLowerCase().includes(searchTerm.toLowerCase());
    const classMatch = !selectedClassFilter || s.class_id === selectedClassFilter;
    return nameMatch && classMatch;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Şagirdlərin İdarə Edilməsi</h1>
            <p className="text-sm text-slate-500">Məktəb şagirdlərinin qeydiyyatı və unikal təhlükəsizlik kodları</p>
          </div>
          <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Şagird Əlavə Et
          </Button>
        </div>

        {/* Filtr və Axtarış */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                placeholder="Şagird adı və ya kodu ilə axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Bütün siniflər</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatClassName(c.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Cədvəl */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Şagird Kodu (Valideyn üçün)</th>
                <th className="px-6 py-3.5">Adı, Soyadı, Ata adı</th>
                <th className="px-6 py-3.5">Sinif</th>
                <th className="px-6 py-3.5">Cins</th>
                <th className="px-6 py-3.5 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Şagird tapılmadı.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-100">
                        {s.student_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {s.first_name} {s.last_name} {s.father_name ? `(${s.father_name})` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                        {s.class?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {s.gender === 'female' ? 'Qız' : 'Oğlan'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                          title="Redaktə et"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                          title="Arxivləşdir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStudent ? 'Şagird Məlumatlarını Yenilə' : 'Yeni Şagird Əlavə Et'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ad *"
                required
                placeholder="Məs: Aylin"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Soyad *"
                required
                placeholder="Məs: Həsənli"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <Input
              label="Ata adı"
              placeholder="Məs: Rəşad"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sinif *</label>
              <select
                required
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Cins</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="male">Oğlan</option>
                <option value="female">Qız</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Unikal Şagird Kodu *
                </label>
                <button
                  type="button"
                  onClick={() => setStudentCode(generateCode())}
                  className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> Yeni kod generasiya et
                </button>
              </div>
              <Input
                required
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                helperText="Bu kod valideynə verilir və yalnız həmin valideyn şagirdi profilinə bağlaya bilir."
              />
            </div>

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
