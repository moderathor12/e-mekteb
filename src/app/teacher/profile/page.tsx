'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { User, Mail, Shield, KeyRound, Check } from 'lucide-react';
import { Profile } from '@/types';

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (prof) {
          setProfile(prof);
          setFirstName(prof.first_name || '');
          setLastName(prof.last_name || '');
          setPhone(prof.phone || '');
        }
      }
    }

    load();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
        })
        .eq('id', profile.id);

      if (error) throw error;

      if (newPassword) {
        if (newPassword.length < 6) throw new Error('Şifrə ən azı 6 simvol olmalıdır.');
        const { error: passErr } = await supabase.auth.updateUser({ password: newPassword });
        if (passErr) throw passErr;
        setNewPassword('');
      }

      setMessage({ type: 'success', text: 'Profil məlumatlarınız uğurla yeniləndi!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Yenilənmə zamanı xəta baş verdi.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">İstifadəçi Profili</h1>
          <p className="text-sm text-slate-500">Şəxsi məlumatlarınızı və şifrənizi idarə edin</p>
        </div>

        {message && (
          <Alert type={message.type}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <Card title="Şəxsi Məlumatlar">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ad"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Soyad"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="E-poçt ünvanı"
                  disabled
                  value={profile?.email || ''}
                  helperText="E-poçt ünvanı administrator tərəfindən idarə olunur."
                />
              </div>

              <div>
                <Input
                  label="Əlaqə telefonu"
                  placeholder="+994 50 000 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card title="Şifrənin Yenilənməsi" subtitle="Şifrəni dəyişmək istəmirsinizsə boş buraxın">
            <div>
              <Input
                label="Yeni şifrə"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={isSaving} className="gap-2">
              <Check className="w-4 h-4" /> Yadda saxla
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
