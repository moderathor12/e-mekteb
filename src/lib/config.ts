// Tətbiqin mərkəzləşdirilmiş konfiqurasiyası və brendinq parametrləri
export const APP_CONFIG = {
  // Əsas ad (.env faylından götürülür, verilmədikdə "Nailiyyət" qəbul edilir)
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Nailiyyət',
  tagline: 'Məktəb Formativ Qiymətləndirmə Portalı',
  schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || '1 nömrəli Tam Orta Məktəb',
  academicYear: '2026-2027',
  documentTitle: 'FORMATİV QİYMƏTLƏNDİRMƏ JURNALI',
  documentSubtitle: '(Fərdi Müşahidə və İnkişaf Vərəqi)',
};

// Alternativ ad təklifləri:
export const SUGGESTED_NAMES = [
  { name: 'Nailiyyət', desc: 'Şagirdin müsbət nəticələrini və uğurlarını önə çəkən pozitiv ad' },
  { name: 'Məktəbim', desc: 'Məktəb, müəllim və valideyn üçbucağını birləşdirən doğma ad' },
  { name: 'İnkişaf', desc: 'Formativ qiymətləndirmənin əsas məqsədi olan davamlı inkişafı vurğulayır' },
  { name: 'Pillə', desc: 'Hər dərsin və qiymətləndirmənin bir inkişaf pilləsi olduğunu ifadə edir' },
  { name: 'Dinamika', desc: 'Şagirdin tədris ili ərzindəki inkişaf dinamikasını əks etdirir' },
  { name: 'Bələdçi', desc: 'Müəllimin valideyn və şagird üçün yolgöstərən rolunu simvolizə edir' },
];
