'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { GraduationCap, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Şifrələr uyğun gəlmir.');
      return;
    }

    if (password.length < 6) {
      setError('Şifrə ən azı 6 simvol olmalıdır.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Şifrə yenilənərkən xəta baş verdi.');
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
          Yeni Şifrə Təyin Edin
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {error && <Alert type="error" className="mb-6">{error}</Alert>}

          {success ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Şifrəniz yeniləndi!</h3>
              <p className="text-sm text-slate-600 mb-4">
                Daxil olmaq üçün yönləndirilirsiniz...
              </p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleUpdate}>
              <Input
                label="Yeni şifrə"
                type="password"
                required
                placeholder="Ən azı 6 simvol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                label="Yeni şifrənin təkrarı"
                type="password"
                required
                placeholder="Şifrəni təkrar daxil edin"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Şifrəni yenilə
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
