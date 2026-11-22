'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Profile, ParentConnectionRequest } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';

export default function TeacherParentRequestsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ParentConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);
      await fetchRequests();
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchRequests = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('parent_connection_requests')
      .select('*, parent:profiles!parent_id(*), class:classes(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parent requests:', error);
    }
    setRequests(data || []);
  };

  const handleDecision = async (request: ParentConnectionRequest, newStatus: 'approved' | 'rejected') => {
    const notes = prompt(
      newStatus === 'approved' ? 'Təsdiq qeydi (istəyə görə):' : 'İmtina səbəbini qeyd edin:',
      ''
    );
    if (notes === null) return;

    setProcessingId(request.id);
    const supabase = createClient();

    try {
      // 1. Müraciətin statusunu yenilə
      const { error: reqError } = await supabase
        .from('parent_connection_requests')
        .update({
          status: newStatus,
          reviewer_id: profile?.id,
          review_notes: notes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (reqError) throw reqError;

      // 2. Əgər təsdiqləndisə, şagirdi tap və parent_student_links cədvəlinə əlavə et
      if (newStatus === 'approved') {
        const { data: students } = await supabase
          .from('students')
          .select('id, first_name, last_name, class_id')
          .ilike('first_name', request.student_first_name.trim())
          .ilike('last_name', request.student_last_name.trim());

        let studentId = students?.[0]?.id;

        let targetClassId = request.class_id;
        if (!targetClassId && request.student_code) {
          const { data: matchedClass } = await supabase
            .from('classes')
            .select('id')
            .ilike('name', request.student_code.trim())
            .limit(1)
            .single();
          targetClassId = matchedClass?.id || null;
        }
        if (!targetClassId) {
          const { data: firstClass } = await supabase.from('classes').select('id').limit(1).single();
          targetClassId = firstClass?.id || null;
        }

        if (!studentId && targetClassId) {
          const { data: newSt } = await supabase
            .from('students')
            .insert({
              first_name: request.student_first_name.trim(),
              last_name: request.student_last_name.trim(),
              class_id: targetClassId,
              student_code: `SAG-${Math.floor(10000 + Math.random() * 90000)}`,
              is_archived: false,
            })
            .select('id')
            .single();
          studentId = newSt?.id;
        }

        if (studentId) {
          await supabase.from('parent_student_links').upsert({
            parent_id: request.parent_id,
            student_id: studentId,
            relationship_type: 'valideyn',
            status: 'approved',
            approved_by: profile?.id,
            approved_at: new Date().toISOString(),
          });
        }
      }

      alert(newStatus === 'approved' ? 'Valideyn müraciəti təsdiqləndi!' : 'Müraciətə imtina edildi.');
      await fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert('Xəta baş verdi: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Valideyn Müraciətləri</h1>
          <p className="text-sm text-slate-500">
            Valideynlərin övladlarını hesaba bağlamaq üçün göndərdikləri təsdiq sorğuları
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Valideyn</th>
                <th className="px-6 py-3.5">Şagird Adı, Soyadı</th>
                <th className="px-6 py-3.5">Sinif</th>
                <th className="px-6 py-3.5">Müraciət Tarixi</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Qərar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Gözləyən müraciət tapılmadı.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 block">
                        {req.parent ? `${req.parent.first_name} ${req.parent.last_name}` : 'Valideyn'}
                      </span>
                      <span className="text-xs text-slate-500">{req.parent?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {req.student_first_name} {req.student_last_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded">
                        {req.class?.name
                          ? formatClassName(req.class.name)
                          : req.student_code
                          ? formatClassName(req.student_code)
                          : 'Təyin edilməyib'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(req.created_at).toLocaleDateString('az-AZ')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          req.status === 'approved' ? 'emerald' : req.status === 'rejected' ? 'rose' : 'amber'
                        }
                      >
                        {req.status === 'approved' ? 'Təsdiqləndi' : req.status === 'rejected' ? 'İmtina' : 'Gözləyir'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            disabled={processingId === req.id}
                            onClick={() => handleDecision(req, 'approved')}
                            className="gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Təsdiqlə
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={processingId === req.id}
                            onClick={() => handleDecision(req, 'rejected')}
                            className="gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> İmtina
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Qərar verilib</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
