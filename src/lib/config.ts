// Tətbiqin mərkəzləşdirilmiş konfiqurasiyası və brendinq parametrləri
export const APP_CONFIG = {
  // Əsas ad: E-məktəbim
  name: process.env.NEXT_PUBLIC_APP_NAME || 'E-məktəbim',
  tagline: 'Məktəb Formativ Qiymətləndirmə Portalı',
  schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || '1 nömrəli Tam Orta Məktəb',
  academicYear: '2026-2027',
  documentTitle: 'FORMATİV QİYMƏTLƏNDİRMƏ JURNALI',
  documentSubtitle: '(Fərdi Müşahidə və İnkişaf Vərəqi)',
};
