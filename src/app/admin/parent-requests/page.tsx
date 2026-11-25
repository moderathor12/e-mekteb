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
import { syncApprovedParentRequests } from '@/lib/sync-students';

export default function AdminParentRequestsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<ParentConnectionRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
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
    await syncApprovedParentRequests();
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
      let rpcHandled = false;

      if (newStatus === 'approved') {
        const { error: rpcErr } = await supabase.rpc('approve_parent_connection_request', {
          p_request_id: request.id,
          p_reviewer_id: profile?.id,
          p_notes: notes || null,
        });
        if (!rpcErr) {
          rpcHandled = true;
        }
      }

      if (!rpcHandled) {
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
      }

      if (newStatus === 'approved') {
        await syncApprovedParentRequests({ force: true });
      }

      alert(newStatus === 'approved' ? 'Müraciət təsdiqləndi və şagird sinfə əlavə edildi!' : 'Müraciətə imtina edildi.');
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
                <th className="px-6 py-3.5">Şagird Adı, Soyadı</th>
                <th className="px-6 py-3.5">Sinif</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
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
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {r.student_first_name} {r.student_last_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded">
                        {r.class?.name
                          ? formatClassName(r.class.name)
                          : r.student_code
                          ? formatClassName(r.student_code)
                          : 'Təyin edilməyib'}
                      </span>
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
