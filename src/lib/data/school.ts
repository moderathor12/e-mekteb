import { createClient } from '@/lib/supabase/client';
import { SchoolClass, Subject, Student, Profile } from '@/types';

export async function getSchoolInitialData() {
  const supabase = createClient();

  const [classesRes, subjectsRes, studentsRes] = await Promise.all([
    supabase.from('classes').select('*').eq('is_archived', false).order('grade_level', { ascending: true }),
    supabase.from('subjects').select('*').eq('is_archived', false).order('name', { ascending: true }),
    supabase.from('students').select('*, class:classes(*)').eq('is_archived', false).order('first_name', { ascending: true }),
  ]);

  return {
    classes: (classesRes.data || []) as SchoolClass[],
    subjects: (subjectsRes.data || []) as Subject[],
    students: (studentsRes.data || []) as Student[],
  };
}
