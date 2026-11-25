'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { LogOut, User, Bell, GraduationCap, School, Menu } from 'lucide-react';
import { APP_CONFIG, getSchoolName } from '@/lib/config';
import { clearProfileCache } from '@/lib/auth-cache';

interface NavbarProps {
  profile?: Profile | null;
  onMenuClick?: () => void;
}

export function Navbar({ profile, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [schoolName, setSchoolName] = useState<string>(APP_CONFIG.schoolName);

  useEffect(() => {
    setSchoolName(getSchoolName());
    const handler = () => setSchoolName(getSchoolName());
    window.addEventListener('school_settings_updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('school_settings_updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const handleSignOut = async () => {
    clearProfileCache();
    await supabase.auth.signOut();
    if (profile?.role === 'teacher') {
      router.push('/teacher/login');
    } else if (profile?.role === 'admin') {
      router.push('/admin/login');
    } else {
      router.push('/login');
    }
    router.refresh();
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Məktəb Administratoru</span>;
      case 'teacher':
        return <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Müəllim</span>;
      case 'parent':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">Valideyn</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Menyunu aç"
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 text-lg hover:opacity-90">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-indigo-600">{APP_CONFIG.name}</span>
              <span className="text-xs text-slate-400 block font-normal -mt-0.5">Formativ Qiymətləndirmə</span>
            </div>
          </Link>
          {schoolName ? (
            <div className="hidden md:flex items-center text-xs text-slate-400 pl-4 border-l border-slate-200 ml-4 gap-1.5">
              <School className="w-4 h-4 text-slate-400" />
              <span>{schoolName}</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          {profile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">
                  {profile.first_name} {profile.last_name}
                </span>
                <div className="mt-0.5">{getRoleBadge(profile.role)}</div>
              </div>

              <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                {profile.first_name?.[0] || <User className="w-4 h-4" />}
              </div>

              <button
                onClick={handleSignOut}
                title="Sistemdən çıxış"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Daxil ol
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                Valideyn Qeydiyyatı
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
