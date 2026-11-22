'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Daxil edilmiş şifrələr eyni deyil.');
      return;
    }

    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvoldan ibarət olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'parent',
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data?.user) {
        // Profilin bazaya düşməsini təmin edirik
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: 'parent',
            is_active: true,
          });
        } catch (pErr) {
          console.warn('Profil upsert qeydi:', pErr);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Qeydiyyat xətası:', err);
      let errorMsg = err.message || 'Qeydiyyat zamanı xəta baş verdi.';
      if (errorMsg.includes('Database error saving new user')) {
        errorMsg = 'Verilənlər bazası xətası: Zəhmət olmasa Supabase SQL Editor-da yenilənmiş schema.sql skriptini icra edin.';
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Valideyn Qeydiyyatı
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Övladınızın formativ qiymətləndirmə jurnalını izləmək üçün qeydiyyatdan keçin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Qeydiyyat uğurla tamamlandı!</h3>
              <p className="text-sm text-slate-600 mb-4">
                Hesabınız yaradıldı. Giriş səhifəsinə yönləndirilirsiniz...
              </p>
              <Link href="/login">
                <Button variant="primary" className="w-full">
                  İndi daxil ol
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ad"
                  required
                  placeholder="Məs: Anar"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Soyad"
                  required
                  placeholder="Məs: Əliyev"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="E-poçt ünvanı"
                  type="email"
                  required
                  placeholder="ad@numune.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Şifrə"
                  type="password"
                  required
                  placeholder="Ən azı 6 simvol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Şifrənin təkrarı"
                  type="password"
                  required
                  placeholder="Şifrəni yenidən yazın"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Qeydiyyatı tamamla <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Artıq hesabınız var?{' '}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Daxil olun
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
