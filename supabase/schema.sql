-- ==============================================================================
-- T-ŞKALA: Formativ Qiymətləndirmə Jurnalı və Valideyn Portalı
-- PostgreSQL / Supabase Tam Verilənlər Bazası Sxemi
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TİPLƏRİ
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assessment_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM ('positive', 'development_area');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. CƏDVƏLLƏR

-- 3.1 Profiles (İstifadəçi Profilləri - auth.users ilə bağlı)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'parent',
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 Classes (Siniflər - məs: 5A, 6B)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 11),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Subjects (Fənlər - məs: Riyaziyyat, Azərbaycan dili)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.4 Students (Şagirdlər)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code TEXT NOT NULL UNIQUE, -- Valideynin əlaqələndirməsi üçün unikal kod (məs: SAG-10492)
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    father_name TEXT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 Teacher Assignments (Müəllim - Sinif - Fənn təyinatları)
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_teacher_class_subject UNIQUE (teacher_id, class_id, subject_id, academic_year)
);

-- 3.6 Parent-Student Links (Valideyn - Şagird Təsdiqlənmiş Əlaqəsi)
CREATE TABLE IF NOT EXISTS public.parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'valideyn', -- ana, ata, qəyyum, valideyn
    status request_status NOT NULL DEFAULT 'approved',
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_parent_student UNIQUE (parent_id, student_id)
);

-- 3.7 Parent Connection Requests (Valideyn Şagird Bağlama Müraciətləri)
CREATE TABLE IF NOT EXISTS public.parent_connection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_code TEXT DEFAULT '',
    student_first_name TEXT NOT NULL,
    student_last_name TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    relationship_type TEXT DEFAULT 'valideyn',
    status request_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMPTZ
);

-- 3.8 Assessments (T-Şkala Qiymətləndirmələri - Əsas jurnal qeydi)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    topic TEXT NOT NULL, -- Mövzu
    standard TEXT NOT NULL, -- Məzmun standartı (məs: 2.1.3, 1.2.4)
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Qiymətləndirmə tarixi
    next_step TEXT, -- Növbəti addım / müəllim qeydi
    general_observation TEXT, -- Ümumi müşahidə və nəticə
    status assessment_status NOT NULL DEFAULT 'draft', -- draft, published, archived
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.9 Feedback Items (Müsbət tərəflər və İnkişaf etdirilməli tərəflər)
CREATE TABLE IF NOT EXISTS public.feedback_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    type feedback_type NOT NULL, -- positive (+) və ya development_area (-)
    content TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.10 Notifications (Bildirişlər)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.11 Audit Logs (Təhlükəsizlik və Dəyişiklik Jurnalı)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. İNDEKSLƏR
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON public.teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject ON public.teacher_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON public.parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON public.parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_requests_parent ON public.parent_connection_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_requests_status ON public.parent_connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON public.assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_teacher ON public.assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class ON public.assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON public.assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON public.assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON public.assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_feedback_items_assessment ON public.feedback_items(assessment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- 5. FUNKSİYALAR VƏ TRİQQERLƏR (UPDATED_AT)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_classes_updated_at ON public.classes;
CREATE TRIGGER trigger_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_subjects_updated_at ON public.subjects;
CREATE TRIGGER trigger_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_students_updated_at ON public.students;
CREATE TRIGGER trigger_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_parent_student_links_updated_at ON public.parent_student_links;
CREATE TRIGGER trigger_parent_student_links_updated_at BEFORE UPDATE ON public.parent_student_links FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_assessments_updated_at ON public.assessments;
CREATE TRIGGER trigger_assessments_updated_at BEFORE UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auth user yaradıldıqda profile cədvəlinə avtomatik əlavə olunma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role public.user_role := 'parent'::public.user_role;
    v_first_name TEXT;
    v_last_name TEXT;
    v_raw_role TEXT;
BEGIN
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1));
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_raw_role := NEW.raw_user_meta_data->>'role';

    IF v_raw_role = 'admin' THEN
        v_role := 'admin'::public.user_role;
    ELSIF v_raw_role = 'teacher' THEN
        v_role := 'teacher'::public.user_role;
    ELSE
        v_role := 'parent'::public.user_role;
    END IF;

    INSERT INTO public.profiles (id, email, first_name, last_name, role, is_active)
    VALUES (NEW.id, NEW.email, v_first_name, v_last_name, v_role, true)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = timezone('utc'::text, now());
        
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user xətası: %', SQLERRM;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. TƏHLÜKƏSİZLİK KÖMƏKÇİ FUNKSİYALARI (SECURITY DEFINER)
-- RLS rekursiyasının qarşısını almaq və sürətli icazə yoxlanışı üçün

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'teacher' OR role = 'admin') AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_parent()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'parent' AND is_active = true
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Müəllimin sinfə çıxış icazəsi (Admin hər sinfə baxa bilər)
CREATE OR REPLACE FUNCTION public.has_teacher_class_access(p_class_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.teacher_assignments
        WHERE teacher_id = auth.uid() AND class_id = p_class_id
    ) OR public.is_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Müəllimin şagirdə çıxış icazəsi
CREATE OR REPLACE FUNCTION public.has_teacher_student_access(p_student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.teacher_assignments ta ON ta.class_id = s.class_id
        WHERE s.id = p_student_id AND ta.teacher_id = auth.uid()
    ) OR public.is_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Valideynin şagirdə təsdiqlənmiş çıxış icazəsi
CREATE OR REPLACE FUNCTION public.has_parent_student_access(p_student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.parent_student_links
        WHERE parent_id = auth.uid() 
          AND student_id = p_student_id 
          AND status = 'approved'
    ) OR public.is_admin();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 7. ROW LEVEL SECURITY (RLS) SİYASƏTLƏRİ

-- Bütün cədvəllərdə RLS aktiv edilir
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7.1 Profiles Siyasətləri
DROP POLICY IF EXISTS "İstifadəçilər öz profillərinə baxa bilər" ON public.profiles;
CREATE POLICY "İstifadəçilər öz profillərinə baxa bilər"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin() OR public.is_teacher() OR role IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Adminlər bütün profilləri idarə edə bilər" ON public.profiles;
CREATE POLICY "Adminlər bütün profilləri idarə edə bilər"
    ON public.profiles FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "İstifadəçilər öz profilini yeniləyə bilər" ON public.profiles;
CREATE POLICY "İstifadəçilər öz profilini yeniləyə bilər"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profil yaratma icazəsi" ON public.profiles;
CREATE POLICY "Profil yaratma icazəsi"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR auth.uid() IS NULL OR true);

-- 7.2 Classes Siyasətləri
DROP POLICY IF EXISTS "Hər kəs aktiv siniflərə baxa bilər" ON public.classes;
CREATE POLICY "Hər kəs aktiv siniflərə baxa bilər"
    ON public.classes FOR SELECT
    USING (NOT is_archived OR public.is_admin());

DROP POLICY IF EXISTS "Yalnız admin sinifləri idarə edə bilər" ON public.classes;
CREATE POLICY "Yalnız admin sinifləri idarə edə bilər"
    ON public.classes FOR ALL
    USING (public.is_admin());

-- 7.3 Subjects Siyasətləri
DROP POLICY IF EXISTS "Hər kəs aktiv fənlərə baxa bilər" ON public.subjects;
CREATE POLICY "Hər kəs aktiv fənlərə baxa bilər"
    ON public.subjects FOR SELECT
    USING (NOT is_archived OR public.is_admin());

DROP POLICY IF EXISTS "Yalnız admin fənləri idarə edə bilər" ON public.subjects;
CREATE POLICY "Yalnız admin fənləri idarə edə bilər"
    ON public.subjects FOR ALL
    USING (public.is_admin());

-- 7.4 Students Siyasətləri
-- Admin: Hamısını görür və idarə edir
-- Müəllim: Yalnız təyin olunduğu siniflərin şagirdlərini görür
-- Valideyn: Yalnız təsdiqlənmiş öz övladlarını görür
DROP POLICY IF EXISTS "Adminlər şagirdləri tam idarə edir" ON public.students;
CREATE POLICY "Adminlər şagirdləri tam idarə edir"
    ON public.students FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Müəllimlər təyin olunduğu sinfin şagirdlərini görür" ON public.students;
CREATE POLICY "Müəllimlər təyin olunduğu sinfin şagirdlərini görür"
    ON public.students FOR SELECT
    USING (public.has_teacher_student_access(id));

DROP POLICY IF EXISTS "Valideynlər yalnız təsdiqlənmiş övladlarını görür" ON public.students;
CREATE POLICY "Valideynlər yalnız təsdiqlənmiş övladlarını görür"
    ON public.students FOR SELECT
    USING (public.has_parent_student_access(id));

-- 7.5 Teacher Assignments Siyasətləri
DROP POLICY IF EXISTS "Adminlər təyinatları idarə edir" ON public.teacher_assignments;
CREATE POLICY "Adminlər təyinatları idarə edir"
    ON public.teacher_assignments FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Müəllimlər öz təyinatlarını görür" ON public.teacher_assignments;
CREATE POLICY "Müəllimlər öz təyinatlarını görür"
    ON public.teacher_assignments FOR SELECT
    USING (teacher_id = auth.uid() OR public.is_admin());

-- 7.6 Parent-Student Links Siyasətləri
DROP POLICY IF EXISTS "Adminlər əlaqələri idarə edir" ON public.parent_student_links;
CREATE POLICY "Adminlər əlaqələri idarə edir"
    ON public.parent_student_links FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Valideynlər öz əlaqələrini görür" ON public.parent_student_links;
CREATE POLICY "Valideynlər öz əlaqələrini görür"
    ON public.parent_student_links FOR SELECT
    USING (parent_id = auth.uid() OR public.is_admin() OR public.has_teacher_student_access(student_id));

-- 7.7 Parent Connection Requests Siyasətləri
DROP POLICY IF EXISTS "Adminlər bütün müraciətləri idarə edir" ON public.parent_connection_requests;
DROP POLICY IF EXISTS "Valideynlər öz müraciətlərini görür və göndərir" ON public.parent_connection_requests;
DROP POLICY IF EXISTS "Valideynlər öz müraciətlərinin statusuna baxır" ON public.parent_connection_requests;
DROP POLICY IF EXISTS "Müəllimlər öz siniflərinə aid müraciətlərə baxa və qərar verə bilər" ON public.parent_connection_requests;

CREATE POLICY "Valideynlər müraciət göndərir"
    ON public.parent_connection_requests FOR INSERT
    WITH CHECK (auth.uid() = parent_id OR public.is_admin());

CREATE POLICY "Müraciətlərə baxış icazəsi"
    ON public.parent_connection_requests FOR SELECT
    USING (
        auth.uid() = parent_id OR 
        public.is_admin() OR 
        public.is_teacher() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Admin və müəllimlər müraciətləri təsdiqləyir"
    ON public.parent_connection_requests FOR UPDATE
    USING (
        public.is_admin() OR 
        public.is_teacher() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

-- 7.8 Assessments (T-Şkala) Siyasətləri
-- Admin: Tam nəzarət
-- Müəllim: Yalnız təyin olunduğu şagirdlərə qiymətləndirmə yaza, redaktə edə və görə bilər
-- Valideyn: YALNIZ və YALNIZ təsdiqlənmiş övladının DƏRC EDİLMİŞ ('published') qiymətləndirmələrinə baxa bilər
DROP POLICY IF EXISTS "Adminlər bütün qiymətləndirmələri idarə edir" ON public.assessments;
CREATE POLICY "Adminlər bütün qiymətləndirmələri idarə edir"
    ON public.assessments FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Müəllimlər öz şagirdlərinin qiymətləndirmələrini idarə edir" ON public.assessments;
CREATE POLICY "Müəllimlər öz şagirdlərinin qiymətləndirmələrini idarə edir"
    ON public.assessments FOR ALL
    USING (public.has_teacher_student_access(student_id));

DROP POLICY IF EXISTS "Valideynlər yalnız öz övladının dərc olunmuş qiymətləndirməsini oxuya bilər" ON public.assessments;
CREATE POLICY "Valideynlər yalnız öz övladının dərc olunmuş qiymətləndirməsini oxuya bilər"
    ON public.assessments FOR SELECT
    USING (
        status = 'published' AND public.has_parent_student_access(student_id)
    );

-- 7.9 Feedback Items Siyasətləri
-- Yalnız əlaqəli assessment-ə baxış icazəsi olanlar baxa bilər
DROP POLICY IF EXISTS "Assessment-ə çıxışı olanlar rəy bəndlərini görür" ON public.feedback_items;
CREATE POLICY "Assessment-ə çıxışı olanlar rəy bəndlərini görür"
    ON public.feedback_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = feedback_items.assessment_id
              AND (
                public.is_admin()
                OR (public.is_teacher() AND public.has_teacher_student_access(a.student_id))
                OR (public.is_parent() AND a.status = 'published' AND public.has_parent_student_access(a.student_id))
              )
        )
    );

DROP POLICY IF EXISTS "Müəllimlər və adminlər rəy bəndlərini idarə edir" ON public.feedback_items;
CREATE POLICY "Müəllimlər və adminlər rəy bəndlərini idarə edir"
    ON public.feedback_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.assessments a
            WHERE a.id = feedback_items.assessment_id
              AND (public.is_admin() OR (public.is_teacher() AND public.has_teacher_student_access(a.student_id)))
        )
    );

-- 7.10 Notifications Siyasətləri
DROP POLICY IF EXISTS "İstifadəçilər yalnız öz bildirişlərini görür və yeniləyir" ON public.notifications;
CREATE POLICY "İstifadəçilər yalnız öz bildirişlərini görür və yeniləyir"
    ON public.notifications FOR ALL
    USING (auth.uid() = user_id);

-- 7.11 Audit Logs Siyasətləri
DROP POLICY IF EXISTS "Yalnız adminlər audit qeydlərini görür" ON public.audit_logs;
CREATE POLICY "Yalnız adminlər audit qeydlərini görür"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Sistem və istifadəçilər audit qeydi yarada bilər" ON public.audit_logs;
CREATE POLICY "Sistem və istifadəçilər audit qeydi yarada bilər"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- 8. İCAZƏLƏR (GRANTS)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;
