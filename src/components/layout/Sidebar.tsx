'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  History,
  FileCheck2,
  Settings,
  UserCheck,
  FileSpreadsheet,
  Award,
  AlertTriangle,
  UserPlus,
  User,
  X
} from 'lucide-react';

interface SidebarProps {
  role?: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const effectiveRole =
    role ||
    (pathname.startsWith('/admin')
      ? 'admin'
      : pathname.startsWith('/parent')
      ? 'parent'
      : 'teacher');

  const adminNav = [
    { name: 'İdarə paneli', href: '/admin', icon: LayoutDashboard },
    { name: 'Müəllimlər', href: '/admin/teachers', icon: Users },
    { name: 'Siniflər', href: '/admin/classes', icon: GraduationCap },
    { name: 'Şagirdlər', href: '/admin/students', icon: UserCheck },
    { name: 'Fənlər', href: '/admin/subjects', icon: BookOpen },
    { name: 'Valideyn müraciətləri', href: '/admin/parent-requests', icon: UserPlus },
    { name: 'İstifadəçilər', href: '/admin/users', icon: Users },
    { name: 'Parametrlər', href: '/admin/settings', icon: Settings },
  ];

  const teacherNav = [
    { name: 'İdarə paneli', href: '/teacher', icon: LayoutDashboard },
    { name: 'Siniflərim', href: '/teacher/classes', icon: GraduationCap },
    { name: 'Şagirdlər', href: '/teacher/students', icon: UserCheck },
    { name: 'Yeni qiymətləndirmə', href: '/teacher/assessments/new', icon: CalendarCheck },
    { name: 'Qiymətləndirmə tarixçəsi', href: '/teacher/assessments', icon: History },
    { name: 'Valideyn müraciətləri', href: '/teacher/parent-requests', icon: UserPlus },
    { name: 'Hesabatlar', href: '/teacher/reports', icon: FileSpreadsheet },
    { name: 'Profil', href: '/teacher/profile', icon: User },
  ];

  const parentNav = [
    { name: 'Ümumi vəziyyət', href: '/parent', icon: LayoutDashboard },
    { name: 'Övladlarım', href: '/parent/children', icon: Users },
    { name: 'Qiymətləndirmələr', href: '/parent/assessments', icon: FileCheck2 },
    { name: 'Nailiyyətlər (+)', href: '/parent/achievements', icon: Award },
    { name: 'İnkişaf sahələri (-)', href: '/parent/development-areas', icon: AlertTriangle },
    { name: 'Şagird əlaqələndir', href: '/parent/connect', icon: UserPlus },
    { name: 'Profil', href: '/parent/profile', icon: User },
  ];

  const currentNav = effectiveRole === 'admin' ? adminNav : effectiveRole === 'teacher' ? teacherNav : parentNav;

  const navLinks = (onItemClick?: () => void) => (
    <div className="p-4 space-y-1">
      {currentNav.map((item) => {
        const isExact = pathname === item.href;
        const isSubRoute =
          item.href !== '/admin' &&
          item.href !== '/teacher' &&
          item.href !== '/parent' &&
          pathname.startsWith(item.href + '/') &&
          !currentNav.some(
            (other) =>
              other.href !== item.href &&
              pathname.startsWith(other.href) &&
              other.href.length > item.href.length
          );
        const isActive = isExact || isSubRoute;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 flex-shrink-0 min-h-[calc(100vh-4rem)] hidden md:block no-print">
        {navLinks()}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-xl z-10 flex flex-col overflow-y-auto">
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <span className="font-bold text-slate-900 text-base">Menyu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Menyunu bağla"
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navLinks(onClose)}
          </aside>
        </div>
      )}
    </>
  );
}
