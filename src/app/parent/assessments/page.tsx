'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FileCheck2, Eye, Printer, Calendar } from 'lucide-react';
import { Profile, Student, Assessment, Subject } from '@/types';

export default function ParentAssessmentsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const { data: links } = await supabase
          .from('parent_student_links')
          .select('*, student:students(*, class:classes(*))')
          .eq('parent_id', user.id)
          .eq('status', 'approved');

        const studentList = (links?.map((l) => l.student).filter(Boolean) || []) as Student[];
        setChildren(studentList);

        if (studentList.length > 0) {
          const defaultId = studentList[0].id;
          setSelectedChildId(defaultId);
          await loadAssessments(defaultId);
        }

        const { data: subs } = await supabase.from('subjects').select('*').eq('is_archived', false);
        setSubjects(subs || []);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const loadAssessments = async (childId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('assessments')
      .select('*, subject:subjects(*), class:classes(*), teacher:profiles!teacher_id(*), feedback_items(*)')
      .eq('student_id', childId)
      .eq('status', 'published')
      .order('assessment_date', { ascending: false });

    setAssessments(data || []);
  };

  const handleChildSelect = async (childId: string) => {
    setSelectedChildId(childId);
    await loadAssessments(childId);
  };

  const filtered = assessments.filter((a) => {
    return !selectedSubject || a.subject_id === selectedSubject;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Qiymətləndirmələr</h1>
            <p className="text-sm text-slate-500">
              Müəllimlər tərəfindən yazılmış rəsmi qiymətləndirmə vərəqələri
            </p>
          </div>

          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Övlad seçin:</span>
              <select
                value={selectedChildId}
                onChange={(e) => handleChildSelect(e.target.value)}
                className="px-3 py-1.5 text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg"
              >
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.class?.name})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Fənn Filtri */}
        <Card>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-72">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Bütün fənlər</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-slate-500">
              Cəmi {filtered.length} qiymətləndirmə tapıldı
            </span>
          </div>
        </Card>

        {/* Siyahı */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Fənn</th>
                <th className="px-6 py-3.5">Mövzu / Standart</th>
                <th className="px-6 py-3.5">Tarix</th>
                <th className="px-6 py-3.5">Müəllim</th>
                <th className="px-6 py-3.5 text-right">Jurnal Vərəqi</th>
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
                    Qiymətləndirmə tapılmadı.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.subject?.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900 block">{item.topic}</span>
                      <span className="text-xs text-slate-500 font-mono">{item.standard}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {new Date(item.assessment_date).toLocaleDateString('az-AZ')}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700">
                      {item.teacher ? `${item.teacher.first_name} ${item.teacher.last_name}` : 'Müəllim'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/parent/assessments/${item.id}`}>
                        <Button variant="primary" size="sm" className="gap-1.5">
                          <Eye className="w-4 h-4" /> Vərəqə bax
                        </Button>
                      </Link>
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
