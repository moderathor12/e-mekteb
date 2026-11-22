export * from './database';

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  pendingRequests: number;
  totalAssessments: number;
  publishedAssessments: number;
  recentActivities: {
    id: string;
    action: string;
    description: string;
    timestamp: string;
    user?: string;
  }[];
}

export interface AssessmentFormData {
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
}
