'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, Calendar } from 'lucide-react';
import { Profile, Student, Assessment } from '@/types';

export default function ParentDevelopmentAreasPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
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
          await loadData(defaultId);
        }
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const loadData = async (childId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('assessments')
      .select('*, subject:subjects(*), feedback_items(*)')
      .eq('student_id', childId)
      .eq('status', 'published')
      .order('assessment_date', { ascending: false });

    setAssessments(data || []);
  };

  const handleChildSelect = async (childId: string) => {
    setSelectedChildId(childId);
    await loadData(childId);
  };

  const developments = assessments.flatMap((a) =>
    (a.feedback_items || [])
      .filter((f) => f.type === 'development_area')
      .map((f) => ({
        ...f,
        subject: a.subject?.name,
        topic: a.topic,
        standard: a.standard,
        date: a.assessment_date,
      }))
  );

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-amber-600" /> İnkişaf Etdirilməli Tərəflər (-)
            </h1>
            <p className="text-sm text-slate-500">
              Şagirdin çətinlik çəkdiyi mövzular və diqqət yetirilməli sahələr
            </p>
          </div>

          {children.length > 1 && (
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
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-2 p-12 text-center text-slate-400">Yüklənir...</div>
          ) : developments.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              Qeydə alınmış çətinlik yoxdur.
            </div>
          ) : (
            developments.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-5 rounded-xl border-2 border-amber-100 hover:border-amber-300 transition-colors shadow-sm flex items-start gap-3.5"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{item.content}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-indigo-600">{item.subject}</span>
                    <span>•</span>
                    <span>{item.topic}</span>
                    <span>•</span>
                    <span>{new Date(item.date).toLocaleDateString('az-AZ')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
