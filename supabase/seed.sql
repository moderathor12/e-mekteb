-- ==============================================================================
-- T-ŞKALA: İlkin Nümunə və Test Məlumatları (Seed Data)
-- ==============================================================================

-- 1. FƏNLƏRİN ƏLAVƏ EDİLMƏSİ
INSERT INTO public.subjects (id, name, code, description) VALUES
    ('11111111-1111-1111-1111-111111110001', 'Azərbaycan dili', 'AZE-DIL', 'Dövlət dili və nitq mədəniyyəti'),
    ('11111111-1111-1111-1111-111111110002', 'Riyaziyyat', 'RIYAZ', 'Həndəsə və cəbr əsasları'),
    ('11111111-1111-1111-1111-111111110003', 'İngilis dili', 'ING-DIL', 'Xarici dil bacarıqları'),
    ('11111111-1111-1111-1111-111111110004', 'Tarix', 'TARIX', 'Azərbaycan və ümumi tarix'),
    ('11111111-1111-1111-1111-111111110005', 'Fizika', 'FIZIKA', 'Təbiət elmləri və fiziki hadisələr'),
    ('11111111-1111-1111-1111-111111110006', 'Biologiya', 'BIOL', 'Həyat elmləri və canlılar aləmi'),
    ('11111111-1111-1111-1111-111111110007', 'İnformatika', 'INFO', 'Rəqəmsal bacarıqlar və proqramlaşdırma')
ON CONFLICT (name) DO NOTHING;

-- 2. SİNİFLƏRİN ƏLAVƏ EDİLMƏSİ
INSERT INTO public.classes (id, name, grade_level, academic_year) VALUES
    ('22222222-2222-2222-2222-222222220001', '5A', 5, '2026-2027'),
    ('22222222-2222-2222-2222-222222220002', '5B', 5, '2026-2027'),
    ('22222222-2222-2222-2222-222222220003', '6A', 6, '2026-2027'),
    ('22222222-2222-2222-2222-222222220004', '7A', 7, '2026-2027'),
    ('22222222-2222-2222-2222-222222220005', '8A', 8, '2026-2027'),
    ('22222222-2222-2222-2222-222222220006', '9B', 9, '2026-2027')
ON CONFLICT DO NOTHING;

-- 3. ŞAGİRDLƏRİN ƏLAVƏ EDİLMƏSİ (Unikal və təhlükəsiz şagird kodları ilə)
INSERT INTO public.students (id, student_code, first_name, last_name, father_name, class_id, birth_date, gender) VALUES
    ('33333333-3333-3333-3333-333333330001', 'TSK-5A-101', 'Aylin', 'Həsənli', 'Rəşad', '22222222-2222-2222-2222-222222220001', '2015-04-12', 'female'),
    ('33333333-3333-3333-3333-333333330002', 'TSK-5A-102', 'Murad', 'Quliyev', 'Elçin', '22222222-2222-2222-2222-222222220001', '2015-08-25', 'male'),
    ('33333333-3333-3333-3333-333333330003', 'TSK-5A-103', 'Nigar', 'Əliyeva', 'Vüqar', '22222222-2222-2222-2222-222222220001', '2015-02-18', 'female'),
    ('33333333-3333-3333-3333-333333330004', 'TSK-5A-104', 'Tural', 'Məmmədov', 'Anar', '22222222-2222-2222-2222-222222220001', '2015-11-05', 'male'),
    ('33333333-3333-3333-3333-333333330005', 'TSK-5A-105', 'Zəhra', 'İsmayılova', 'İlqar', '22222222-2222-2222-2222-222222220001', '2015-06-30', 'female'),
    ('33333333-3333-3333-3333-333333330006', 'TSK-5B-201', 'Kənan', 'Cəfərov', 'Samir', '22222222-2222-2222-2222-222222220002', '2015-03-14', 'male'),
    ('33333333-3333-3333-3333-333333330007', 'TSK-5B-202', 'Ləman', 'Bağırova', 'Eldar', '22222222-2222-2222-2222-222222220002', '2015-09-22', 'female'),
    ('33333333-3333-3333-3333-333333330008', 'TSK-6A-301', 'Fərid', 'Rzayev', 'Tahir', '22222222-2222-2222-2222-222222220003', '2014-05-19', 'male')
ON CONFLICT (student_code) DO NOTHING;

-- 4. QEYD: İLKİN İSTİFADƏÇİ (ADMIN) VƏ MÜƏLLİMLƏR
-- Supabase Auth istifadəçiləri yaradıldıqda trigger vasitəsilə profiles cədvəlinə düşür.
-- İlk administrator və ya müəllimləri təyin etmək üçün aşağıdakı SQL nümunəsi istifadə edilə bilər:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@mekteb.edu.az';
