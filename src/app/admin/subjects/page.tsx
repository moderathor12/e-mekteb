'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import { Profile, Subject } from '@/types';

export default function AdminSubjectsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(prof);
        await fetchSubjects();
      }
      setIsLoading(false);
    }

    load();
  }, []);

  const fetchSubjects = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_archived', false)
      .order('name');
    setSubjects(data || []);
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Subject) => {
    setEditingSubject(s);
    setName(s.name);
    setCode(s.code || '');
    setDescription(s.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    if (editingSubject) {
      const { error } = await supabase
        .from('subjects')
        .update({
          name: name.trim(),
          code: code.trim().toUpperCase() || null,
          description: description.trim() || null,
        })
        .eq('id', editingSubject.id);

      if (error) alert(error.message);
    } else {
      const { error } = await supabase.from('subjects').insert({
        name: name.trim(),
        code: code.trim().toUpperCase() || null,
        description: description.trim() || null,
      });

      if (error) alert(error.message);
    }

    setIsModalOpen(false);
    await fetchSubjects();
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Bu fənni arxivləşdirmək istədiyinizdən əminsiniz?')) return;
    const supabase = createClient();
    await supabase.from('subjects').update({ is_archived: true }).eq('id', id);
    await fetchSubjects();
  };

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tədris Fənləri</h1>
            <p className="text-sm text-slate-500">Məktəb tədris proqramına daxil olan fənlərin siyahısı</p>
          </div>
          <Button variant="primary" onClick={handleOpenAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Yeni Fənn Əlavə Et
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-3 p-12 text-center text-slate-400">Yüklənir...</div>
          ) : subjects.length === 0 ? (
            <div className="col-span-3 p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500">
              Heç bir fənn tapılmadı.
            </div>
          ) : (
            subjects.map((s) => (
              <Card key={s.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                      <BookOpen className="w-6 h-6" />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                      <p className="text-xs font-mono text-slate-400">{s.code || 'KODSUZ'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                      title="Redaktə et"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                      title="Arxivləşdir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {s.description && (
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2">{s.description}</p>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSubject ? 'Fənn Məlumatlarını Yenilə' : 'Yeni Fənn Əlavə Et'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Input
              label="Fənnin Adı *"
              required
              placeholder="Məs: Riyaziyyat, Azərbaycan dili"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Fənn Kodu"
              placeholder="Məs: RIYAZ, AZE-DIL"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Təsvir</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fənn haqqında əlavə qeydlər..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                İmtina
              </Button>
              <Button type="submit" variant="primary">
                Yadda saxla
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
