'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TScaleForm } from '@/components/assessment/TScaleForm';
import { saveAssessment } from '@/lib/data/assessments';
import { Profile, SchoolClass, Subject, Student } from '@/types';
import { getCachedProfile } from '@/lib/auth-cache';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function NewAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClass = searchParams.get('class');
  const preselectedStudent = searchParams.get('student');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);

      const supabase = createClient();
      const [clsRes, subRes, stRes] = await Promise.all([
        supabase.from('classes').select('*').eq('is_archived', false).order('grade_level'),
        supabase.from('subjects').select('*').eq('is_archived', false).order('name'),
        supabase.from('students').select('*').eq('is_archived', false).order('first_name'),
      ]);

        setClasses(clsRes.data || []);
        setSubjects(subRes.data || []);
        setStudents(stRes.data || []);
        setIsLoading(false);
    }

    load();
  }, []);

  const handleFormSubmit = async (formData: any, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      const newId = await saveAssessment(formData);
      alert(
        status === 'published'
          ? 'Formativ qiymətləndirmə uğurla dərc edildi və valideynə əlçatan oldu!'
          : 'Qiymətləndirmə qaralama olaraq yadda saxlanıldı.'
      );
      router.push(`/teacher/assessments/${newId}`);
    } catch (err: any) {
      console.error(err);
      alert('Xəta baş verdi: ' + (err.message || 'Məlumatı yadda saxlamaq mümkün olmadı.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href="/teacher/assessments"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Yeni Fərdi Qiymətləndirmə</h1>
            <p className="text-sm text-slate-500">
              Şagirdin nailiyyətlərini və çətinliklərini fərdi jurnal vərəqinə qeyd edin
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500">Məlumatlar yüklənir...</div>
        ) : classes.length === 0 || subjects.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800">
            <p className="font-semibold">Qiymətləndirmə üçün sinif və ya fənn tapılmadı.</p>
            <p className="text-sm mt-1">Zəhmət olmasa məktəb administratoru ilə əlaqə saxlayın.</p>
          </div>
        ) : (
          <TScaleForm
            classes={classes}
            subjects={subjects}
            students={students}
            initialData={{
              class_id: preselectedClass || classes[0]?.id,
              student_id: preselectedStudent || '',
            }}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Yüklənir...</div>}>
      <NewAssessmentContent />
    </Suspense>
  );
}
