'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Users, CalendarCheck, ArrowRight } from 'lucide-react';
import { Profile, SchoolClass, Student } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';
import { syncApprovedParentRequests } from '@/lib/sync-students';

export default function TeacherClassesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, Student[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);

      await syncApprovedParentRequests();

      const supabase = createClient();
      const [clsRes, stRes] = await Promise.all([
        supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
        supabase.from('students').select('*').order('first_name'),
      ]);

      setClasses(clsRes.data || []);

      const grouped: Record<string, Student[]> = {};
      (stRes.data || [])
        .filter((st) => st.is_archived !== true)
        .forEach((st) => {
          if (!grouped[st.class_id]) grouped[st.class_id] = [];
          grouped[st.class_id].push(st);
        });
      setStudentsByClass(grouped);
      setIsLoading(false);
    }

    load();
  }, []);

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Siniflərim</h1>
          <p className="text-sm text-slate-500">Tədris etdiyiniz siniflər və şagird kontingenti</p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Yüklənir...</div>
        ) : classes.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-slate-500">Heç bir sinif tapılmadı.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const students = studentsByClass[cls.id] || [];
              return (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center text-center p-1 leading-tight">
                        {cls.name}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{formatClassName(cls.name)}</h3>
                        <p className="text-xs text-slate-500">{cls.grade_level}-ci sinif • {cls.academic_year}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-4 h-4 text-slate-400" /> {students.length} şagird
                    </span>
                    <Link href={`/teacher/assessments/new?class=${cls.id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5">
                        <CalendarCheck className="w-3.5 h-3.5" /> Qiymətləndir
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
