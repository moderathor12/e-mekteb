'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { BookOpen, ArrowRight, Shield, User } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { setCachedProfile } from '@/lib/auth-cache';

function TeacherLoginFormContent() {
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

      if (signInError) throw signInError;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (!profile) {
          throw new Error('İstifadəçi profili tapılmadı.');
        }

        if (!profile.is_active) {
          router.push('/pending-approval');
          return;
        }

        // Təhlükəsizlik: Yalnız müəllimlər və ya adminlər daxil ola bilər
        if (profile.role !== 'teacher' && profile.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error(
            'Bu giriş yalnız fənn və sinif müəllimləri üçündür. Valideyn hesabınızla Valideyn Portalına daxil olun.'
          );
        }

        setCachedProfile(profile);

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/teacher');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error('Müəllim giriş xətası:', err);
      setError(
        err.message === 'Invalid login credentials'
          ? 'E-poçt ünvanı və ya şifrə yanlışdır.'
          : err.message || 'Müəllim portalına daxil olarkən xəta baş verdi.'
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
            label="Müəllim E-poçtu"
            type="email"
            autoComplete="email"
            required
            placeholder="muellim@mekteb.edu.az"
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
          <Button type="submit" variant="primary" className="w-full justify-center" isLoading={isLoading}>
            Müəllim Panelinə Daxil Ol
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <Link href="/login" className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 font-medium">
          <User className="w-3.5 h-3.5" /> Valideyn Portalı Girişi
        </Link>
        <Link href="/admin/login" className="text-slate-600 hover:text-purple-600 flex items-center gap-1 font-medium">
          <Shield className="w-3.5 h-3.5" /> Məktəb İdarəetməsi (Admin)
        </Link>
      </div>
    </div>
  );
}

export default function TeacherLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Müəllim Portalı
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Fərdi formativ qiymətləndirmə və sinif idarəetmə sistemi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Yüklənir...</div>}>
          <TeacherLoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
