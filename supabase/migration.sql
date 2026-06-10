-- Enable UUID generator extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Define role and status enums
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE exam_type_enum AS ENUM ('unit', 'midterm', 'final');
CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late');
CREATE TYPE submission_status_enum AS ENUM ('submitted', 'graded', 'late');
CREATE TYPE fee_status_enum AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE notice_type_enum AS ENUM ('announcement', 'event', 'holiday');

-- 1. Profiles Table (Extends Supabase Auth users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Classes Table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_name TEXT NOT NULL, -- e.g. "Class 8", "Class 9"
    section TEXT NOT NULL,    -- e.g. "A", "B", "C"
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(grade_name, section)
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- 3. Students Table
CREATE TABLE public.students (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL UNIQUE, -- Unique alphanumeric ID
    roll_number TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date_of_birth DATE,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'graduated')) DEFAULT 'active',
    gpa NUMERIC(3,2) DEFAULT 0.00,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. Teachers Table
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    qualification TEXT,
    experience TEXT,
    schedule JSONB DEFAULT '[]'::jsonb, -- Weekly timetable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- 5. Subjects Table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (name, class_id)
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 6. Attendance Table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status_enum NOT NULL,
    method TEXT CHECK (method IN ('manual', 'qr')) DEFAULT 'manual',
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- 7. Exams Table
CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    exam_type exam_type_enum NOT NULL,
    max_marks INTEGER DEFAULT 100 NOT NULL,
    subject_name TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- 8. Marks Table
CREATE TABLE public.marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, exam_id)
);

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

-- 9. Assignments Table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    subject_name TEXT NOT NULL,
    file_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 10. Submissions Table
CREATE TABLE public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status submission_status_enum NOT NULL DEFAULT 'submitted',
    grade TEXT,
    feedback TEXT,
    file_url TEXT,
    UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 11. Fees Table
CREATE TABLE public.fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status fee_status_enum NOT NULL DEFAULT 'pending',
    invoice_number TEXT NOT NULL UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

-- 12. Notices Table
CREATE TABLE public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notice_type notice_type_enum NOT NULL DEFAULT 'announcement',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 13. Badges Table
CREATE TABLE public.badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL, -- 'top_performer', 'perfect_attendance', etc.
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- 14. Activity Logs Table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;


-- Helper function to check role of authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Select Policies for general tables (viewable by authenticated users)
CREATE POLICY "Viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.exams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.notices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.badges FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Viewable by authenticated users" ON public.activity_logs FOR SELECT USING (auth.role() = 'authenticated');

-- Secure specific tables
CREATE POLICY "Staff view all marks" ON public.marks FOR SELECT USING (public.get_auth_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Students view own marks" ON public.marks FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Parents view child marks" ON public.marks FOR SELECT USING (
  student_id IN (
    SELECT id FROM public.students WHERE parent_id = auth.uid()
  )
);

CREATE POLICY "Admin view all fees" ON public.fees FOR SELECT USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Students view own fees" ON public.fees FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Staff view all submissions" ON public.submissions FOR SELECT USING (public.get_auth_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Students view own submissions" ON public.submissions FOR SELECT USING (student_id = auth.uid());

-- Update own profile / student / teacher details
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Students can update own details" ON public.students FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Teachers can update own details" ON public.teachers FOR UPDATE USING (auth.uid() = id);

-- Write/Modify Policies (Restricted by Role)

-- Admin can do everything
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.classes FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.students FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.teachers FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.subjects FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.attendance FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.exams FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.marks FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.assignments FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.submissions FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.fees FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.notices FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.badges FOR ALL USING (public.get_auth_user_role() = 'admin');
CREATE POLICY "Admin full access" ON public.activity_logs FOR ALL USING (public.get_auth_user_role() = 'admin');

-- Teacher operations
CREATE POLICY "Teacher mark attendance" ON public.attendance FOR ALL USING (public.get_auth_user_role() = 'teacher');
CREATE POLICY "Teacher publish exams" ON public.exams FOR ALL USING (public.get_auth_user_role() = 'teacher');
CREATE POLICY "Teacher grade marks" ON public.marks FOR ALL USING (public.get_auth_user_role() = 'teacher');
CREATE POLICY "Teacher publish assignments" ON public.assignments FOR ALL USING (public.get_auth_user_role() = 'teacher');
CREATE POLICY "Teacher score submissions" ON public.submissions FOR ALL USING (public.get_auth_user_role() = 'teacher');
CREATE POLICY "Teacher manage notices" ON public.notices FOR ALL USING (public.get_auth_user_role() = 'teacher');

-- Student operations
CREATE POLICY "Student submit assignments" ON public.submissions FOR INSERT WITH CHECK (
    auth.uid() = student_id AND public.get_auth_user_role() = 'student'
);
CREATE POLICY "Student update own submission" ON public.submissions FOR UPDATE USING (
    auth.uid() = student_id AND public.get_auth_user_role() = 'student'
);

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Trigger to automatically insert a profile row when a user signs up via auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  );
  
  -- Create dependent table rows based on role
  IF COALESCE(new.raw_user_meta_data->>'role', 'student') = 'student' THEN
    INSERT INTO public.students (id, student_id, roll_number, status)
    VALUES (
      new.id,
      'STU' || to_char(now(), 'YYYY') || '-' || lpad(floor(random()*100000)::text, 5, '0'),
      lpad(floor(random()*100)::text, 2, '0'),
      'active'
    );
  ELSIF COALESCE(new.raw_user_meta_data->>'role', 'student') = 'teacher' THEN
    INSERT INTO public.teachers (id, qualification, experience)
    VALUES (new.id, 'Bachelor of Science / Education', '3+ Years');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC function to seed demo records into the database
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS void AS $$
BEGIN
  -- Insert Classes
  INSERT INTO public.classes (id, grade_name, section, room)
  VALUES
    ('c0000000-0000-0000-0000-00000000008a', 'Class 8', 'A', 'Room 101'),
    ('c0000000-0000-0000-0000-00000000008b', 'Class 8', 'B', 'Room 102'),
    ('c0000000-0000-0000-0000-00000000009a', 'Class 9', 'A', 'Room 201'),
    ('c0000000-0000-0000-0000-00000000010a', 'Class 10', 'A', 'Room 301')
  ON CONFLICT (id) DO NOTHING;

  -- Verify and update mock levels/GPA for john doe and jane smith
  UPDATE public.students SET 
    roll_number = '12', 
    class_id = 'c0000000-0000-0000-0000-00000000010a', 
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

  -- Create default notices
  INSERT INTO public.notices (title, content, notice_type, created_at)
  VALUES
    ('Midterm Results Declared', 'The results for Mathematics Midterm 2026 have been published. Check your marksheet on your dashboard.', 'announcement', now()),
    ('Robotics Club Hackathon', 'Join us for the inter-school robotics battle next Friday. Win cash prizes and merit badges!', 'event', now() - interval '2 days')
  ON CONFLICT DO NOTHING;

  -- Create activity log
  INSERT INTO public.activity_logs (action, details)
  VALUES ('DATABASE_SEED', 'Standard demo classes, notices, and student GPAs seeded/verified successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to register a new student from the Admin Directory
CREATE OR REPLACE FUNCTION public.create_student_profile(
  p_email TEXT,
  p_name TEXT,
  p_roll TEXT,
  p_class_id UUID,
  p_dob DATE
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert dummy user into auth.users (encrypted password set to 'student123')
  INSERT INTO auth.users (id, aud, email, encrypted_password, email_confirmed_at, phone_confirmed_at, raw_app_meta_data, raw_user_meta_data, role, confirmation_token)
  VALUES (
    uuid_generate_v4(),
    'authenticated',
    p_email,
    crypt('student123', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('full_name', p_name, 'role', 'student'),
    'authenticated',
    ''
  )
  RETURNING id INTO v_user_id;

  -- The trigger 'on_auth_user_created' runs automatically and inserts rows in public.profiles and public.students.
  -- We now update class, roll, and dob on the newly created student record.
  UPDATE public.students
  SET 
    class_id = p_class_id,
    roll_number = p_roll,
    date_of_birth = p_dob
  WHERE id = v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================

-- Create buckets for storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for storage.objects
DROP POLICY IF EXISTS "Public Read Submissions" ON storage.objects;
CREATE POLICY "Public Read Submissions" ON storage.objects FOR SELECT USING (bucket_id = 'submissions');

DROP POLICY IF EXISTS "Public Read Assignments" ON storage.objects;
CREATE POLICY "Public Read Assignments" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');

DROP POLICY IF EXISTS "Authenticated Upload Submissions" ON storage.objects;
CREATE POLICY "Authenticated Upload Submissions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions');

DROP POLICY IF EXISTS "Authenticated Upload Assignments" ON storage.objects;
CREATE POLICY "Authenticated Upload Assignments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments');


-- ==========================================
-- AUTOMATIC GPA RECAlCULATION
-- ==========================================

CREATE OR REPLACE FUNCTION public.calculate_student_gpa(p_student_id UUID)
RETURNS void AS $$
DECLARE
  v_gpa NUMERIC(3,2);
BEGIN
  SELECT COALESCE(AVG(
    CASE 
      WHEN e.max_marks > 0 AND (m.marks_obtained::numeric / e.max_marks::numeric * 100) >= 90 THEN 4.0
      WHEN e.max_marks > 0 AND (m.marks_obtained::numeric / e.max_marks::numeric * 100) >= 80 THEN 3.5
      WHEN e.max_marks > 0 AND (m.marks_obtained::numeric / e.max_marks::numeric * 100) >= 70 THEN 3.0
      WHEN e.max_marks > 0 AND (m.marks_obtained::numeric / e.max_marks::numeric * 100) >= 60 THEN 2.5
      WHEN e.max_marks > 0 AND (m.marks_obtained::numeric / e.max_marks::numeric * 100) >= 50 THEN 2.0
      ELSE 0.0
    END
  ), 0.00) INTO v_gpa
  FROM public.marks m
  JOIN public.exams e ON m.exam_id = e.id
  WHERE m.student_id = p_student_id;

  UPDATE public.students
  SET gpa = v_gpa
  WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.on_mark_change()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.calculate_student_gpa(OLD.student_id);
    RETURN OLD;
  ELSE
    PERFORM public.calculate_student_gpa(NEW.student_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_mark_change ON public.marks;
CREATE TRIGGER trigger_on_mark_change
  AFTER INSERT OR UPDATE OR DELETE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.on_mark_change();


-- ==========================================
-- GAMIFICATION LOGIC (EXP, LEVEL & BADGES)
-- ==========================================

CREATE OR REPLACE FUNCTION public.add_student_exp(p_student_id UUID, p_exp_to_add INT)
RETURNS void AS $$
DECLARE
  v_current_exp INT;
  v_current_level INT;
  v_next_level_threshold INT;
BEGIN
  SELECT exp, level INTO v_current_exp, v_current_level
  FROM public.students
  WHERE id = p_student_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_current_exp := COALESCE(v_current_exp, 0) + p_exp_to_add;

  LOOP
    v_next_level_threshold := COALESCE(v_current_level, 1) * 100;
    IF v_current_exp >= v_next_level_threshold THEN
      v_current_exp := v_current_exp - v_next_level_threshold;
      v_current_level := COALESCE(v_current_level, 1) + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  UPDATE public.students
  SET exp = v_current_exp, level = v_current_level
  WHERE id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.on_attendance_checkin()
RETURNS trigger AS $$
DECLARE
  v_attendance_count INT;
BEGIN
  IF NEW.status IN ('present', 'late') THEN
    PERFORM public.add_student_exp(NEW.student_id, 10);
    
    SELECT COUNT(*) INTO v_attendance_count
    FROM public.attendance
    WHERE student_id = NEW.student_id AND status IN ('present', 'late');

    IF v_attendance_count >= 5 THEN
      INSERT INTO public.badges (student_id, badge_type, title, description)
      VALUES (
        NEW.student_id,
        'perfect_attendance',
        'Perfect Presence',
        'Maintained a stellar attendance streak by marking present 5 times.'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_attendance_checkin ON public.attendance;
CREATE TRIGGER trigger_on_attendance_checkin
  AFTER INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.on_attendance_checkin();

CREATE OR REPLACE FUNCTION public.on_assignment_submit()
RETURNS trigger AS $$
DECLARE
  v_submission_count INT;
BEGIN
  IF NEW.status = 'submitted' THEN
    PERFORM public.add_student_exp(NEW.student_id, 50);

    SELECT COUNT(*) INTO v_submission_count
    FROM public.submissions
    WHERE student_id = NEW.student_id;

    IF v_submission_count = 1 THEN
      INSERT INTO public.badges (student_id, badge_type, title, description)
      VALUES (
        NEW.student_id,
        'assignment_hero',
        'Assignment Hero',
        'Successfully completed and submitted your first homework coursework assignment.'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_assignment_submit ON public.submissions;
CREATE TRIGGER trigger_on_assignment_submit
  AFTER INSERT OR UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.on_assignment_submit();

CREATE OR REPLACE FUNCTION public.on_high_mark_earned()
RETURNS trigger AS $$
DECLARE
  v_max_marks INT;
  v_percentage NUMERIC(5,2);
BEGIN
  SELECT max_marks INTO v_max_marks
  FROM public.exams
  WHERE id = NEW.exam_id;

  IF v_max_marks > 0 THEN
    v_percentage := (NEW.marks_obtained::numeric / v_max_marks::numeric) * 100;
    
    IF v_percentage >= 90.00 THEN
      PERFORM public.add_student_exp(NEW.student_id, 100);

      INSERT INTO public.badges (student_id, badge_type, title, description)
      VALUES (
        NEW.student_id,
        'top_performer',
        'Top Performer',
        'Scored 90% or higher on an academic assessment exam.'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_on_high_mark_earned ON public.marks;
CREATE TRIGGER trigger_on_high_mark_earned
  AFTER INSERT OR UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.on_high_mark_earned();


-- ==========================================
-- EXTRA RLS POLICIES
-- ==========================================

DROP POLICY IF EXISTS "Students update own fees status" ON public.fees;
CREATE POLICY "Students update own fees status" ON public.fees FOR UPDATE USING (student_id = auth.uid());



