'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Profile, ParentConnectionRequest } from '@/types';

export default function AdminParentRequestsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ParentConnectionRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
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

      alert(newStatus === 'approved' ? 'Müraciət təsdiqləndi!' : 'Müraciətə imtina edildi.');
      await fetchRequests();
    } catch (err: any) {
      console.error(err);
      alert('Xəta: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = requests.filter((r) => {
    return !filterStatus || r.status === filterStatus;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Valideyn Müraciətlərinin İdarəsi</h1>
            <p className="text-sm text-slate-500">
              Bütün məktəb üzrə valideyn-şagird əlaqələndirmə sorğuları
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Bütün müraciətlər</option>
              <option value="pending">Gözləyənlər</option>
              <option value="approved">Təsdiqlənənlər</option>
              <option value="rejected">İmtina edilənlər</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Valideyn</th>
                <th className="px-6 py-3.5">Şagird Adı</th>
                <th className="px-6 py-3.5">Şagird Kodu</th>
                <th className="px-6 py-3.5">Qohumluq</th>
                <th className="px-6 py-3.5">Tarix</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Qərar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Müraciət tapılmadı.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 block">
                        {r.parent?.first_name} {r.parent?.last_name}
                      </span>
                      <span className="text-xs text-slate-500">{r.parent?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {r.student_first_name} {r.student_last_name}
                      <span className="block text-xs text-slate-400">{r.class?.name ? `${r.class.name} sinfi` : ''}</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                      {r.student_code}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {r.relationship_type || 'valideyn'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString('az-AZ')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          r.status === 'approved' ? 'emerald' : r.status === 'rejected' ? 'rose' : 'amber'
                        }
                      >
                        {r.status === 'approved' ? 'Təsdiqləndi' : r.status === 'rejected' ? 'İmtina' : 'Gözləyir'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            disabled={processingId === r.id}
                            onClick={() => handleDecision(r, 'approved')}
                            className="gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Təsdiqlə
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={processingId === r.id}
                            onClick={() => handleDecision(r, 'rejected')}
                            className="gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> İmtina
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Qərar verilib</span>
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
