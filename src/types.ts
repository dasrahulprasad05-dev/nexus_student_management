export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Class {
  id: string;
  grade_name: string;
  section: string;
  room?: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  roll_number?: string;
  class_id?: string;
  parent_id?: string;
  date_of_birth?: string;
  status: 'active' | 'inactive' | 'graduated';
  gpa: number;
  level: number;
  exp: number;
  created_at: string;
  // Joined fields for convenience
  profiles?: Profile;
  classes?: Class;
}

export interface Teacher {
  id: string;
  qualification?: string;
  experience?: string;
  schedule: TimetableEntry[];
  created_at: string;
  profiles?: Profile;
}

export interface TimetableEntry {
  day: string; // 'Monday', 'Tuesday', etc.
  time: string; // '09:00 AM - 10:00 AM'
  subject: string;
  class: string;
}

export interface Subject {
  id: string;
  name: string;
  teacher_id?: string;
  class_id: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  method: 'manual' | 'qr';
  marked_by?: string;
  created_at: string;
  profiles?: Profile;
}

export interface Exam {
  id: string;
  class_id: string;
  title: string;
  exam_type: 'unit' | 'midterm' | 'final';
  max_marks: number;
  subject_name: string;
  date: string;
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  exam_id: string;
  marks_obtained: number;
  created_at: string;
  exams?: Exam;
  students?: Student;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description?: string;
  deadline: string;
  subject_name: string;
  file_url?: string;
  created_by?: string;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late';
  grade?: string;
  feedback?: string;
  file_url?: string;
  students?: Student;
  assignments?: Assignment;
}

export interface Fee {
  id: string;
  student_id: string;
  amount: number;
  description: string;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  invoice_number: string;
  paid_at?: string;
  created_at: string;
  students?: Student;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  notice_type: 'announcement' | 'event' | 'holiday';
  created_by?: string;
  created_at: string;
  profiles?: Profile;
}

export interface Badge {
  id: string;
  student_id: string;
  badge_type: string;
  title: string;
  description: string;
  earned_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  details?: string;
  created_at: string;
  profiles?: Profile;
}
