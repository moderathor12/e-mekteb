'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Profile, SchoolClass } from '@/types';

export default function ParentConnectPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [studentCode, setStudentCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [relationshipType, setRelationshipType] = useState('valideyn');

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

        const { data: cls } = await supabase.from('classes').select('*').eq('is_archived', false).order('grade_level');
        setClasses(cls || []);
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

      // Şagird kodunu yoxla
      const code = studentCode.trim().toUpperCase();

      const { data: student, error: stErr } = await supabase
        .from('students')
        .select('*')
        .eq('student_code', code)
        .maybeSingle();

      if (!student) {
        throw new Error('Daxil edilmiş şagird kodu ilə məktəb bazasında şagird tapılmadı. Zəhmət olmasa kodu dəqiqləşdirin.');
      }

      // Ad və ya soyadın uyğunluğunu yoxla (əlavə təhlükəsizlik)
      const inputFirst = firstName.trim().toLowerCase();
      const inputLast = lastName.trim().toLowerCase();
      const dbFirst = student.first_name.toLowerCase();
      const dbLast = student.last_name.toLowerCase();

      if (!dbFirst.includes(inputFirst) && !dbLast.includes(inputLast)) {
        throw new Error('Şagirdin adı və ya soyadı şagird kodu ilə uyğun gəlmir.');
      }

      // Müraciəti qeyd et
      const { error: reqErr } = await supabase.from('parent_connection_requests').insert({
        parent_id: profile.id,
        student_code: code,
        student_first_name: firstName.trim(),
        student_last_name: lastName.trim(),
        class_id: selectedClassId || student.class_id,
        relationship_type: relationshipType,
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
            Övladınızın fərdi T-Şkala jurnalına baxmaq üçün məktəb kodunu daxil edin
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
            <Card title="Şagird Məlumatları" subtitle="Məktəb tərəfindən verilmiş məlumatları dəqiq daxil edin">
              <div className="space-y-4">
                <div>
                  <Input
                    label="Şagirdin İdentifikasiya Kodu *"
                    required
                    placeholder="Məs: TSK-5A-101 və ya SAG-10492"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    helperText="Məktəb rəhbərliyi və ya sinif rəhbəri tərəfindən sizə verilən unikal şagird kodu"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sinif</label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Sinif seçin (istəyə görə)</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} sinfi
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qohumluq Əlaqəsi</label>
                  <select
                    value={relationshipType}
                    onChange={(e) => setRelationshipType(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="ana">Ana</option>
                    <option value="ata">Ata</option>
                    <option value="qəyyum">Qəyyum</option>
                    <option value="valideyn">Valideyn</option>
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
