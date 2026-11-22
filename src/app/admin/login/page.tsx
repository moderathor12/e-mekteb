'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { ShieldCheck, ArrowRight, User, BookOpen } from 'lucide-react';
import { APP_CONFIG, getSchoolName } from '@/lib/config';
import { setCachedProfile } from '@/lib/auth-cache';

function AdminLoginFormContent() {
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

        // Təhlükəsizlik: Yalnız adminlər daxil ola bilər
        if (profile.role !== 'admin') {
          await supabase.auth.signOut();
          throw new Error(
            'Bu giriş yalnız məktəb rəhbərliyi və administratorlar üçündür. Sizin hesabınız administrator hüququna malik deyil.'
          );
        }

        setCachedProfile(profile);

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/admin');
        }
        router.refresh();
      }
    } catch (err: any) {
      console.error('Admin giriş xətası:', err);
      setError(
        err.message === 'Invalid login credentials'
          ? 'E-poçt ünvanı və ya şifrə yanlışdır.'
          : err.message || 'İdarəetmə portalına daxil olarkən xəta baş verdi.'
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
            label="İnzibatçı E-poçtu"
            type="email"
            autoComplete="email"
            required
            placeholder="admin@mekteb.edu.az"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Şifrə</label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-purple-600 hover:text-purple-500"
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
            className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg shadow-sm"
            isLoading={isLoading}
          >
            İdarəetmə Panelinə Daxil Ol
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <Link href="/login" className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 font-medium">
          <User className="w-3.5 h-3.5" /> Valideyn Girişi
        </Link>
        <Link href="/teacher/login" className="text-slate-600 hover:text-indigo-600 flex items-center gap-1 font-medium">
          <BookOpen className="w-3.5 h-3.5" /> Müəllim Portalı Girişi
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Məktəb İdarəetmə Portalı
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          {APP_CONFIG.name} — İnzibatçı və Rəhbərlik Mərkəzi
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Yüklənir...</div>}>
          <AdminLoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
