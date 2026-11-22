# T-Şkala — Məktəb Formativ Qiymətləndirmə Portalı & Valideyn Kabineti

**T-Şkala**, ənənəvi kağız T-Şkala formativ qiymətləndirmə jurnalını tam rəqəmsallaşdıran, bir məktəb üçün xüsusi olaraq hazırlanmış təhlükəsiz, fərdi şagird qiymətləndirmə və valideyn məlumatlandırma platformasıdır.

Müəllimlər şagirdləri fərdi qaydada qiymətləndirərək onların müsbət nailiyyətlərini (+), inkişaf sahələrini (-), növbəti addım və ümumi müşahidələrini qeydə alır. Valideynlər isə yalnız öz təsdiqlənmiş övladlarının məlumatlarını təhlükəsiz şəkildə izləyə bilirlər.

---

## 1. Əsas Funksionallıqlar

### 1.1 Müəllim Bölməsi
- **Fərdi Qiymətləndirmə Modulu:** T-Şkala jurnal strukturuna tam uyğun:
  - Fənn, Sinif, Şagird, Mövzu, Məzmun standartı və Tarix.
  - **Müsbət tərəflər (+) / Nailiyyətlər:** Şagirdin dərsdəki aktivliyi, mövzunu mənimsəməsi və fərdi uğurları (hazır şablonlar və sərbəst mətn daxiletməsi).
  - **İnkişaf etdirilməli tərəflər (-) / Çətinliklər:** Şagirdin çətinlik çəkdiyi hissələr və dəstəyə ehtiyacı olan sahələr.
  - **Növbəti addım / Müəllim qeydi:** Şagirdin inkişafı üçün atılacaq növbəti addımlar və tövsiyələr.
  - **Ümumi müşahidə və nəticə:** Müəllimin yekun rəyi.
  - **Elektron təsdiq və imza bloku.**
- **Qaralama və Dərc etmə:** Müəllim qiymətləndirməni qaralama (draft) kimi saxlaya və ya dərc edərək (published) valideynə əlçatan edə bilər.
- **Tarixçə və Filtrlər:** Tarix, sinif, fənn və şagird adına görə süzgəclər.
- **Rəsmi Çap Formatı:** Ənənəvi kağız jurnal formasında rəsmi A4 çap və PDF ixrac imkanı.
- **Valideyn Müraciətlərinin Təsdiqi:** Tədris etdiyi siniflərin şagirdlərinə aid valideyn sorğularını yoxlama və təsdiq/imtina etmə.

### 1.2 Valideyn Bölməsi
- **Təhlükəsiz Şagird Əlaqələndirməsi:** Valideyn qeydiyyatdan keçdikdən sonra məktəb tərəfindən verilən unikal şagird kodu (məs: `SAG-10492`) və şagird məlumatları ilə sorğu göndərir.
- **Çoxuşaqlı Valideyn Dəstəyi (Multi-child):** Bir valideynin bir neçə övladı olduqda panel daxilində tək kliklə şagirdlər arasında keçid.
- **Fərdi İzləmə:** Övladının fənlər üzrə ən son qiymətləndirmələri, nailiyyətləri (+), inkişaf etdirilməli cəhətləri (-) və müəllim tövsiyələri.
- **Mütləq Məxfilik:** Supabase Row Level Security (RLS) vasitəsilə valideyn heç bir halda başqa şagirdin məlumatını, adını və ya qiymətini görə bilməz.

### 1.3 Məktəb Administratoru Bölməsi
- **İdarə Paneli:** Bütün məktəb üzrə şagird, müəllim, sinif, müraciət və qiymətləndirmə statistikası.
- **Müəllim və Təyinat İdarəsi:** Müəllimlərin siniflərə və fənlərə təhkim edilməsi.
- **Sinif və Şagird İdarəsi:** Siniflərin yaradılması, şagirdlərin əlavə olunması və avtomatik unikal şagird kodlarının generasiyası.
- **Fənlər və Parametrlər:** Tədris proqramına daxil olan fənlərin və məktəb rekvizitlərinin tənzimlənməsi.

---

## 2. Texnologiya Yığını (Tech Stack)

| Hissə | Texnologiya | Təsvir |
|---|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript | Müasir SSR və Server Component arxitekturası |
| **Dizayn & Stillər** | Tailwind CSS, Lucide Icons | Responsive, zərif təhsil interfeysi və çap stilləri |
| **Backend & DB** | Supabase, PostgreSQL | Əlaqəli verilənlər bazası, Triggers, Views |
| **Təhlükəsizlik** | Supabase Auth + Row Level Security (RLS) | Verilənlər bazası səviyyəsində səlahiyyət yoxlanışı |
| **Hostinq** | Vercel & Supabase Cloud | Yüksək sürət və davamlılıq |

---

## 3. Quraşdırma və İşə Salma Təlimatı

### 3.1 Tələblər
- Node.js >= 20.x
- npm və ya pnpm
- Supabase hesabı (https://supabase.com)

### 3.2 Repozitoriyanı klonlayın və paketləri quraşdırın:
```bash
git clone https://github.com/your-username/t-shkala.git
cd t-shkala
npm install
```

### 3.3 Ətraf Mühit Dəyişənləri (.env.local):
`.env.example` faylını kopyalayaraq `.env.local` yaradın:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

NEXT_PUBLIC_SCHOOL_NAME="1 nömrəli Tam Orta Məktəb"
NEXT_PUBLIC_APP_NAME="T-Şkala"
```

### 3.4 Supabase Verilənlər Bazasının Quraşdırılması:
1. Supabase layihənizdə **SQL Editor** bölməsinə daxil olun.
2. `supabase/schema.sql` faylının məzmununu kopyalayıb icra edin (Bu əmrlər cədvəlləri, RLS siyasətlərini və triqqerləri yaradır).
3. (İstəyə görə) Sınaq məlumatları üçün `supabase/seed.sql` faylını icra edin.

### 3.5 İlkin Administrator Hesabının Yaradılması:
Təhlükəsizlik qaydalarına əsasən, sistemdə açıq administrator qeydiyyatı yoxdur.
1. `/register` səhifəsindən və ya Supabase Authentication panelindən administrator olacaq istifadəçini qeydiyyatdan keçirin (məsələn: `admin@mekteb.edu.az`).
2. Supabase SQL Editor-da bu əmri icra edərək ona administrator statusu verin:
```sql
UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE email = 'admin@mekteb.edu.az';
```

### 3.6 Layihəni Lokal İşə Salın:
```bash
npm run dev
```
Brauzerinizdə `http://localhost:3000` ünvanını açın.

---

## 4. Təhlükəsizlik və RLS Siyasətləri

1. **IDOR Mühafizəsi:** Şagird ID-si və ya qiymətləndirmə ID-si URL-də dəyişdirilsə belə, Supabase RLS sorğunu dərhal rədd edir.
2. **Valideyn Məxfiliyi:** Valideyn yalnız `parent_student_links` cədvəlində statusu `approved` olan şagirdlərin `published` statuslu qiymətləndirmələrini oxuya bilər.
3. **Müəllim Məhdudiyyəti:** Müəllimlər yalnız təhkim edildikləri siniflərin şagirdlərinə qiymətləndirmə yaza və baxa bilərlər.
4. **Service Role Açarı:** Heç bir halda brauzer (müştəri) koduna sızdırılmır.

---

## 5. İstehsalata Buraxılış (Deployment)

1. Kodu GitHub repozitoriyasına push edin.
2. **Vercel** panelində layihəni idxal edin.
3. Ətraf mühit dəyişənlərini (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SCHOOL_NAME`) Vercel Settings -> Environment Variables bölməsinə əlavə edin.
4. **Deploy** düyməsini sıxın.
