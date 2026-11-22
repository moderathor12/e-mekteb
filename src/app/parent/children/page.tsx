'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, UserPlus, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { Profile, Student, ParentConnectionRequest } from '@/types';

export default function ParentChildrenPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [approvedChildren, setApprovedChildren] = useState<Student[]>([]);
  const [requests, setRequests] = useState<ParentConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        // Təsdiqlənmiş övladlar
        const { data: links } = await supabase
          .from('parent_student_links')
          .select('*, student:students(*, class:classes(*))')
          .eq('parent_id', user.id)
          .eq('status', 'approved');

        setApprovedChildren((links?.map((l) => l.student).filter(Boolean) || []) as Student[]);

        // Bütün müraciətlər
        const { data: reqs } = await supabase
          .from('parent_connection_requests')
          .select('*, class:classes(*)')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: false });

        setRequests(reqs || []);
      }
      setIsLoading(false);
    }

    load();
  }, []);

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Övladlarım</h1>
            <p className="text-sm text-slate-500">Hesabınıza bağlı şagirdlər və müraciət statusları</p>
          </div>
          <Link href="/parent/connect">
            <Button variant="primary" className="gap-2">
              <UserPlus className="w-4 h-4" /> Yeni Şagird Əlaqələndir
            </Button>
          </Link>
        </div>

        {/* Təsdiqlənmiş Övladlar */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Təsdiqlənmiş Şagirdlər
          </h2>
          {approvedChildren.length === 0 ? (
            <Card>
              <div className="text-center py-6 text-slate-500">
                Hələ heç bir təsdiqlənmiş şagirdiniz yoxdur.
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedChildren.map((st) => (
                <Card key={st.id}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {st.first_name} {st.last_name}
                      </h3>
                      <span className="text-xs text-indigo-600 font-semibold block">
                        {st.class?.name} sinfi
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 block mt-1">
                        Kod: {st.student_code}
                      </span>
                    </div>
                    <Badge variant="emerald">Təsdiqlənib</Badge>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <Link href={`/parent/assessments?student=${st.id}`}>
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        Qiymətləndirmələrə bax <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Göndərilmiş Müraciətlər */}
        <div className="space-y-3 pt-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Əlaqələndirmə Müraciətləri Tarixçəsi
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="px-6 py-3">Şagird Adı</th>
                  <th className="px-6 py-3">Şagird Kodu</th>
                  <th className="px-6 py-3">Tarix</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Qeyd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-slate-400">
                      Heç bir müraciət tapılmadı.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id}>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {r.student_first_name} {r.student_last_name}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-700">
                        {r.student_code}
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
                          {r.status === 'approved' ? 'Təsdiqləndi' : r.status === 'rejected' ? 'İmtina edildi' : 'Təsdiq Gözləyir'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {r.review_notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
