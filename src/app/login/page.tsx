'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { GraduationCap, ArrowRight, BookOpen, ShieldCheck, User } from 'lucide-react';
import { APP_CONFIG, getSchoolName } from '@/lib/config';
import { setCachedProfile } from '@/lib/auth-cache';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile && !profile.is_active) {
          router.push('/pending-approval');
          return;
        }

        if (profile) {
          setCachedProfile(profile);
        }

        if (redirectTo) {
          router.push(redirectTo);
        } else if (profile?.role === 'admin') {
          router.push('/admin');
        } else if (profile?.role === 'teacher') {
          router.push('/teacher');
        } else {
          router.push('/parent');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error('Giriş xətası:', err);
      setError(
        err.message === 'Invalid login credentials'
          ? 'E-poçt ünvanı və ya şifrə yanlışdır.'
          : err.message || 'Sistemə daxil olarkən xəta baş verdi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-slate-200 sm:px-10">
      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <Input
            label="E-poçt ünvanı"
            type="email"
            autoComplete="email"
            required
            placeholder="valideyn@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Şifrə</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Şifrəni unutmusunuz?
            </Link>
          </div>
          <Input
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center"
            isLoading={isLoading}
          >
            Daxil ol <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-6 text-center">
        <p className="text-sm text-slate-600">
          Valideyn hesabınız yoxdur?{' '}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Qeydiyyatdan keçin
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500">
        <Link href="/teacher/login" className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Müəllim Portalı Girişi
        </Link>
        <Link href="/admin/login" className="text-slate-600 hover:text-purple-600 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> İnzibatçı (Admin) Girişi
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {APP_CONFIG.name} — Valideyn Portalı
        </h2>
        <p className="mt-1 text-xs uppercase tracking-wider font-semibold text-indigo-600">
          {getSchoolName()}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Övladınızın formativ qiymətləndirmə jurnalına baxış
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense fallback={<div className="p-8 text-center bg-white rounded-2xl">Yüklənir...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
