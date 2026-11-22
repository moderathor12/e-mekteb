'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileSpreadsheet, Download, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { Profile, Assessment, SchoolClass, Subject } from '@/types';

export default function TeacherReportsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const [cls, sub, asm] = await Promise.all([
          supabase.from('classes').select('*').eq('is_archived', false),
          supabase.from('subjects').select('*').eq('is_archived', false),
          supabase
            .from('assessments')
            .select('*, student:students(*), subject:subjects(*), class:classes(*), feedback_items(*)')
            .eq('status', 'published')
            .order('assessment_date', { ascending: false }),
        ]);

        setClasses(cls.data || []);
        setSubjects(sub.data || []);
        setAssessments(asm.data || []);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const filtered = assessments.filter((a) => {
    const matchClass = !selectedClass || a.class_id === selectedClass;
    const matchSubject = !selectedSubject || a.subject_id === selectedSubject;
    return matchClass && matchSubject;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Formativ Qiymətləndirmə Hesabatları</h1>
            <p className="text-sm text-slate-500">
              Şagirdlərin keyfiyyət və inkişaf dinamikasının fərdi xülasəsi
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 no-print">
            <Printer className="w-4 h-4" /> Çap et
          </Button>
        </div>

        {/* Filtrlər */}
        <Card className="no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sinif</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fənn</label>
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
          </div>
        </Card>

        {/* Hesabat Vərəqələri */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400">Hesabatlar hazırlanır...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <div className="text-center py-8 text-slate-500">
                Seçilmiş meyarlar üzrə dərc edilmiş qiymətləndirmə tapılmadı.
              </div>
            </Card>
          ) : (
            filtered.map((item) => {
              const positives = item.feedback_items?.filter((f) => f.type === 'positive') || [];
              const developments = item.feedback_items?.filter((f) => f.type === 'development_area') || [];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {item.student ? `${item.student.first_name} ${item.student.last_name}` : 'Şagird'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.class?.name} sinfi • {item.subject?.name} • Mövzu: <strong>{item.topic}</strong> ({item.standard})
                      </p>
                    </div>
                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
                      {new Date(item.assessment_date).toLocaleDateString('az-AZ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3">
                      <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Müsbət Nailiyyətlər (+)
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {positives.map((p, i) => (
                          <li key={i}>{p.content}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3">
                      <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> İnkişaf Sahələri (-)
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {developments.map((d, i) => (
                          <li key={i}>{d.content}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {item.next_step && (
                    <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-100">
                      <strong className="text-slate-700">Müəllim qeydi:</strong> {item.next_step}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
