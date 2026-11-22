'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TScaleDocumentView } from '@/components/assessment/TScaleDocumentView';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Profile, Assessment } from '@/types';

export default function AssessmentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
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

  const handleArchive = async () => {
    if (!confirm('Bu qiymətləndirməni arxivləşdirmək istədiyinizdən əminsiniz?')) return;
    const supabase = createClient();
    await supabase.from('assessments').update({ status: 'archived' }).eq('id', resolvedParams.id);
    alert('Qiymətləndirmə arxivləşdirildi.');
    router.push('/teacher/assessments');
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between no-print">
          <Link
            href="/teacher/assessments"
            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Bütün qiymətləndirmələrə qayıt
          </Link>

          {assessment && (
            <div className="flex items-center gap-2">
              <Link href={`/teacher/assessments/${assessment.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Edit className="w-4 h-4" /> Redaktə et
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={handleArchive} className="gap-1.5">
                <Trash2 className="w-4 h-4" /> Arxivləşdir
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Yüklənir...</div>
        ) : !assessment ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-slate-600">Qiymətləndirmə sənədi tapılmadı.</p>
          </div>
        ) : (
          <TScaleDocumentView assessment={assessment} />
        )}
      </div>
    </DashboardLayout>
  );
}
