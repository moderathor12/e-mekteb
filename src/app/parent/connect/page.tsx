'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { Profile, SchoolClass } from '@/types';

// 1-11 arası bütün siniflər (A, B, C, D bölmələri ilə)
const ALL_GRADES = Array.from({ length: 11 }, (_, i) => {
  const grade = i + 1;
  return {
    grade,
    label: `${grade}-ci siniflər`,
    classes: ['A', 'B', 'C', 'D'].map((letter) => `${grade}${letter}`),
  };
});

export default function ParentConnectPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dbClasses, setDbClasses] = useState<SchoolClass[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedClassName, setSelectedClassName] = useState('5A');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);

        const { data: cls } = await supabase.from('classes').select('*').eq('is_archived', false);
        setDbClasses(cls || []);
      }
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

      if (!selectedClassName) {
        throw new Error('Zəhmət olmasa sinfi seçin.');
      }

      // Verilənlər bazasındakı uyğun sinfi tapırıq (və ya yoxdursa yaradırıq)
      let targetClass = dbClasses.find(
        (c) => c.name.toUpperCase() === selectedClassName.toUpperCase()
      );

      if (!targetClass) {
        const gradeMatch = selectedClassName.match(/\d+/);
        const gradeNum = gradeMatch ? parseInt(gradeMatch[0], 10) : 5;
        const { data: newCls } = await supabase
          .from('classes')
          .insert({
            name: selectedClassName.toUpperCase(),
            grade_level: gradeNum,
            academic_year: '2026-2027',
          })
          .select()
          .single();
        if (newCls) targetClass = newCls;
      }

      // Müraciəti qeyd edirik
      const { error: reqErr } = await supabase.from('parent_connection_requests').insert({
        parent_id: profile.id,
        student_code: selectedClassName.toUpperCase(), // baza uyğunluğu üçün sinif adını saxlayırıq
        student_first_name: trimmedFirst,
        student_last_name: trimmedLast,
        class_id: targetClass?.id || null,
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

        {success ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Müraciətiniz Qəbul Olundu!</h3>
            <p className="text-sm text-slate-600">
              Şagird əlaqələndirmə sorğunuz məktəb rəhbərliyinə və sinif rəhbərinə göndərildi. Təsdiq edildikdən sonra övladınızın bütün qiymətləndirmələri profilinizdə aktivləşəcək.
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
                    Sinif (1 - 11 arası bütün siniflər) *
                  </label>
                  <select
                    required
                    value={selectedClassName}
                    onChange={(e) => setSelectedClassName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {ALL_GRADES.map((group) => (
                      <optgroup key={group.grade} label={group.label}>
                        {group.classes.map((clsName) => (
                          <option key={clsName} value={clsName}>
                            {clsName} sinfi
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
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
