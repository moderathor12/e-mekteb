'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserCheck, Search, CalendarCheck, History } from 'lucide-react';
import { Profile, Student, SchoolClass } from '@/types';

export default function TeacherStudentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const [stRes, clsRes] = await Promise.all([
          supabase.from('students').select('*, class:classes(*)').eq('is_archived', false).order('first_name'),
          supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
        ]);

        setStudents(stRes.data || []);
        setClasses(clsRes.data || []);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const filtered = students.filter((s) => {
    const fullName = `${s.first_name} ${s.last_name} ${s.father_name || ''} ${s.student_code}`.toLowerCase();
    const matchSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase());
    const matchClass = !selectedClass || s.class_id === selectedClass;
    return matchSearch && matchClass;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Şagirdlər</h1>
            <p className="text-sm text-slate-500">
              Tədris apardığınız siniflərin şagirdləri və fərdi qiymətləndirməyə keçid
            </p>
          </div>
        </div>

        {/* Axtarış və Filtr */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                placeholder="Şagirdin adı, soyadı və ya şagird kodu ilə axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Bütün siniflər</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} sinfi
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Şagirdlər Siyahısı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Şagird Kodu</th>
                <th className="px-6 py-3.5">Adı, Soyadı</th>
                <th className="px-6 py-3.5">Sinif</th>
                <th className="px-6 py-3.5 text-right">Fərdi Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Şagird tapılmadı.
                  </td>
                </tr>
              ) : (
                filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                      {st.student_code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {st.first_name} {st.last_name} {st.father_name ? `(${st.father_name} qızı/oğlu)` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                        {st.class?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/teacher/assessments/new?class=${st.class_id}&student=${st.id}`}>
                          <Button variant="primary" size="sm" className="gap-1.5">
                            <CalendarCheck className="w-3.5 h-3.5" /> Qiymətləndir
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
