'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { UserPlus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Profile, SchoolClass } from '@/types';
import { formatClassName } from '@/lib/config';
import { getCachedProfile } from '@/lib/auth-cache';

export default function ParentConnectPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dbClasses, setDbClasses] = useState<SchoolClass[]>([]);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);

      const supabase = createClient();
      const [clsRes, pendingRes] = await Promise.all([
        supabase
          .from('classes')
          .select('*')
          .eq('is_archived', false)
          .order('grade_level'),
        prof
          ? supabase
              .from('parent_connection_requests')
              .select('id', { count: 'exact', head: true })
              .eq('parent_id', prof.id)
              .eq('status', 'pending')
          : Promise.resolve({ count: 0 }),
      ]);

      if (clsRes.data && clsRes.data.length > 0) {
        setDbClasses(clsRes.data);
        setSelectedClassId(clsRes.data[0].id);
      }

      setHasPendingRequest((pendingRes.count || 0) > 0);
      setIsCheckingStatus(false);
    }

    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();

      if (!trimmedFirst || !trimmedLast) {
        throw new Error('Zəhmət olmasa şagirdin ad və soyadını daxil edin.');
      }

      if (!selectedClassId) {
        throw new Error('Zəhmət olmasa sinfi seçin.');
      }

      const targetClass = dbClasses.find((c) => c.id === selectedClassId);
      if (!targetClass) {
        throw new Error('Seçilmiş sinif tapılmadı.');
      }

      // 1. Valideynin öz əlaqələri və müraciətləri arasında yoxlayırıq
      const [ownReqsRes, ownLinksRes, globalCheckRes] = await Promise.all([
        supabase
          .from('parent_connection_requests')
          .select('id, status, student_first_name, student_last_name')
          .eq('parent_id', profile.id)
          .in('status', ['pending', 'approved']),
        supabase
          .from('parent_student_links')
          .select('student:students(first_name, last_name, is_archived)')
          .eq('parent_id', profile.id)
          .eq('status', 'approved'),
        fetch('/api/students/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: trimmedFirst, lastName: trimmedLast }),
        })
          .then((r) => (r.ok ? r.json() : { exists: false }))
          .catch(() => ({ exists: false })),
      ]);

      const normalizedFirst = trimmedFirst.toLowerCase();
      const normalizedLast = trimmedLast.toLowerCase();

      if ((ownReqsRes.data || []).some((r) => r.status === 'pending')) {
        setHasPendingRequest(true);
        throw new Error('Hazırda təsdiq gözləyən müraciətiniz var. Təsdiqlənənə qədər yeni sorğu göndərə bilməzsiniz.');
      }

      const existsInOwnRequests = (ownReqsRes.data || []).some(
        (r) =>
          r.student_first_name.trim().toLowerCase() === normalizedFirst &&
          r.student_last_name.trim().toLowerCase() === normalizedLast
      );

      const existsInOwnLinks = (ownLinksRes.data || []).some((l: any) => {
        const st = l.student;
        return (
          st &&
          st.is_archived !== true &&
          st.first_name?.trim().toLowerCase() === normalizedFirst &&
          st.last_name?.trim().toLowerCase() === normalizedLast
        );
      });

      if (existsInOwnRequests || existsInOwnLinks || globalCheckRes.exists) {
        throw new Error(
          `"${trimmedFirst} ${trimmedLast}" adlı şagird artıq sistemdə mövcuddur. Eyni ad və soyadla təkrar sorğu göndərmək mümkün deyil.`
        );
      }

      // Müraciəti qeyd edirik
      const { error: reqErr } = await supabase.from('parent_connection_requests').insert({
        parent_id: profile.id,
        student_code: targetClass.name,
        student_first_name: trimmedFirst,
        student_last_name: trimmedLast,
        class_id: targetClass.id,
        relationship_type: 'valideyn',
        status: 'pending',
      });

      if (reqErr) throw reqErr;

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Müraciət göndərilərkən xəta baş verdi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Şagird Əlaqələndirmə Müraciəti</h1>
          <p className="text-sm text-slate-500">
            Övladınızın formativ qiymətləndirmə jurnalına baxmaq üçün məlumatlarını daxil edin
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {isCheckingStatus ? (
          <Card>
            <div className="py-8 text-center text-slate-400">Yüklənir...</div>
          </Card>
        ) : hasPendingRequest ? (
          <div className="bg-white p-8 rounded-2xl border border-amber-200 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Gözləmədə Olan Müraciətiniz Var</h3>
            <p className="text-sm text-slate-600">
              Göndərdiyiniz şagird əlaqələndirmə sorğusunun hazırda fənn müəllimi tərəfindən təsdiqi gözlənilir. Müraciətiniz təsdiqlənənə qədər yeni sorğu göndərə bilməzsiniz.
            </p>
            <Button variant="primary" onClick={() => router.push('/parent')}>
              Əsas səhifəyə qayıt
            </Button>
          </div>
        ) : success ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Müraciətiniz Qəbul Olundu!</h3>
            <p className="text-sm text-slate-600">
              Şagird əlaqələndirmə sorğunuz göndərildi və fənn müəllimi tərəfindən təsdiqi gözlənilir. Təsdiq edildikdən sonra övladınızın bütün qiymətləndirmələri profilinizdə aktivləşəcək.
            </p>
            <Button variant="primary" onClick={() => router.push('/parent')}>
              Əsas səhifəyə qayıt
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card title="Şagird Məlumatları" subtitle="Övladınızın ad, soyad və sinfini daxil edin">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Şagirdin Adı *"
                    required
                    placeholder="Məs: Aylin"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <Input
                    label="Şagirdin Soyadı *"
                    required
                    placeholder="Məs: Həsənli"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sinif (Məktəbdə mövcud olan siniflər) *
                  </label>
                  {dbClasses.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      Məktəb rəhbərliyi tərəfindən hələ heç bir sinif yaradılmayıb.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    >
                      {dbClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {formatClassName(cls.name)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isLoading}
                    disabled={dbClasses.length === 0}
                  >
                    <UserPlus className="w-4 h-4 mr-2" /> Müraciəti Göndər
                  </Button>
                </div>
              </div>
            </Card>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
