'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { GraduationCap, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Şifrə sıfırlama sorğusu göndərilərkən xəta baş verdi.');
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
          Şifrənin Sıfırlanması
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Qeydiyyatdan keçdiyiniz e-poçt ünvanınızı daxil edin
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
          {error && <Alert type="error" className="mb-6">{error}</Alert>}

          {success ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Təlimat göndərildi!</h3>
              <p className="text-sm text-slate-600 mb-6">
                Şifrənizi yeniləmək üçün keçid linki <strong>{email}</strong> ünvanına göndərildi. Zəhmət olmasa poçt qutunuzu yoxlayın.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Giriş səhifəsinə qayıt
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleReset}>
              <Input
                label="E-poçt ünvanı"
                type="email"
                required
                placeholder="ad@numune.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Sıfırlama linki göndər
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Giriş səhifəsinə qayıt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
