export type UserRole = 'admin' | 'teacher' | 'parent';
export type AssessmentStatus = 'draft' | 'published' | 'archived';
export type FeedbackType = 'positive' | 'development_area';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade_level: number;
  academic_year: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  father_name?: string | null;
  class_id: string;
  birth_date?: string | null;
  gender?: 'male' | 'female' | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  class?: SchoolClass;
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year: string;
  created_at: string;
  teacher?: Profile;
  class?: SchoolClass;
  subject?: Subject;
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship_type?: string;
  status: RequestStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  parent?: Profile;
}

export interface ParentConnectionRequest {
  id: string;
  parent_id: string;
  student_code: string;
  student_first_name: string;
  student_last_name: string;
  class_id?: string | null;
  relationship_type?: string;
  status: RequestStatus;
  reviewer_id?: string | null;
  review_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  parent?: Profile;
  class?: SchoolClass;
}

export interface FeedbackItem {
  id: string;
  assessment_id: string;
  type: FeedbackType;
  content: string;
  sort_order: number;
  created_at: string;
}

export interface Assessment {
  id: string;
  student_id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  topic: string;
  standard: string;
  assessment_date: string;
  next_step?: string | null;
  general_observation?: string | null;
  status: AssessmentStatus;
  created_by: string;
  updated_by?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
  teacher?: Profile;
  class?: SchoolClass;
  subject?: Subject;
  feedback_items?: FeedbackItem[];
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}
