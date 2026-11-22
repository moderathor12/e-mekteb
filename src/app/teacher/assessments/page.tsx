'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Plus, Search, Filter, Eye, Printer, Edit, Trash2 } from 'lucide-react';
import { Profile, Assessment, SchoolClass, Subject } from '@/types';

export default function TeacherAssessmentsHistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Filtrlər
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const [cls, sub] = await Promise.all([
          supabase.from('classes').select('*').eq('is_archived', false),
          supabase.from('subjects').select('*').eq('is_archived', false),
        ]);
        setClasses(cls.data || []);
        setSubjects(sub.data || []);

        await fetchAssessments();
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchAssessments = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('assessments')
      .select('*, student:students(*), subject:subjects(*), class:classes(*)')
      .order('assessment_date', { ascending: false });

    setAssessments(data || []);
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchClass = !selectedClass || a.class_id === selectedClass;
    const matchSubject = !selectedSubject || a.subject_id === selectedSubject;
    const matchStatus = !selectedStatus || a.status === selectedStatus;
    const fullName = `${a.student?.first_name || ''} ${a.student?.last_name || ''}`.toLowerCase();
    const matchSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase()) || a.topic.toLowerCase().includes(searchTerm.toLowerCase()) || a.standard.toLowerCase().includes(searchTerm.toLowerCase());

    return matchClass && matchSubject && matchStatus && matchSearch;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Qiymətləndirmə Tarixçəsi</h1>
            <p className="text-sm text-slate-500">
              Bütün fərdi jurnal qeydləri, axtarış və arxiv
            </p>
          </div>
          <Link href="/teacher/assessments/new">
            <Button variant="primary" className="gap-2">
              <Plus className="w-4 h-4" /> Yeni Qiymətləndirmə
            </Button>
          </Link>
        </div>

        {/* Filtrlər */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Şagird adı və ya mövzu ilə axtar..."
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

            <div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Bütün fənlər</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Bütün statuslar</option>
                <option value="published">Dərc edilib</option>
                <option value="draft">Qaralama</option>
                <option value="archived">Arxiv</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Cədvəl Siyahısı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Şagird</th>
                  <th className="px-6 py-3.5">Sinif</th>
                  <th className="px-6 py-3.5">Fənn</th>
                  <th className="px-6 py-3.5">Mövzu / Standart</th>
                  <th className="px-6 py-3.5">Tarix</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Yüklənir...
                    </td>
                  </tr>
                ) : filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                      Heç bir qiymətləndirmə tapılmadı.
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {item.student ? `${item.student.first_name} ${item.student.last_name}` : '—'}
                        <span className="block text-xs font-normal text-slate-400">
                          {item.student?.student_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{item.class?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-700">{item.subject?.name || '—'}</td>
                      <td className="px-6 py-4 text-slate-700 max-w-xs truncate">
                        <span className="font-medium text-slate-900 block truncate">{item.topic}</span>
                        <span className="text-xs text-slate-500 font-mono">{item.standard}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {new Date(item.assessment_date).toLocaleDateString('az-AZ')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={item.status === 'published' ? 'emerald' : item.status === 'draft' ? 'slate' : 'amber'}>
                          {item.status === 'published' ? 'Dərc edilib' : item.status === 'draft' ? 'Qaralama' : 'Arxiv'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/teacher/assessments/${item.id}`}>
                            <button
                              title="Jurnal vərəqinə bax və çap et"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`/teacher/assessments/${item.id}/edit`}>
                            <button
                              title="Redaktə et"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
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
      </div>
    </DashboardLayout>
  );
}
