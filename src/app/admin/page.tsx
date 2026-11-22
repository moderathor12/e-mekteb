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
  GraduationCap,
  BookOpen,
  UserPlus,
  FileCheck2,
  Settings,
  Plus,
  Clock,
  ArrowRight,
  ShieldAlert,
  School
} from 'lucide-react';
import { Profile, SchoolClass, Student, Assessment, ParentConnectionRequest } from '@/types';
import { getSchoolName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';

export default function AdminDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    pendingRequests: 0,
    publishedAssessments: 0,
  });
  const [recentRequests, setRecentRequests] = useState<ParentConnectionRequest[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);

      const supabase = createClient();

        // Statistik göstəriciləri hesabla
        const [
          { count: stCount },
          { count: tchCount },
          { count: clsCount },
          { count: reqCount },
          { count: asmCount },
          { data: reqs },
          { data: asms },
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_archived', false),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
          supabase.from('classes').select('*', { count: 'exact', head: true }).eq('is_archived', false),
          supabase.from('parent_connection_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase
            .from('parent_connection_requests')
            .select('*, parent:profiles!parent_id(*), class:classes(*)')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('assessments')
            .select('*, student:students(*), subject:subjects(*), class:classes(*), teacher:profiles!teacher_id(*)')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        setStats({
          totalStudents: stCount || 0,
          totalTeachers: tchCount || 0,
          totalClasses: clsCount || 0,
          pendingRequests: reqCount || 0,
          publishedAssessments: asmCount || 0,
        });

        setRecentRequests(reqs || []);
        setRecentAssessments(asms || []);
        setIsLoading(false);
    }

    load();
  }, []);

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        {/* Başlıq */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Məktəb İdarəetmə Mərkəzi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Məktəb: <strong>{getSchoolName()}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/classes">
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Sinif Əlavə Et
              </Button>
            </Link>
            <Link href="/admin/students">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Şagird Əlavə Et
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistik Kartlar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Şagirdlər</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalStudents}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Müəllimlər</span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalTeachers}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Siniflər</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalClasses}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Qiymətləndirmələr</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.publishedAssessments}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase">Gözləyən Müraciət</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pendingRequests}</p>
          </div>
        </div>

        {/* 2 Sütunlu Aktivlik Paneli */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Son Valideyn Müraciətləri */}
          <Card
            title="Valideyn Müraciətləri"
            subtitle="Şagird kodunu daxil edərək təsdiq gözləyən valideynlər"
            action={
              <Link href="/admin/parent-requests" className="text-xs font-semibold text-indigo-600 hover:underline">
                Hamısı ({stats.pendingRequests})
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {recentRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Gözləyən müraciət yoxdur.</p>
              ) : (
                recentRequests.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900 block text-sm">
                        {r.student_first_name} {r.student_last_name} ({r.student_code})
                      </strong>
                      <span className="text-slate-500">
                        Valideyn: {r.parent?.first_name} {r.parent?.last_name} ({r.relationship_type})
                      </span>
                    </div>
                    <Badge variant={r.status === 'approved' ? 'emerald' : r.status === 'rejected' ? 'rose' : 'amber'}>
                      {r.status === 'approved' ? 'Təsdiqlənib' : r.status === 'rejected' ? 'İmtina' : 'Gözləyir'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Son Yazılmış Qiymətləndirmələr */}
          <Card
            title="Məktəb Üzrə Son Qiymətləndirmələr"
            subtitle="Müəllimlərin fərdi jurnal qeydləri"
            action={
              <Link href="/teacher/assessments" className="text-xs font-semibold text-indigo-600 hover:underline">
                Jurnala bax
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {recentAssessments.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Qiymətləndirmə tapılmadı.</p>
              ) : (
                recentAssessments.map((a) => (
                  <div key={a.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900 block text-sm">
                        {a.student ? `${a.student.first_name} ${a.student.last_name}` : 'Şagird'} • {a.class?.name}
                      </span>
                      <span className="text-slate-500">
                        {a.subject?.name} — {a.topic} (Müəllim: {a.teacher?.first_name} {a.teacher?.last_name})
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">
                      {new Date(a.assessment_date).toLocaleDateString('az-AZ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
