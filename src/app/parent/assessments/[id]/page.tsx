'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TScaleDocumentView } from '@/components/assessment/TScaleDocumentView';
import { ArrowLeft } from 'lucide-react';
import { Profile, Assessment } from '@/types';

export default function ParentAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        // Supabase RLS yalnız valideynin təsdiqlənmiş övladına aid və statusu 'published' olan qeydi qaytaracaq!
        const { data: asm, error } = await supabase
          .from('assessments')
          .select('*, student:students(*), subject:subjects(*), class:classes(*), teacher:profiles(*), feedback_items(*)')
          .eq('id', resolvedParams.id)
          .single();

        if (error) {
          console.error(error);
        } else {
          setAssessment(asm);
        }
      }
      setIsLoading(false);
    }

    load();
  }, [resolvedParams.id]);

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="no-print">
          <Link
            href="/parent/assessments"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Bütün qiymətləndirmələrə qayıt
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Yüklənir...</div>
        ) : !assessment ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600">Qiymətləndirmə sənədi tapılmadı və ya bu sənədə baxış hüququnuz yoxdur.</p>
          </div>
        ) : (
          <TScaleDocumentView assessment={assessment} />
        )}
      </div>
    </DashboardLayout>
  );
}
