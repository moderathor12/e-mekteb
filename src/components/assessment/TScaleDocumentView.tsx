'use client';

import React from 'react';
import { Assessment, FeedbackItem } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertCircle, Calendar, BookOpen, GraduationCap, Printer, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TScaleDocumentViewProps {
  assessment: Assessment;
  showPrintButton?: boolean;
}

export function TScaleDocumentView({ assessment, showPrintButton = true }: TScaleDocumentViewProps) {
  const positiveItems = assessment.feedback_items?.filter((i) => i.type === 'positive') || [];
  const developmentItems = assessment.feedback_items?.filter((i) => i.type === 'development_area') || [];

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(assessment.assessment_date).toLocaleDateString('az-AZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="space-y-4">
      {showPrintButton && (
        <div className="flex justify-end no-print">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Çap et / PDF saxla
          </Button>
        </div>
      )}

      {/* Rəsmi T-Şkala Jurnalı Sənədi Formatı */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 sm:p-8 shadow-sm print-page">
        {/* Başlıq */}
        <div className="text-center pb-6 border-b-2 border-slate-900">
          <span className="text-xs uppercase tracking-widest font-bold text-slate-500 block mb-1">
            {process.env.NEXT_PUBLIC_SCHOOL_NAME || '1 nömrəli Tam Orta Məktəb'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
            T-ŞKALA QİYMƏTLƏNDİRMƏ JURNALI
          </h1>
          <p className="text-xs text-slate-600 mt-1 italic">
            (Formativ Qiymətləndirmə üzrə Fərdi Müşahidə Vərəqi)
          </p>
        </div>

        {/* Metaməlumatlar Cədvəli */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-5 border-b border-slate-200 text-sm">
          <div>
            <span className="text-slate-500 block text-xs font-semibold">Fənn:</span>
            <span className="font-bold text-slate-900">{assessment.subject?.name || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-semibold">Sinif:</span>
            <span className="font-bold text-slate-900">{assessment.class?.name || '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-semibold">Tarix:</span>
            <span className="font-bold text-slate-900">{formattedDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-semibold">Şagirdin adı, soyadı:</span>
            <span className="font-bold text-indigo-700 text-base">
              {assessment.student ? `${assessment.student.first_name} ${assessment.student.last_name}` : '—'}
            </span>
            {assessment.student?.student_code && (
              <span className="text-xs text-slate-500 block">Kod: {assessment.student.student_code}</span>
            )}
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-semibold">Mövzu:</span>
            <span className="font-medium text-slate-900">{assessment.topic}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs font-semibold">Standart:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs inline-block">
              {assessment.standard}
            </span>
          </div>
        </div>

        {/* Əsas T-Şkala Bölməsi: İki Sütunlu Formativ Qiymətləndirmə (+) və (-) */}
        <div className="my-6">
          <div className="grid grid-cols-1 md:grid-cols-2 border-2 border-slate-900 rounded-lg overflow-hidden">
            {/* Sol Sütun: Müsbət tərəflər (+) / Nailiyyətlər */}
            <div className="border-b-2 md:border-b-0 md:border-r-2 border-slate-900 bg-emerald-50/30 flex flex-col">
              <div className="bg-emerald-600 text-white px-4 py-3 text-center border-b border-emerald-700">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="text-base font-bold uppercase tracking-wide">
                    Müsbət tərəflər (+)
                  </span>
                </div>
                <span className="text-xs text-emerald-100 block font-medium">Nailiyyətlər</span>
              </div>
              <div className="p-4 sm:p-5 flex-1 space-y-2.5">
                {positiveItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Müsbət qeyd əlavə edilməyib.</p>
                ) : (
                  positiveItems.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-2.5 text-sm text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        +
                      </span>
                      <span className="leading-relaxed">{item.content}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sağ Sütun: İnkişaf etdirilməli tərəflər (-) / Çətinliklər */}
            <div className="bg-amber-50/30 flex flex-col">
              <div className="bg-amber-600 text-white px-4 py-3 text-center border-b border-amber-700">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5 text-white" />
                  <span className="text-base font-bold uppercase tracking-wide">
                    İnkişaf etdirilməli tərəflər (-)
                  </span>
                </div>
                <span className="text-xs text-amber-100 block font-medium">Çətinliklər</span>
              </div>
              <div className="p-4 sm:p-5 flex-1 space-y-2.5">
                {developmentItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Çətinlik qeydi əlavə edilməyib.</p>
                ) : (
                  developmentItems.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start gap-2.5 text-sm text-slate-800">
                      <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        -
                      </span>
                      <span className="leading-relaxed">{item.content}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Növbəti addım / Müəllim qeydi */}
        <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="text-xs uppercase font-bold text-slate-700 tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
            Növbəti addım / müəllim qeydi:
          </h4>
          <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {assessment.next_step || '—'}
          </p>
        </div>

        {/* Ümumi müşahidə və nəticə */}
        <div className="mb-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h4 className="text-xs uppercase font-bold text-slate-700 tracking-wider mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
            Ümumi müşahidə və nəticə:
          </h4>
          <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {assessment.general_observation || '—'}
          </p>
        </div>

        {/* Müəllim İmzası və Təsdiq Bölməsi */}
        <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-4">
          <div>
            <span className="text-slate-500">Müəllim:</span>{' '}
            <strong className="text-slate-900">
              {assessment.teacher ? `${assessment.teacher.first_name} ${assessment.teacher.last_name}` : 'Müəllim'}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Müəllim imzası:</span>
            <div className="border-b border-dashed border-slate-400 w-40 text-center font-serif italic text-slate-500">
              {assessment.status === 'published' ? 'Elektron təsdiqlənib' : '___________________'}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Status:</span>{' '}
            <Badge variant={assessment.status === 'published' ? 'emerald' : assessment.status === 'draft' ? 'slate' : 'amber'}>
              {assessment.status === 'published' ? 'Dərc edilib' : assessment.status === 'draft' ? 'Qaralama' : 'Arxivlənib'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
