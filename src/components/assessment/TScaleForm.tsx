'use client';

import React, { useState } from 'react';
import { SchoolClass, Subject, Student } from '@/types';
import { formatClassName } from '@/lib/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, CheckCircle2, AlertCircle, Save, Send, Sparkles, Users, Check, Search } from 'lucide-react';

interface TScaleFormProps {
  classes: SchoolClass[];
  subjects: Subject[];
  students: Student[];
  initialData?: any;
  onSubmit: (formData: any, status: 'draft' | 'published') => Promise<void>;
  isLoading?: boolean;
}

export function TScaleForm({
  classes,
  subjects,
  students,
  initialData,
  onSubmit,
  isLoading = false,
}: TScaleFormProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialData?.class_id || (classes[0]?.id || ''));
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialData?.subject_id || (subjects[0]?.id || ''));
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialData?.student_id || '');

  const [topic, setTopic] = useState<string>(initialData?.topic || '');
  const [standard, setStandard] = useState<string>(initialData?.standard || '');
  const [assessmentDate, setAssessmentDate] = useState<string>(
    initialData?.assessment_date || new Date().toISOString().split('T')[0]
  );

  // Müsbət tərəflər (+) siyahısı
  const [positiveList, setPositiveList] = useState<string[]>(
    initialData?.positive_feedback || [
      'Dərsdə fəal iştirak edir.',
      'Mövzunu yaxşı mənimsəyib.'
    ]
  );
  const [newPositive, setNewPositive] = useState('');

  // İnkişaf etdirilməli tərəflər (-) siyahısı
  const [developmentList, setDevelopmentList] = useState<string[]>(
    initialData?.development_feedback || [
      'Tapşırıqları tamamlamaq üçün əlavə dəstəyə ehtiyacı var.'
    ]
  );
  const [newDevelopment, setNewDevelopment] = useState('');

  // Növbəti addım və Ümumi müşahidə
  const [nextStep, setNextStep] = useState<string>(initialData?.next_step || '');
  const [generalObservation, setGeneralObservation] = useState<string>(initialData?.general_observation || '');

  // Şagird Seçim Modalı üçün state-lər
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [modalClassFilter, setModalClassFilter] = useState('');

  // Seçilmiş sinfin şagirdləri
  const classStudents = students.filter(
    (s) => s.class_id === selectedClassId && s.is_archived !== true
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Tez-tez istifadə olunan hazır şablon nümunələri (müəllimlərin işini sürətləndirmək üçün)
  const positiveTemplates = [
    'Dərsdə fəal iştirak edir.',
    'Mövzunu yaxşı mənimsəyib.',
    'Tapşırıqları vaxtında yerinə yetirir.',
    'Fikrini sərbəst ifadə edir.',
    'Komanda işində fəaldır.',
    'Məntiqi mühakimə yürütməyi bacarır.',
    'Müstəqil tədqiqat aparmağa həvəslidir.'
  ];

  const developmentTemplates = [
    'Mövzunun müəyyən hissələrini mənimsəməkdə çətinlik çəkir.',
    'Yazı səhvləri edir.',
    'Dərsdə diqqətini saxlamaqda çətinlik çəkir.',
    'Tapşırıqları tamamlamaq üçün əlavə dəstəyə ehtiyacı var.',
    'Qaydaların tətbiqində tərəddüd edir.',
    'Vaxtın idarə edilməsində çətinlik çəkir.'
  ];

  const nextStepTemplates = [
    'Əlavə çalışmalar yerinə yetirməlidir.',
    'Oxu bacarıqlarını inkişaf etdirməlidir.',
    'Növbəti dərsdə mövzu təkrar edilməlidir.',
    'Ev tapşırıqlarına daha çox diqqət yetirməsi tövsiyə olunur.'
  ];

  const handleAddPositive = () => {
    if (newPositive.trim()) {
      setPositiveList([...positiveList, newPositive.trim()]);
      setNewPositive('');
    }
  };

  const handleRemovePositive = (index: number) => {
    setPositiveList(positiveList.filter((_, i) => i !== index));
  };

  const handleAddDevelopment = () => {
    if (newDevelopment.trim()) {
      setDevelopmentList([...developmentList, newDevelopment.trim()]);
      setNewDevelopment('');
    }
  };

  const handleRemoveDevelopment = (index: number) => {
    setDevelopmentList(developmentList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!selectedStudentId) {
      alert('Zəhmət olmasa qiymətləndiriləcək şagirdi seçin!');
      return;
    }
    if (!topic.trim()) {
      alert('Zəhmət olmasa mövzunu qeyd edin!');
      return;
    }
    if (!standard.trim()) {
      alert('Zəhmət olmasa tədris standartını qeyd edin!');
      return;
    }

    const payload = {
      class_id: selectedClassId,
      subject_id: selectedSubjectId,
      student_id: selectedStudentId,
      topic,
      standard,
      assessment_date: assessmentDate,
      positive_feedback: positiveList,
      development_feedback: developmentList,
      next_step: nextStep,
      general_observation: generalObservation,
      status,
    };

    await onSubmit(payload, status);
  };

  return (
    <div className="space-y-6">
      {/* 1. Şagird və Dərs Metaməlumatlarının Seçimi */}
      <Card title="1. Qiymətləndirmə Məlumatları (Sinif, Fənn, Şagird)" subtitle="Qiymətləndiriləcək şagirdi və fənni müəyyən edin">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sinif *</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedStudentId('');
              }}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Sinif seçin</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatClassName(c.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fənn *</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Fənn seçin</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Şagird (Fərdi Qiymətləndirmə) *</label>
              <button
                type="button"
                onClick={() => {
                  setModalClassFilter(selectedClassId);
                  setIsStudentModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                title="Şagird siyahısını aç və seç"
              >
                <Users className="w-3.5 h-3.5" /> Şagird Seç
              </button>
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Şagird seçin --</option>
              {classStudents.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.first_name} {st.last_name} ({st.student_code})
                </option>
              ))}
            </select>
            {classStudents.length === 0 && selectedClassId && (
              <p className="text-xs text-amber-600 mt-1">
                Bu sinifdə aktiv şagird tapılmadı.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setModalClassFilter('');
                    setIsStudentModalOpen(true);
                  }}
                  className="underline font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Şagird siyahısını aç
                </button>
              </p>
            )}
            {selectedStudent && (
              <p className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Seçildi: {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.student_code})
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div>
            <Input
              label="Tədris Mövzusu *"
              placeholder="Məs: Kəsrlərin vurulması və bölünməsi"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Məzmun Standartı *"
              placeholder="Məs: 1.2.4 və ya 2.1.3"
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="Tarix *"
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* 2. T-Şkala İki Sütunlu Formativ Qiymətləndirmə (+ / -) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Müsbət tərəflər (+) / Nailiyyətlər */}
        <div className="bg-white rounded-xl border-2 border-emerald-500 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              +
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Müsbət tərəflər (+)</h3>
              <p className="text-xs text-emerald-700 font-medium">Nailiyyətlər</p>
            </div>
          </div>

          {/* Siyahı */}
          <div className="space-y-2 my-4 min-h-[140px]">
            {positiveList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Hələ heç bir müsbət tərəf əlavə edilməyib.</p>
            ) : (
              positiveList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-950"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePositive(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Yeni əlavə et */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Yeni müsbət nailiyyət yazın..."
              value={newPositive}
              onChange={(e) => setNewPositive(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPositive();
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="button" variant="success" size="sm" onClick={handleAddPositive}>
              <Plus className="w-4 h-4 mr-1" /> Əlavə et
            </Button>
          </div>

          {/* Hazır şablonlar */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Şablon seçimlər:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {positiveTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!positiveList.includes(t)) setPositiveList([...positiveList, t]);
                  }}
                  className="text-xs bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* İnkişaf etdirilməli tərəflər (-) / Çətinliklər */}
        <div className="bg-white rounded-xl border-2 border-amber-500 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
              -
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">İnkişaf etdirilməli tərəflər (-)</h3>
              <p className="text-xs text-amber-700 font-medium">Çətinliklər</p>
            </div>
          </div>

          {/* Siyahı */}
          <div className="space-y-2 my-4 min-h-[140px]">
            {developmentList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Hələ heç bir çətinlik əlavə edilməyib.</p>
            ) : (
              developmentList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-950"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDevelopment(idx)}
                    className="text-slate-400 hover:text-rose-600 p-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Yeni əlavə et */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Çətinlik və ya inkişaf sahəsi yazın..."
              value={newDevelopment}
              onChange={(e) => setNewDevelopment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDevelopment();
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
            />
            <Button
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              size="sm"
              onClick={handleAddDevelopment}
            >
              <Plus className="w-4 h-4 mr-1" /> Əlavə et
            </Button>
          </div>

          {/* Hazır şablonlar */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Şablon seçimlər:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {developmentTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (!developmentList.includes(t)) setDevelopmentList([...developmentList, t]);
                  }}
                  className="text-xs bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Növbəti addım və Ümumi müşahidə */}
      <Card title="3. Növbəti Addımlar və Nəticə" subtitle="Müəllimin tövsiyələri və ümumi qiymətləndirmə xülasəsi">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Növbəti addım / müəllim qeydi
            </label>
            <textarea
              rows={2}
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="Şagirdin növbəti mərhələdə nə etməli olduğu barədə qeyd..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {nextStepTemplates.map((tmpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNextStep(nextStep ? `${nextStep} ${tmpl}` : tmpl)}
                  className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded"
                >
                  + {tmpl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ümumi müşahidə və nəticə
            </label>
            <textarea
              rows={3}
              value={generalObservation}
              onChange={(e) => setGeneralObservation(e.target.value)}
              placeholder="Şagirdin mövzu üzrə ümumi dərketmə səviyyəsi və yekun rəy..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Əməliyyat düymələri */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="secondary"
          onClick={() => handleSubmit('draft')}
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          <Save className="w-4 h-4 mr-2" /> Qaralama olaraq yadda saxla
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSubmit('published')}
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          <Send className="w-4 h-4 mr-2" /> Dərc et (Valideynə görünəcək)
        </Button>
      </div>

      {/* Şagird Seçim Modalı */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        title="Qiymətləndirmə üçün Şagird Seçin"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sinif üzrə süzgəc</label>
              <select
                value={modalClassFilter}
                onChange={(e) => setModalClassFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Bütün siniflər ({students.length} şagird)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatClassName(c.name)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Şagird axtarışı</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ad, soyad və ya kod..."
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
            {(() => {
              const filteredList = students.filter((st) => {
                if (st.is_archived === true) return false;
                const matchClass = !modalClassFilter || st.class_id === modalClassFilter;
                const matchSearch =
                  !studentSearchTerm ||
                  `${st.first_name} ${st.last_name} ${st.father_name || ''} ${st.student_code}`
                    .toLowerCase()
                    .includes(studentSearchTerm.toLowerCase());
                return matchClass && matchSearch;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Uyğun şagird tapılmadı.
                  </div>
                );
              }

              return filteredList.map((st) => {
                const stClass = classes.find((c) => c.id === st.class_id);
                const isSelected = selectedStudentId === st.id;
                return (
                  <div
                    key={st.id}
                    className={`flex items-center justify-between p-3 transition-colors ${
                      isSelected ? 'bg-indigo-50/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {st.first_name[0]}
                        {st.last_name[0]}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                          {st.first_name} {st.last_name}
                          {st.father_name && (
                            <span className="text-slate-400 text-[11px] font-normal">
                              ({st.father_name})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-medium text-indigo-600">
                            {formatClassName(stClass?.name || 'Sinif təyin olunmayıb')}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-slate-400">{st.student_code}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'primary' : 'outline'}
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        if (st.class_id) {
                          setSelectedClassId(st.class_id);
                        }
                        setIsStudentModalOpen(false);
                      }}
                      className="gap-1 text-xs py-1 px-3"
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Seçildi
                        </>
                      ) : (
                        'Seç'
                      )}
                    </Button>
                  </div>
                );
              });
            })()}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsStudentModalOpen(false)}
            >
              Bağla
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
