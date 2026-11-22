'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BookOpen, ArrowRight, UserCheck, Shield } from 'lucide-react';
import { APP_CONFIG, getSchoolName } from '@/lib/config';
import { setCachedProfile } from '@/lib/auth-cache';
import { Subject } from '@/types';

export default function TeacherRegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      const supabase = createClient();
      const { data } = await supabase.from('subjects').select('*').eq('is_archived', false).order('name');
      setSubjects(data || []);
    }
    loadSubjects();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Şifrələr bir-biri ilə uyğun gəlmir.');
      return;
    }

    if (password.length < 6) {
      setError('Şifrə minimum 6 simvoldan ibarət olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role: 'teacher',
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Profilin müəllim rolunda yaradılmasını təmin edirik
        const teacherProfile = {
          id: data.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: 'teacher' as const,
          is_active: true,
        };

        await supabase.from('profiles').upsert(teacherProfile);
        setCachedProfile(teacherProfile as any);

        // Əgər fənn seçilibsə, ilkin təyinat yaradırıq
        if (selectedSubjectId) {
          const { data: firstClass } = await supabase.from('classes').select('id').limit(1).single();
          if (firstClass) {
            await supabase.from('teacher_assignments').insert({
              teacher_id: data.user.id,
              subject_id: selectedSubjectId,
              class_id: firstClass.id,
            });
          }
        }

        setSuccess(true);
        setTimeout(() => {
          router.push('/teacher');
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Müəllim qeydiyyat xətası:', err);
      setError(err.message || 'Müəllim hesabı yaradılarkən xəta baş verdi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md mb-3">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Müəllim Portalı — Qeydiyyat
        </h2>
        <p className="mt-1 text-xs uppercase tracking-wider font-semibold text-indigo-600">
          {getSchoolName()}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Fərdi formativ qiymətləndirmə jurnalı üçün müəllim hesabı yaradın
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-6">
              Müəllim hesabınız uğurla yaradıldı! Müəllim panelinə yönləndirilirsiniz...
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ad *"
                required
                placeholder="Məs: Sevinc"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Soyad *"
                required
                placeholder="Məs: Qasımova"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Məktəb E-poçt ünvanı *"
                type="email"
                autoComplete="email"
                required
                placeholder="ad@mekteb.edu.az"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {subjects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tədris etdiyiniz əsas fənn (istəyə görə)
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Fənn seçin (daha sonra da seçilə bilər)</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Input
                label="Şifrə *"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Minimum 6 simvol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Şifrənin təkrarı *"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Şifrəni yenidən yazın"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center"
                isLoading={isLoading}
              >
                Müəllim Hesabı Yarat <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Artıq müəllim hesabınız var?{' '}
              <Link href="/teacher/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Müəllim Girişi
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/login" className="hover:text-indigo-600">
              Valideyn Portalı
            </Link>
            <Link href="/admin/login" className="hover:text-purple-600">
              İnzibatçı Girişi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
