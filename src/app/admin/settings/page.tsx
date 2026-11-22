'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Settings, Save, School, ShieldCheck } from 'lucide-react';
import { Profile } from '@/types';
import { getSchoolName, setSchoolNameSetting } from '@/lib/config';

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [contactEmail, setContactEmail] = useState('admin@mekteb.edu.az');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSchoolName(getSchoolName());
    if (typeof window !== 'undefined') {
      const savedYear = localStorage.getItem('academic_year');
      if (savedYear) setAcademicYear(savedYear);
      const savedEmail = localStorage.getItem('contact_email');
      if (savedEmail) setContactEmail(savedEmail);
    }

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
      }
    }

    load();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (schoolName.trim()) {
      setSchoolNameSetting(schoolName.trim());
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('academic_year', academicYear.trim());
      localStorage.setItem('contact_email', contactEmail.trim());
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sistem Parametrləri</h1>
          <p className="text-sm text-slate-500">Məktəb parametrləri və platforma konfiqurasiyası</p>
        </div>

        {isSaved && (
          <Alert type="success">
            Parametrlər uğurla yadda saxlanıldı!
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <Card title="Məktəb Məlumatları" subtitle="Qiymətləndirmə jurnalı vərəqələrində əks olunan rəsmi ad">
            <div className="space-y-4">
              <Input
                label="Məktəbin Rəsmi Adı"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
              />

              <Input
                label="Cari Tədris İli"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />

              <Input
                label="Əlaqə E-poçtu"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />
            </div>
          </Card>

          <Card title="Qiymətləndirmə Standartları" subtitle="Tədris və qiymətləndirmə prinsipləri">
            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">Məktəb miqyası:</strong>
                Bu instansiya təktərəfli olaraq yalnız bir məktəb üçün konfiqurasiya edilmişdir.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <strong className="text-slate-900 block mb-1">Formativ Qiymətləndirmə prinsipi:</strong>
                Formativ qiymətləndirmə sistemi bal və ya rəqəmsal qiymət hesablamır, yalnız keyfiyyət yönümlü müsbət tərəfləri (+), inkişaf sahələrini (-) və növbəti addımları qeydə alır.
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="gap-2">
              <Save className="w-4 h-4" /> Parametrləri Yadda Saxla
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
