import { createClient } from '@/lib/supabase/client';
import { Assessment, SchoolClass, Subject, Student, ParentConnectionRequest } from '@/types';

// Qiymətləndirmə yaratmaq və ya redaktə etmək
export async function saveAssessment(payload: {
  id?: string;
  class_id: string;
  subject_id: string;
  student_id: string;
  topic: string;
  standard: string;
  assessment_date: string;
  positive_feedback: string[];
  development_feedback: string[];
  next_step: string;
  general_observation: string;
  status: 'draft' | 'published';
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('İstifadəçi daxil olmayıb');

  const assessmentData = {
    class_id: payload.class_id,
    subject_id: payload.subject_id,
    student_id: payload.student_id,
    topic: payload.topic,
    standard: payload.standard,
    assessment_date: payload.assessment_date,
    next_step: payload.next_step,
    general_observation: payload.general_observation,
    status: payload.status,
    teacher_id: user.id,
    created_by: user.id,
    updated_by: user.id,
    published_at: payload.status === 'published' ? new Date().toISOString() : null,
  };

  let assessmentId = payload.id;

  if (assessmentId) {
    const { error } = await supabase
      .from('assessments')
      .update(assessmentData)
      .eq('id', assessmentId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('assessments')
      .insert(assessmentData)
      .select('id')
      .single();
    if (error) throw error;
    assessmentId = data.id;
  }

  // Əvvəlki rəy bəndlərini təmizləyib yenilərini daxil edirik
  if (assessmentId) {
    await supabase.from('feedback_items').delete().eq('assessment_id', assessmentId);

    const feedbackToInsert = [
      ...payload.positive_feedback.map((content, idx) => ({
        assessment_id: assessmentId,
        type: 'positive' as const,
        content,
        sort_order: idx,
      })),
      ...payload.development_feedback.map((content, idx) => ({
        assessment_id: assessmentId,
        type: 'development_area' as const,
        content,
        sort_order: idx,
      })),
    ];

    if (feedbackToInsert.length > 0) {
      const { error: fbError } = await supabase.from('feedback_items').insert(feedbackToInsert);
      if (fbError) throw fbError;
    }
  }

  return assessmentId;
}
