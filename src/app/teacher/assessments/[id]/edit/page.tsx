'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TScaleForm } from '@/components/assessment/TScaleForm';
import { saveAssessment } from '@/lib/data/assessments';
import { Profile, SchoolClass, Subject, Student, Assessment } from '@/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const [clsRes, subRes, stRes, asmRes] = await Promise.all([
          supabase.from('classes').select('*').eq('is_archived', false),
          supabase.from('subjects').select('*').eq('is_archived', false),
          supabase.from('students').select('*').eq('is_archived', false),
          supabase
            .from('assessments')
            .select('*, feedback_items(*)')
            .eq('id', resolvedParams.id)
            .single(),
        ]);

        setClasses(clsRes.data || []);
        setSubjects(subRes.data || []);
        setStudents(stRes.data || []);
        setAssessment(asmRes.data || null);
      }
      setIsLoading(false);
    }

    load();
  }, [resolvedParams.id]);

  const handleFormSubmit = async (formData: any, status: 'draft' | 'published') => {
    setIsSubmitting(true);
    try {
      await saveAssessment({ ...formData, id: resolvedParams.id });
      alert(
        status === 'published'
          ? 'Qiymətləndirmə yeniləndi və dərc olundu!'
          : 'Qiymətləndirmə qaralama olaraq yeniləndi.'
      );
      router.push(`/teacher/assessments/${resolvedParams.id}`);
    } catch (err: any) {
      console.error(err);
      alert('Xəta baş verdi: ' + (err.message || 'Yadda saxlamaq mümkün olmadı.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const initialFeedback = {
    class_id: assessment?.class_id,
    subject_id: assessment?.subject_id,
    student_id: assessment?.student_id,
    topic: assessment?.topic,
    standard: assessment?.standard,
    assessment_date: assessment?.assessment_date,
    next_step: assessment?.next_step,
    general_observation: assessment?.general_observation,
    positive_feedback: assessment?.feedback_items?.filter((f) => f.type === 'positive').map((f) => f.content) || [],
    development_feedback: assessment?.feedback_items?.filter((f) => f.type === 'development_area').map((f) => f.content) || [],
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href={`/teacher/assessments/${resolvedParams.id}`}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">T-Şkala Qiymətləndirməsini Redaktə Et</h1>
            <p className="text-sm text-slate-500">Mövcud formativ qiymətləndirmə məlumatlarını yeniləyin</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Yüklənir...</div>
        ) : !assessment ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600">Qiymətləndirmə tapılmadı.</p>
          </div>
        ) : (
          <TScaleForm
            classes={classes}
            subjects={subjects}
            students={students}
            initialData={initialFeedback}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
