-- ==========================================================
-- SMART STUDENT MANAGEMENT SYSTEM - DATABASE SEED SCRIPT
-- ==========================================================
-- Make sure to run migration.sql first!
-- Paste this script into your Supabase SQL Editor to populate sample data.

-- Enable pgcrypto extension for password encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insert Authentication Users (auth.users)
-- Passwords:
-- Admin: admin123
-- Teachers: teacher123
-- Students/Parents: student123 / parent123
INSERT INTO auth.users (id, aud, email, encrypted_password, email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'authenticated', 'admin@nexus.edu', crypt('admin123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Principal","role":"admin"}', now(), now(), 'authenticated', ''),
  ('b0000000-0000-0000-0000-000000000001', 'authenticated', 'teacher.sarah@nexus.edu', crypt('teacher123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Connor","role":"teacher"}', now(), now(), 'authenticated', ''),
  ('b0000000-0000-0000-0000-000000000002', 'authenticated', 'teacher.alan@nexus.edu', crypt('teacher123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alan Turing","role":"teacher"}', now(), now(), 'authenticated', ''),
  ('c0000000-0000-0000-0000-000000000001', 'authenticated', 'student.john@nexus.edu', crypt('student123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"John Doe","role":"student"}', now(), now(), 'authenticated', ''),
  ('c0000000-0000-0000-0000-000000000002', 'authenticated', 'student.jane@nexus.edu', crypt('student123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jane Smith","role":"student"}', now(), now(), 'authenticated', ''),
  ('d0000000-0000-0000-0000-000000000001', 'authenticated', 'parent@nexus.edu', crypt('parent123', gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"James Smith","role":"parent"}', now(), now(), 'authenticated', '')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Classes
INSERT INTO public.classes (id, grade_name, section, room)
VALUES
  ('c0000000-0000-0000-0000-00000000008a', 'Class 8', 'A', 'Room 101'),
  ('c0000000-0000-0000-0000-00000000008b', 'Class 8', 'B', 'Room 102'),
  ('c0000000-0000-0000-0000-00000000009a', 'Class 9', 'A', 'Room 201'),
  ('c0000000-0000-0000-0000-00000000010a', 'Class 10', 'A', 'Room 301')
ON CONFLICT (id) DO NOTHING;

-- 3. Update Custom Teacher Details (Trigger already inserted profile & teacher row, we now update details)
UPDATE public.teachers SET qualification = 'M.Sc. in Physics, B.Ed.', experience = '6 Years', schedule = '[
  {"day": "Monday", "time": "09:00 AM - 10:00 AM", "subject": "Physics", "class": "Class 10-A"},
  {"day": "Monday", "time": "11:00 AM - 12:00 PM", "subject": "Physics", "class": "Class 9-A"},
  {"day": "Wednesday", "time": "10:00 AM - 11:00 AM", "subject": "Physics", "class": "Class 10-A"},
  {"day": "Friday", "time": "01:00 PM - 02:00 PM", "subject": "Physics", "class": "Class 8-A"}
]'::jsonb WHERE id = 'b0000000-0000-0000-0000-000000000001';

UPDATE public.teachers SET qualification = 'Ph.D. in Mathematics', experience = '10 Years', schedule = '[
  {"day": "Tuesday", "time": "09:00 AM - 10:00 AM", "subject": "Mathematics", "class": "Class 10-A"},
  {"day": "Tuesday", "time": "01:00 PM - 02:00 PM", "subject": "Mathematics", "class": "Class 8-A"},
  {"day": "Thursday", "time": "09:00 AM - 10:00 AM", "subject": "Mathematics", "class": "Class 9-A"}
]'::jsonb WHERE id = 'b0000000-0000-0000-0000-000000000002';

-- 4. Update Custom Student Details (Trigger already inserted student, we update linking details)
UPDATE public.students SET 
  roll_number = '12', 
  class_id = 'c0000000-0000-0000-0000-00000000010a', 
  parent_id = 'd0000000-0000-0000-0000-000000000001', 
  date_of_birth = '2012-05-15', 
  status = 'active', 
  gpa = 3.82, 
  level = 3, 
  exp = 280 
WHERE id = 'c0000000-0000-0000-0000-000000000001';

UPDATE public.students SET 
  roll_number = '05', 
  class_id = 'c0000000-0000-0000-0000-00000000010a', 
  date_of_birth = '2012-08-20', 
  status = 'active', 
  gpa = 3.95, 
  level = 4, 
  exp = 420 
WHERE id = 'c0000000-0000-0000-0000-000000000002';

-- 5. Insert Subjects
INSERT INTO public.subjects (id, name, teacher_id, class_id)
VALUES
  (uuid_generate_v4(), 'Physics', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000010a'),
  (uuid_generate_v4(), 'Physics', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000009a'),
  (uuid_generate_v4(), 'Mathematics', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000010a'),
  (uuid_generate_v4(), 'Mathematics', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000008a')
ON CONFLICT (name, class_id) DO NOTHING;

-- 6. Insert Exams
INSERT INTO public.exams (id, class_id, title, exam_type, max_marks, subject_name, date)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000010a', 'Physics Unit Test 1', 'unit', 50, 'Physics', CURRENT_DATE - 15),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000010a', 'Mathematics Midterm 2026', 'midterm', 100, 'Mathematics', CURRENT_DATE - 5)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Exam Marks
INSERT INTO public.marks (id, student_id, exam_id, marks_obtained)
VALUES
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 42.5),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 48.0),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 88.0),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 96.5)
ON CONFLICT (student_id, exam_id) DO NOTHING;

-- 8. Insert Notices
INSERT INTO public.notices (id, title, content, notice_type, created_by, created_at)
VALUES
  (uuid_generate_v4(), 'Midterm Results Declared', 'The results for Mathematics Midterm 2026 have been published. Check your marksheet on your dashboard.', 'announcement', 'a0000000-0000-0000-0000-000000000001', now()),
  (uuid_generate_v4(), 'Robotics Club Hackathon', 'Join us for the inter-school robotics battle next Friday. Win cash prizes and merit badges!', 'event', 'b0000000-0000-0000-0000-000000000002', now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- 9. Insert Fees
INSERT INTO public.fees (id, student_id, amount, description, due_date, status, invoice_number, paid_at)
VALUES
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 250.00, 'Tuition Fee - June 2026', CURRENT_DATE + 5, 'pending', 'INV-2026-001', NULL),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 120.00, 'Laboratory Fee - Term 1', CURRENT_DATE - 10, 'paid', 'INV-2026-002', now() - interval '9 days'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 250.00, 'Tuition Fee - June 2026', CURRENT_DATE + 5, 'pending', 'INV-2026-003', NULL),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 250.00, 'Tuition Fee - May 2026', CURRENT_DATE - 25, 'paid', 'INV-2026-004', now() - interval '24 days')
ON CONFLICT (invoice_number) DO NOTHING;

-- 10. Insert Badges
INSERT INTO public.badges (id, student_id, badge_type, title, description, earned_at)
VALUES
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'consistent_learner', 'Consistent Learner', 'Logged in and checked notifications every day for 2 weeks.', now() - interval '4 days'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'top_performer', 'Top Performer', 'Scored a perfect score in Mathematics Midterm.', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

-- 11. Insert Attendance Records (For the last 3 days)
INSERT INTO public.attendance (id, student_id, class_id, date, status, method, marked_by)
VALUES
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000010a', CURRENT_DATE - 2, 'present', 'manual', 'b0000000-0000-0000-0000-000000000001'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000010a', CURRENT_DATE - 2, 'present', 'manual', 'b0000000-0000-0000-0000-000000000001'),
  
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000010a', CURRENT_DATE - 1, 'present', 'qr', 'b0000000-0000-0000-0000-000000000001'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000010a', CURRENT_DATE - 1, 'present', 'qr', 'b0000000-0000-0000-0000-000000000001'),
  
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-00000000010a', CURRENT_DATE, 'present', 'manual', 'b0000000-0000-0000-0000-000000000001'),
  (uuid_generate_v4(), 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-00000000010a', CURRENT_DATE, 'late', 'manual', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT (student_id, date) DO NOTHING;
