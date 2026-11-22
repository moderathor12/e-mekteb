import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Profile } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  profile?: Profile | null;
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar profile={profile} />
      <div className="flex-1 flex">
        <Sidebar role={profile?.role} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
