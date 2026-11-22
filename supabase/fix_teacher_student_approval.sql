-- ==============================================================================
-- TƏSDİQLƏMƏ VƏ ŞAGİRD ƏLAVƏ EDİLMƏSİ ÜÇÜN DÜZƏLİŞ SCRİPT-İ
-- Bu skripti Supabase Dashboard -> SQL Editor hissəsində icra edin.
-- ==============================================================================

-- 1. Müəllimlərin şagirdlərə çıxış icazəsi funksiyasını genişləndiririk
CREATE OR REPLACE FUNCTION public.has_teacher_student_access(p_student_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.teacher_assignments ta ON ta.class_id = s.class_id
        WHERE s.id = p_student_id AND ta.teacher_id = auth.uid()
    ) 
    OR public.is_admin()
    OR public.is_teacher()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Şagirdlər cədvəlində Müəllimlərə INSERT və idarəetmə hüququ veririk
DROP POLICY IF EXISTS "Adminlər şagirdləri tam idarə edir" ON public.students;
DROP POLICY IF EXISTS "Admin və müəllimlər şagirdləri tam idarə edir" ON public.students;
DROP POLICY IF EXISTS "Müəllimlər təyin olunduğu sinfin şagirdlərini görür" ON public.students;
DROP POLICY IF EXISTS "Valideynlər yalnız təsdiqlənmiş övladlarını görür" ON public.students;

CREATE POLICY "Admin və müəllimlər şagirdləri tam idarə edir"
    ON public.students FOR ALL
    USING (
        public.is_admin() OR 
        public.is_teacher() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    )
    WITH CHECK (
        public.is_admin() OR 
        public.is_teacher() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Valideynlər yalnız təsdiqlənmiş övladlarını görür"
    ON public.students FOR SELECT
    USING (public.has_parent_student_access(id));

-- 3. Valideyn-şagird əlaqələri cədvəlində Müəllimlərə də icazə veririk
DROP POLICY IF EXISTS "Adminlər əlaqələri idarə edir" ON public.parent_student_links;
DROP POLICY IF EXISTS "Admin və müəllimlər əlaqələri idarə edir" ON public.parent_student_links;
DROP POLICY IF EXISTS "Valideynlər öz əlaqələrini görür" ON public.parent_student_links;

CREATE POLICY "Admin və müəllimlər əlaqələri idarə edir"
    ON public.parent_student_links FOR ALL
    USING (
        public.is_admin() OR 
        public.is_teacher() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    )
    WITH CHECK (
        public.is_admin() OR 
        public.is_teacher() OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
    );

CREATE POLICY "Valideynlər öz əlaqələrini görür"
    ON public.parent_student_links FOR SELECT
    USING (parent_id = auth.uid() OR public.is_admin() OR public.has_teacher_student_access(student_id));

-- 4. Baza səviyyəsində avtomatik Şagird yaradan TRIGGER (Müəllim və ya Admin təsdiqlədiyi an icra olunur)
CREATE OR REPLACE FUNCTION public.handle_parent_request_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    v_class_id UUID;
    v_code TEXT;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
        v_class_id := NEW.class_id;
        IF v_class_id IS NULL THEN
            SELECT id INTO v_class_id FROM public.classes WHERE is_archived = false ORDER BY grade_level LIMIT 1;
            NEW.class_id := v_class_id;
        END IF;

        -- Mövcud şagirdi axtar
        SELECT id INTO v_student_id FROM public.students
        WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(NEW.student_first_name))
          AND LOWER(TRIM(last_name)) = LOWER(TRIM(NEW.student_last_name))
        LIMIT 1;

        -- Şagird yoxdursa, avtomatik yarat
        IF v_student_id IS NULL AND v_class_id IS NOT NULL THEN
            IF NEW.student_code IS NOT NULL AND NEW.student_code LIKE 'SAG-%' THEN
                v_code := NEW.student_code;
            ELSE
                v_code := 'SAG-' || FLOOR(10000 + random() * 90000)::TEXT;
            END IF;

            INSERT INTO public.students (first_name, last_name, class_id, student_code, is_archived)
            VALUES (TRIM(NEW.student_first_name), TRIM(NEW.student_last_name), v_class_id, v_code, false)
            RETURNING id INTO v_student_id;
        END IF;

        -- Valideyn əlaqəsini təmin et
        IF v_student_id IS NOT NULL AND NEW.parent_id IS NOT NULL THEN
            INSERT INTO public.parent_student_links (parent_id, student_id, relationship_type, status)
            VALUES (NEW.parent_id, v_student_id, COALESCE(NEW.relationship_type, 'valideyn'), 'approved')
            ON CONFLICT (parent_id, student_id) DO UPDATE SET status = 'approved';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_parent_request_approval ON public.parent_connection_requests;
CREATE TRIGGER trigger_parent_request_approval
    BEFORE UPDATE ON public.parent_connection_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_parent_request_approval();

-- 5. Təhlükəsiz RPC funksiyası
CREATE OR REPLACE FUNCTION public.approve_parent_connection_request(
    p_request_id UUID,
    p_reviewer_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_req RECORD;
    v_student_id UUID;
    v_class_id UUID;
    v_code TEXT;
BEGIN
    SELECT * INTO v_req FROM public.parent_connection_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Müraciət tapılmadı');
    END IF;

    v_class_id := v_req.class_id;
    IF v_class_id IS NULL THEN
        SELECT id INTO v_class_id FROM public.classes WHERE is_archived = false ORDER BY grade_level LIMIT 1;
    END IF;

    SELECT id INTO v_student_id FROM public.students
    WHERE LOWER(TRIM(first_name)) = LOWER(TRIM(v_req.student_first_name))
      AND LOWER(TRIM(last_name)) = LOWER(TRIM(v_req.student_last_name))
    LIMIT 1;

    IF v_student_id IS NULL AND v_class_id IS NOT NULL THEN
        IF v_req.student_code IS NOT NULL AND v_req.student_code LIKE 'SAG-%' THEN
            v_code := v_req.student_code;
        ELSE
            v_code := 'SAG-' || FLOOR(10000 + random() * 90000)::TEXT;
        END IF;

        INSERT INTO public.students (first_name, last_name, class_id, student_code, is_archived)
        VALUES (TRIM(v_req.student_first_name), TRIM(v_req.student_last_name), v_class_id, v_code, false)
        RETURNING id INTO v_student_id;
    END IF;

    IF v_student_id IS NOT NULL AND v_req.parent_id IS NOT NULL THEN
        INSERT INTO public.parent_student_links (parent_id, student_id, relationship_type, status)
        VALUES (v_req.parent_id, v_student_id, COALESCE(v_req.relationship_type, 'valideyn'), 'approved')
        ON CONFLICT (parent_id, student_id) DO UPDATE SET status = 'approved';
    END IF;

    UPDATE public.parent_connection_requests
    SET status = 'approved',
        reviewer_id = COALESCE(p_reviewer_id, auth.uid()),
        review_notes = p_notes,
        reviewed_at = NOW(),
        class_id = COALESCE(class_id, v_class_id)
    WHERE id = p_request_id;

    RETURN jsonb_build_object('success', true, 'student_id', v_student_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
