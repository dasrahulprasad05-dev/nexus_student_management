export const SEED_CLASSES = [
  { grade_name: 'Class 8', section: 'A', room: 'Room 101' },
  { grade_name: 'Class 8', section: 'B', room: 'Room 102' },
  { grade_name: 'Class 9', section: 'A', room: 'Room 201' },
  { grade_name: 'Class 10', section: 'A', room: 'Room 301' }
];

export const SEED_TEACHERS = [
  {
    full_name: 'Sarah Connor',
    email: 'teacher.sarah@nexus.edu',
    qualification: 'M.Sc. in Physics, B.Ed.',
    experience: '6 Years',
    schedule: [
      { day: 'Monday', time: '09:00 AM - 10:00 AM', subject: 'Physics', class: 'Class 10-A' },
      { day: 'Monday', time: '11:00 AM - 12:00 PM', subject: 'Physics', class: 'Class 9-A' },
      { day: 'Wednesday', time: '10:00 AM - 11:00 AM', subject: 'Physics', class: 'Class 10-A' },
      { day: 'Friday', time: '01:00 PM - 02:00 PM', subject: 'Physics', class: 'Class 8-A' }
    ]
  },
  {
    full_name: 'Alan Turing',
    email: 'teacher.alan@nexus.edu',
    qualification: 'Ph.D. in Computer Science',
    experience: '10 Years',
    schedule: [
      { day: 'Tuesday', time: '09:00 AM - 10:00 AM', subject: 'Mathematics', class: 'Class 10-A' },
      { day: 'Tuesday', time: '01:00 PM - 02:00 PM', subject: 'Mathematics', class: 'Class 8-A' },
      { day: 'Thursday', time: '09:00 AM - 10:00 AM', subject: 'Mathematics', class: 'Class 9-A' },
      { day: 'Thursday', time: '11:00 AM - 12:00 PM', subject: 'Mathematics', class: 'Class 10-A' }
    ]
  },
  {
    full_name: 'Marie Curie',
    email: 'teacher.marie@nexus.edu',
    qualification: 'M.Sc. in Chemistry',
    experience: '8 Years',
    schedule: [
      { day: 'Wednesday', time: '09:00 AM - 10:00 AM', subject: 'Chemistry', class: 'Class 9-A' },
      { day: 'Wednesday', time: '01:00 PM - 02:00 PM', subject: 'Chemistry', class: 'Class 10-A' },
      { day: 'Friday', time: '09:00 AM - 10:00 AM', subject: 'Chemistry', class: 'Class 8-B' }
    ]
  }
];

export const SEED_STUDENTS = [
  {
    full_name: 'John Doe',
    email: 'student.john@nexus.edu',
    roll_number: '12',
    date_of_birth: '2012-05-15',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 3,
    exp: 240,
    gpa: 3.8
  },
  {
    full_name: 'Jane Smith',
    email: 'student.jane@nexus.edu',
    roll_number: '05',
    date_of_birth: '2012-08-20',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 4,
    exp: 420,
    gpa: 3.95
  },
  {
    full_name: 'Harry Potter',
    email: 'student.harry@nexus.edu',
    roll_number: '07',
    date_of_birth: '2012-07-31',
    grade: 'Class 9',
    section: 'A',
    status: 'active',
    level: 2,
    exp: 150,
    gpa: 2.85
  },
  {
    full_name: 'Hermione Granger',
    email: 'student.hermione@nexus.edu',
    roll_number: '01',
    date_of_birth: '2012-09-19',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 5,
    exp: 650,
    gpa: 4.0
  },
  {
    full_name: 'Ron Weasley',
    email: 'student.ron@nexus.edu',
    roll_number: '31',
    date_of_birth: '2012-03-01',
    grade: 'Class 9',
    section: 'A',
    status: 'active',
    level: 2,
    exp: 110,
    gpa: 2.2
  },
  {
    full_name: 'Peter Parker',
    email: 'student.peter@nexus.edu',
    roll_number: '20',
    date_of_birth: '2013-02-14',
    grade: 'Class 8',
    section: 'A',
    status: 'active',
    level: 3,
    exp: 280,
    gpa: 3.65
  },
  {
    full_name: 'Bruce Wayne',
    email: 'student.bruce@nexus.edu',
    roll_number: '01',
    date_of_birth: '2011-10-25',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 4,
    exp: 390,
    gpa: 3.75
  },
  {
    full_name: 'Clark Kent',
    email: 'student.clark@nexus.edu',
    roll_number: '02',
    date_of_birth: '2011-06-18',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 4,
    exp: 410,
    gpa: 3.9
  },
  {
    full_name: 'Diana Prince',
    email: 'student.diana@nexus.edu',
    roll_number: '03',
    date_of_birth: '2011-03-22',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 5,
    exp: 580,
    gpa: 3.98
  },
  {
    full_name: 'Tony Stark',
    email: 'student.tony@nexus.edu',
    roll_number: '09',
    date_of_birth: '2011-05-29',
    grade: 'Class 10',
    section: 'A',
    status: 'active',
    level: 5,
    exp: 610,
    gpa: 4.0
  }
];

export const SEED_NOTICES = [
  {
    title: 'Midterm Examination Schedule Released',
    content: 'The Midterm exams for all classes will start from July 15, 2026. Please check your subject schedules in the Timetable section. Detailed exam timings are posted on the Notice Board.',
    notice_type: 'announcement'
  },
  {
    title: 'Annual Science Exhibition 2026',
    content: 'We are organizing the Annual Science & Robotics Exhibition on June 28, 2026 in the main auditorium. Students can submit their project synopses to Dr. Sarah Connor by June 20.',
    notice_type: 'event'
  },
  {
    title: 'Summer Vacation Declaration',
    content: 'The school will remain closed for summer vacations from June 10, 2026 to July 5, 2026. Online remedial classes for Class 9 and 10 will continue for Mathematics and Physics.',
    notice_type: 'holiday'
  }
];

export const SEED_FEES = [
  { amount: 1500, description: 'Annual Enrollment Fee 2026', status: 'paid' },
  { amount: 200, description: 'Monthly Tuition Fee - June 2026', status: 'pending' },
  { amount: 200, description: 'Monthly Tuition Fee - May 2026', status: 'paid' },
  { amount: 120, description: 'Science Laboratory Fee', status: 'paid' }
];

export const SEED_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'];
