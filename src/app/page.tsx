import Link from 'next/link';
import { GraduationCap, ArrowRight, ShieldCheck, BookOpen, Users, CheckCircle2, Award, School } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_CONFIG, getSchoolName } from '@/lib/config';

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
              <span className="text-xl font-bold text-slate-900">{APP_CONFIG.name}</span>
              <span className="text-xs text-slate-500 block font-normal -mt-1">{APP_CONFIG.tagline}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/teacher/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                <BookOpen className="w-4 h-4 mr-1.5" /> Müəllim Girişi
              </Button>
            </Link>
            <Link href="/admin/login" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                <ShieldCheck className="w-4 h-4 mr-1.5" /> İnzibatçı Girişi
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Valideyn Girişi</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Qeydiyyat</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Bölməsi */}
      <main className="flex-1">
        <section className="py-12 sm:py-20 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-6">
            <Award className="w-4 h-4 text-indigo-600" />
            Rəsmi Formativ Qiymətləndirmə Standartı
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Şagird nailiyyətlərini <span className="text-indigo-600">fərdi qaydada</span> qiymətləndirin və valideynlərlə bölüşün
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Ənənəvi formativ qiymətləndirmə jurnalının tam rəqəmsallaşdırılmış forması. Hər bir istifadəçi qrupu üçün ayrılmış xüsusi portallar.
          </p>

          {/* 3 Fərqli Giriş Portalı Kartı */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-left max-w-4xl mx-auto">
            {/* 1. Valideyn Portalı */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-all shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Valideyn Portalı</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Övladınızın dərslərdəki nailiyyətləri (+), çətinlikləri (-) və müəllim tövsiyələrini təhlükəsiz şəkildə izləyin.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <Link href="/login" className="block">
                  <Button variant="primary" className="w-full justify-between bg-emerald-600 hover:bg-emerald-700">
                    Valideyn Girişi <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/register" className="block text-center text-xs text-emerald-700 hover:underline font-medium">
                  Hesab yaratmaq üçün qeydiyyatdan keçin
                </Link>
              </div>
            </div>

            {/* 2. Müəllim Portalı */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 transition-all shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Müəllim Portalı</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Təyin olunmuş siniflər üzrə şagirdləri fərdi qaydada qiymətləndirin, rəylər və növbəti addımları qeyd edin.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link href="/teacher/login" className="block">
                  <Button variant="primary" className="w-full justify-between bg-indigo-600 hover:bg-indigo-700">
                    Müəllim Girişi <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <span className="block text-center text-xs text-slate-400 mt-2">
                  Hesablar məktəb tərəfindən təqdim olunur
                </span>
              </div>
            </div>

            {/* 3. İnzibatçı (Admin) Portalı */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-200 hover:border-purple-500 transition-all shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Məktəb İdarəetməsi</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Müəllimlərin, siniflərin, şagirdlərin və valideyn müraciətlərinin mərkəzləşdirilmiş idarəetmə mərkəzi.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link href="/admin/login" className="block">
                  <Button variant="primary" className="w-full justify-between bg-purple-600 hover:bg-purple-700">
                    İnzibatçı Girişi <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <span className="block text-center text-xs text-slate-400 mt-2">
                  Yalnız məktəb rəhbərliyi üçün
                </span>
              </div>
            </div>
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
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Maksimal Məxfilik (RLS)</h3>
                <p className="text-sm text-slate-600">
                  Valideyn yalnız və yalnız məktəb rəhbərliyi tərəfindən təsdiqlənmiş öz övladının qiymətləndirmə jurnalını görə bilər.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Altlıq (Footer) */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {APP_CONFIG.name}. Bütün hüquqlar qorunur.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-900">Valideyn Portalı</Link>
            <Link href="/teacher/login" className="hover:text-slate-900">Müəllim Portalı</Link>
            <Link href="/admin/login" className="hover:text-slate-900">İnzibatçı Portalı</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
