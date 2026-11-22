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
import { formatClassName } from '@/lib/config';

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

        // Bütün müraciətlər
        const { data: reqs } = await supabase
          .from('parent_connection_requests')
          .select('*, class:classes(*)')
          .eq('parent_id', user.id)
          .order('created_at', { ascending: false });

        setRequests(reqs || []);

        // Təsdiqlənmiş övladlar (həm birbaşa linklər, həm də təsdiqlənmiş müraciətlər)
        const { data: links } = await supabase
          .from('parent_student_links')
          .select('*, student:students(*, class:classes(*))')
          .eq('parent_id', user.id)
          .eq('status', 'approved');

        const childrenList = (links?.map((l) => l.student).filter(Boolean) || []) as Student[];

        // Əgər təsdiqlənmiş müraciət varsa amma hələ link kimi gəlməyibsə, onu da təsdiqlənmiş kimi göstəririk
        (reqs || []).forEach((r) => {
          if (r.status === 'approved') {
            const alreadyExists = childrenList.some(
              (c) =>
                c.first_name.trim().toLowerCase() === r.student_first_name.trim().toLowerCase() &&
                c.last_name.trim().toLowerCase() === r.student_last_name.trim().toLowerCase()
            );
            if (!alreadyExists) {
              childrenList.push({
                id: r.id,
                first_name: r.student_first_name,
                last_name: r.student_last_name,
                class_id: r.class_id || '',
                student_code: r.student_code || 'Təsdiqlənib',
                gender: 'male',
                is_archived: false,
                created_at: r.created_at,
                updated_at: r.created_at,
                class: r.class || { name: 'Məktəb Şagirdi', grade_level: 6, academic_year: '2026-2027' },
              } as unknown as Student);
            }
          }
        });

        setApprovedChildren(childrenList);
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
                      <span className="text-xs text-indigo-600 font-semibold block mt-0.5">
                        {formatClassName(st.class?.name)}
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
                  <th className="px-6 py-3">Sinif</th>
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
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {r.class?.name ? formatClassName(r.class.name) : '—'}
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
