import Link from 'next/link';
import { GraduationCap, ArrowRight, ShieldCheck, BookOpen, Users, CheckCircle2, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Başlıq (Header) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900">T-Şkala</span>
              <span className="text-xs text-slate-500 block font-normal -mt-1">Məktəb Qiymətləndirmə Portalı</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">Daxil ol</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Valideyn Qeydiyyatı</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Bölməsi */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-6">
            <Award className="w-4 h-4 text-indigo-600" />
            Rəsmi T-Şkala Formativ Qiymətləndirmə Standartı
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Şagird nailiyyətlərini <span className="text-indigo-600">fərdi qaydada</span> qiymətləndirin və valideynlərlə bölüşün
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Ənənəvi kağız T-Şkala jurnalının tam rəqəmsallaşdırılmış forması. Müəllimlər fərdi müşahidələri qeyd edir, valideynlər isə yalnız öz övladının inkişafını təhlükəsiz şəkildə izləyir.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                Sistemə daxil ol <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Valideyn Hesabı Yarat
              </Button>
            </Link>
          </div>
        </section>

        {/* Xüsusiyyətlər */}
        <section className="py-12 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Müsbət Nailiyyətlər (+)</h3>
                <p className="text-sm text-slate-600">
                  Şagirdin dərsdəki fəallığı, mövzunu mənimsəməsi, fərdi uğurları və güclü tərəfləri operativ qeyd olunur.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">İnkişaf Sahələri (-)</h3>
                <p className="text-sm text-slate-600">
                  Şagirdin çətinlik çəkdiyi məqamlar və inkişaf etdirilməli cəhətlər üzrə müəllim tövsiyələri tərtib olunur.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Maksimal Məxfilik (RLS)</h3>
                <p className="text-sm text-slate-600">
                  Valideynlər yalnız öz övladının qiymətləndirmələrinə baxa bilər. Heç bir kənar şagirdin məlumatı sızdırılmır.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>© 2026 T-Şkala — Məktəb Formativ Qiymətləndirmə Portalı. Bütün hüquqlar qorunur.</p>
      </footer>
    </div>
  );
}
