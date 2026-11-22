// Tətbiqin mərkəzləşdirilmiş konfiqurasiyası və brendinq parametrləri
export const APP_CONFIG = {
  // Əsas ad: E-məktəbim
  name: process.env.NEXT_PUBLIC_APP_NAME || 'E-məktəbim',
  tagline: 'Məktəb Formativ Qiymətləndirmə Portalı',
  schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || '',
  academicYear: '2026-2027',
  documentTitle: 'FORMATİV QİYMƏTLƏNDİRMƏ JURNALI',
  documentSubtitle: '(Fərdi Müşahidə və İnkişaf Vərəqi)',
};

// 1-11 arası bütün siniflər (yanında heç bir hərf olmadan: 1-ci sinif, 2-ci sinif ...)
export const GRADE_OPTIONS = [
  { grade: 1, name: '1-ci sinif' },
  { grade: 2, name: '2-ci sinif' },
  { grade: 3, name: '3-cü sinif' },
  { grade: 4, name: '4-cü sinif' },
  { grade: 5, name: '5-ci sinif' },
  { grade: 6, name: '6-cı sinif' },
  { grade: 7, name: '7-ci sinif' },
  { grade: 8, name: '8-ci sinif' },
  { grade: 9, name: '9-cu sinif' },
  { grade: 10, name: '10-cu sinif' },
  { grade: 11, name: '11-ci sinif' },
];

export function formatClassName(name?: string | null): string {
  if (!name) return '';
  const trimmed = name.trim();
  return trimmed.toLowerCase().includes('sinif') ? trimmed : `${trimmed} sinfi`;
}

export function getSchoolName(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('school_name');
    if (saved && saved.trim()) return saved.trim();
  }
  return APP_CONFIG.schoolName;
}

export function setSchoolNameSetting(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('school_name', name.trim());
    window.dispatchEvent(new Event('school_settings_updated'));
  }
}
