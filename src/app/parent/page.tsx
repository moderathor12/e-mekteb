'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Award,
  AlertTriangle,
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserPlus,
  BookOpen
} from 'lucide-react';
import { Profile, Student, Assessment } from '@/types';

export default function ParentDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        // 1. Təsdiqlənmiş övladları yüklə (parent_student_links vasitəsilə)
        const { data: links } = await supabase
          .from('parent_student_links')
          .select('*, student:students(*, class:classes(*))')
          .eq('parent_id', user.id)
          .eq('status', 'approved');

        const studentList = (links?.map((l) => l.student).filter(Boolean) || []) as Student[];
        setChildren(studentList);

        if (studentList.length > 0) {
          const defaultChildId = studentList[0].id;
          setSelectedChildId(defaultChildId);
          await loadAssessmentsForChild(defaultChildId);
        }

        // 2. Gözləyən müraciətlər
        const { count: pendingCount } = await supabase
          .from('parent_connection_requests')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', user.id)
          .eq('status', 'pending');

        setPendingRequestsCount(pendingCount || 0);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const loadAssessmentsForChild = async (childId: string) => {
    const supabase = createClient();
    const { data: asm } = await supabase
      .from('assessments')
      .select('*, subject:subjects(*), class:classes(*), teacher:profiles(*), feedback_items(*)')
      .eq('student_id', childId)
      .eq('status', 'published')
      .order('assessment_date', { ascending: false });

    setAssessments(asm || []);
  };

  const handleChildChange = async (childId: string) => {
    setSelectedChildId(childId);
    await loadAssessmentsForChild(childId);
  };

  const currentChild = children.find((c) => c.id === selectedChildId);
  const latestAssessment = assessments[0];

  // Müsbət və inkişaf sahələri xülasəsi
  const allPositives = assessments.flatMap((a) =>
    (a.feedback_items || [])
      .filter((f) => f.type === 'positive')
      .map((f) => ({ ...f, subject: a.subject?.name, date: a.assessment_date }))
  );

  const allDevelopments = assessments.flatMap((a) =>
    (a.feedback_items || [])
      .filter((f) => f.type === 'development_area')
      .map((f) => ({ ...f, subject: a.subject?.name, date: a.assessment_date }))
  );

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        {/* Qarşılama və Övlad Seçimi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Salam, {profile ? `${profile.first_name} valideyn` : 'Valideyn'}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Övladınızın məktəbdəki gündəlik fərdi T-Şkala qiymətləndirmə nəticələri
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {children.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Övlad seçin:</span>
                <select
                  value={selectedChildId}
                  onChange={(e) => handleChildChange(e.target.value)}
                  className="px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.class?.name})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Link href="/parent/connect">
              <Button variant="outline" size="sm" className="gap-1.5">
                <UserPlus className="w-4 h-4" /> Şagird Kodu Daxil Et
              </Button>
            </Link>
          </div>
        </div>

        {/* Əgər heç bir təsdiqlənmiş uşaq yoxdursa */}
        {children.length === 0 && !isLoading && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hesabınıza heç bir şagird bağlanmayıb</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Övladınızın formativ qiymətləndirmə jurnalını görmək üçün məktəb tərəfindən sizə təqdim edilmiş unikal şagird kodunu daxil edin.
            </p>
            {pendingRequestsCount > 0 ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
                <Clock className="w-4 h-4" />
                <span>Göndərdiyiniz {pendingRequestsCount} müraciət hazırda məktəb rəhbərliyinin təsdiqindədir.</span>
              </div>
            ) : (
              <Link href="/parent/connect" className="inline-block mt-2">
                <Button variant="primary">
                  <UserPlus className="w-4 h-4 mr-2" /> Şagird Bağlama Müraciəti Göndər
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Əgər övlad seçilibsə */}
        {currentChild && (
          <>
            {/* Şagird Kartı və Statistik Göstəricilər */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                  {currentChild.first_name[0]}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Şagird</span>
                  <h3 className="text-base font-bold text-slate-900">
                    {currentChild.first_name} {currentChild.last_name}
                  </h3>
                  <span className="text-xs text-indigo-600 font-semibold">{currentChild.class?.name} sinfi</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Nailiyyətlər (+)</span>
                  <p className="text-2xl font-bold text-slate-900">{allPositives.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">İnkişaf Sahələri (-)</span>
                  <p className="text-2xl font-bold text-slate-900">{allDevelopments.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">Qiymətləndirmələr</span>
                  <p className="text-2xl font-bold text-slate-900">{assessments.length}</p>
                </div>
              </div>
            </div>

            {/* Ən Son T-Şkala Qiymətləndirməsi */}
            {latestAssessment ? (
              <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                        Ən Son Qiymətləndirmə
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {latestAssessment.subject?.name}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Mövzu: {latestAssessment.topic}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standart: <span className="font-mono">{latestAssessment.standard}</span> • Tarix: {new Date(latestAssessment.assessment_date).toLocaleDateString('az-AZ')} • Müəllim: {latestAssessment.teacher ? `${latestAssessment.teacher.first_name} ${latestAssessment.teacher.last_name}` : 'Müəllim'}
                    </p>
                  </div>

                  <Link href={`/parent/assessments/${latestAssessment.id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5">
                      Rəsmi Vərəqə Bax <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* Ən son qeydin müsbət və inkişaf bəndləri */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Müsbət tərəflər (+) / Nailiyyətlər
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-800">
                      {latestAssessment.feedback_items?.filter((f) => f.type === 'positive').map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-emerald-600 mt-0.5">•</span>
                          <span>{f.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      İnkişaf etdirilməli tərəflər (-) / Çətinliklər
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-800">
                      {latestAssessment.feedback_items?.filter((f) => f.type === 'development_area').map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-bold text-amber-600 mt-0.5">•</span>
                          <span>{f.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {latestAssessment.next_step && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800">
                    <strong className="text-indigo-900 block mb-0.5">Növbəti addım / Müəllim tövsiyəsi:</strong>
                    {latestAssessment.next_step}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8 text-slate-400">
                  Bu şagird üçün hələ heç bir dərc edilmiş qiymətləndirmə yoxdur.
                </div>
              </Card>
            )}

            {/* Tarixçə Cədvəli */}
            <Card
              title="Qiymətləndirmə Tarixçəsi"
              subtitle="Tədris müddətində yazılmış bütün T-Şkala qeydləri"
              action={
                <Link href="/parent/assessments" className="text-xs font-semibold text-indigo-600 hover:underline">
                  Hamısına bax
                </Link>
              }
            >
              <div className="divide-y divide-slate-100">
                {assessments.slice(0, 5).map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm text-slate-900 block">
                        {a.subject?.name} — {a.topic}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(a.assessment_date).toLocaleDateString('az-AZ')} • Standart: {a.standard}
                      </span>
                    </div>

                    <Link href={`/parent/assessments/${a.id}`}>
                      <Button variant="outline" size="sm">
                        Bax
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
