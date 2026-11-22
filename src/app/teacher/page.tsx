'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  Plus,
  Clock,
  ArrowRight,
  UserCheck,
  BookOpen,
  Award
} from 'lucide-react';
import { Profile, Assessment, SchoolClass } from '@/types';

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [assignedStudentsCount, setAssignedStudentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(prof);

        // Sinifləri yüklə
        const { data: cls } = await supabase
          .from('classes')
          .select('*')
          .eq('is_archived', false);
        setClasses(cls || []);

        // Şagirdlərin sayı
        const { count: stCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_archived', false);
        setAssignedStudentsCount(stCount || 0);

        // Son qiymətləndirmələr
        const { data: asm } = await supabase
          .from('assessments')
          .select('*, student:students(*), subject:subjects(*), class:classes(*)')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentAssessments(asm || []);

        // Gözləyən valideyn müraciətləri
        const { count: reqCount } = await supabase
          .from('parent_connection_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingRequestsCount(reqCount || 0);
      }
      setIsLoading(false);
    }

    loadData();
  }, []);

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        {/* Üst qarşılama və Sürətli əməliyyat */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Xoş gəlmisiniz, {profile ? `${profile.first_name} müəllim` : 'Müəllim'}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Fərdi T-Şkala formativ qiymətləndirmələrini idarə edin və şagird inkişafını qeydə alın.
            </p>
          </div>

          <Link href="/teacher/assessments/new">
            <Button variant="primary" size="md" className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> Yeni Qiymətləndirmə Yaz
            </Button>
          </Link>
        </div>

        {/* Statistik Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Siniflərim</span>
              <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Şagirdlərim</span>
              <p className="text-2xl font-bold text-slate-900">{assignedStudentsCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Son Qeydlər</span>
              <p className="text-2xl font-bold text-slate-900">{recentAssessments.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Gözləyən Müraciət</span>
              <p className="text-2xl font-bold text-amber-600">{pendingRequestsCount}</p>
            </div>
          </div>
        </div>

        {/* Siniflərim və Son Qiymətləndirmələr */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Təyin olunmuş siniflər */}
          <div className="lg:col-span-1 space-y-4">
            <Card
              title="Təyin olunmuş Siniflər"
              subtitle="Tədris apardığınız siniflər"
              action={
                <Link href="/teacher/classes" className="text-xs text-indigo-600 font-semibold hover:underline">
                  Hamısına bax
                </Link>
              }
            >
              <div className="space-y-2">
                {classes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">Hələ heç bir sinif təyin olunmayıb.</p>
                ) : (
                  classes.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                          {c.name}
                        </span>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900">{c.name} sinfi</h4>
                          <span className="text-xs text-slate-500">{c.grade_level}-ci sinif • {c.academic_year}</span>
                        </div>
                      </div>
                      <Link href={`/teacher/assessments/new?class=${c.id}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-600">
                          Qiymətləndir
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Gözləyən Valideyn Bildirişi */}
            {pendingRequestsCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Valideyn müraciətləri var!</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    {pendingRequestsCount} valideyn şagird profilini əlaqələndirmək üçün təsdiq gözləyir.
                  </p>
                  <Link href="/teacher/parent-requests">
                    <span className="text-xs font-bold text-amber-800 underline block mt-2">
                      Müraciətlərə bax və qərar ver →
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Son T-Şkala Qiymətləndirmələri */}
          <div className="lg:col-span-2">
            <Card
              title="Son Fərdi Qiymətləndirmələr"
              subtitle="Son daxil edilmiş T-Şkala jurnalı qeydləri"
              action={
                <Link href="/teacher/assessments" className="text-xs text-indigo-600 font-semibold hover:underline">
                  Bütün tarixçə
                </Link>
              }
            >
              <div className="divide-y divide-slate-100">
                {recentAssessments.length === 0 ? (
                  <div className="text-center py-10">
                    <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Hələ heç bir qiymətləndirmə yazılmayıb.</p>
                    <Link href="/teacher/assessments/new" className="mt-3 inline-block">
                      <Button variant="primary" size="sm">İlk qiymətləndirməni yaz</Button>
                    </Link>
                  </div>
                ) : (
                  recentAssessments.map((a) => (
                    <div key={a.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {a.student ? `${a.student.first_name} ${a.student.last_name}` : 'Şagird'}
                          </span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {a.class?.name}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            • {a.subject?.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          Mövzu: <strong className="text-slate-800">{a.topic}</strong> (Standart: {a.standard})
                        </p>
                        <span className="text-[11px] text-slate-400 block">
                          Tarix: {new Date(a.assessment_date).toLocaleDateString('az-AZ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={a.status === 'published' ? 'emerald' : 'slate'}>
                          {a.status === 'published' ? 'Dərc edilib' : 'Qaralama'}
                        </Badge>
                        <Link href={`/teacher/assessments/${a.id}`}>
                          <Button variant="outline" size="sm">
                            Vərəqə bax
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
