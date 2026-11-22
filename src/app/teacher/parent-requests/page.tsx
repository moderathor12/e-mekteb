'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react';
import { Profile, ParentConnectionRequest } from '@/types';

export default function TeacherParentRequestsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ParentConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        await fetchRequests();
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchRequests = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('parent_connection_requests')
      .select('*, parent:profiles(*), class:classes(*)')
      .order('created_at', { ascending: false });

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

      // 2. Əgər təsdiqləndisə, şagirdin ID-sini tapıb parent_student_links cədvəlinə əlavə et
      if (newStatus === 'approved') {
        const { data: student } = await supabase
          .from('students')
          .select('id')
          .eq('student_code', request.student_code.trim())
          .single();

        if (student) {
          await supabase.from('parent_student_links').upsert({
            parent_id: request.parent_id,
            student_id: student.id,
            relationship_type: request.relationship_type || 'valideyn',
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
                <th className="px-6 py-3.5">Şagird Məlumatları</th>
                <th className="px-6 py-3.5">Şagird Kodu</th>
                <th className="px-6 py-3.5">Tarix</th>
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
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900 block">
                        {req.student_first_name} {req.student_last_name}
                      </span>
                      <span className="text-xs text-slate-500">{req.class?.name ? `${req.class.name} sinfi` : ''}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                      {req.student_code}
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
