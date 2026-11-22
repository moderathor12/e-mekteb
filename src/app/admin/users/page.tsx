'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Users, Search, ShieldCheck, ShieldAlert, Check, X, Trash2 } from 'lucide-react';
import { Profile, UserRole } from '@/types';
import { getCachedProfile } from '@/lib/auth-cache';

export default function AdminUsersPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const prof = await getCachedProfile();
      setProfile(prof);
      await fetchUsers();
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(data || []);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) alert(error.message);
    else await fetchUsers();
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ is_active: !currentStatus }).eq('id', userId);
    if (error) alert(error.message);
    else await fetchUsers();
  };

  const handleDeleteUser = async (userId: string, userName: string, role: string) => {
    if (role === 'admin') {
      alert('Administrator hesabını silmək təhlükəsizlik səbəbindən qadağandır!');
      return;
    }
    if (!confirm(`${userName} adlı istifadəçini sistemdən silmək istədiyinizdən əminsiniz?`)) return;

    // UI-dan dərhal çıxarırıq
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    const supabase = createClient();
    await supabase.from('parent_student_links').delete().eq('parent_id', userId);
    await supabase.from('parent_connection_requests').delete().eq('parent_id', userId);
    await supabase.from('teacher_assignments').delete().eq('teacher_id', userId);

    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) {
      await supabase.from('profiles').update({ is_active: false }).eq('id', userId);
      alert('İstifadəçi deaktiv edildi (əlaqəli qiymətləndirmə məlumatları qorundu).');
    }
    await fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İstifadəçilərin İdarə Edilməsi</h1>
          <p className="text-sm text-slate-500">Məktəb portalının bütün qeydiyyatdan keçmiş istifadəçiləri və rolları</p>
        </div>

        {/* Filtrlər */}
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                placeholder="Ad, soyad və ya email ilə axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Bütün rollar</option>
                <option value="admin">Administrator</option>
                <option value="teacher">Müəllim</option>
                <option value="parent">Valideyn</option>
              </select>
            </div>
          </div>
        </Card>

        {/* İstifadəçi Cədvəli */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">İstifadəçi</th>
                <th className="px-6 py-3.5">E-poçt</th>
                <th className="px-6 py-3.5">Rol</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Rolu Dəyiş</th>
                <th className="px-6 py-3.5 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Yüklənir...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    İstifadəçi tapılmadı.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role === 'admin' ? 'purple' : u.role === 'teacher' ? 'blue' : 'emerald'}>
                        {u.role === 'admin' ? 'Administrator' : u.role === 'teacher' ? 'Müəllim' : 'Valideyn'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {u.is_active ? 'Aktiv' : 'Deaktiv'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-xs px-2.5 py-1 rounded border border-slate-300 bg-white"
                      >
                        <option value="parent">Valideyn</option>
                        <option value="teacher">Müəllim</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-slate-400 font-medium italic">Qorunur (Admin)</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(u.id, `${u.first_name} ${u.last_name}`, u.role)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                          title="İstifadəçini sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Sil
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
