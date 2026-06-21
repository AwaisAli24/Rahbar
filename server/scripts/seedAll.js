import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Models
import User from '../models/User.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assessment from '../models/Assessment.js';
import Notice from '../models/Notice.js';
import Timetable from '../models/Timetable.js';
import { connectDB } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAll = async () => {
  try {
    await connectDB();
    console.log('\x1b[36m⚙ Connected to database. Purging old records...\x1b[0m');

    // Clean databases
    await User.deleteMany({});
    await Course.deleteMany({});
    await Attendance.deleteMany({});
    await Assessment.deleteMany({});
    await Notice.deleteMany({});
    await Timetable.deleteMany({});

    console.log('\x1b[32m✔ Databases cleared successfully!\x1b[0m');

    // ── 1. SEED USERS ───────────────────────────────────────────────────────────
    console.log('\x1b[33mSeeding Users...\x1b[0m');

    // Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@rahbar.edu',
      password: 'adminpassword123',
      role: 'admin',
      campusID: 'ADMIN-001',
      department: 'Administration',
    });

    // Faculty
    const faculty1 = await User.create({
      name: 'Dr. Sarah Khan',
      email: 'sarah@rahbar.edu',
      password: 'password123',
      role: 'faculty',
      campusID: 'FAC-CS-001',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      specialization: 'Operating Systems & Distributed Computing',
    });

    const faculty2 = await User.create({
      name: 'Prof. Kamran Raza',
      email: 'kamran@rahbar.edu',
      password: 'password123',
      role: 'faculty',
      campusID: 'FAC-CS-002',
      department: 'Computer Science',
      designation: 'Professor',
      specialization: 'Database Systems & Big Data Systems',
    });

    // Students
    const studentsData = [
      {
        name: 'Sher Ali',
        email: 'sher.ali@university.edu',
        password: 'password123',
        role: 'student',
        campusID: '22-CS-48',
        department: 'Computer Science',
        fatherName: 'Muhammad Ali',
        dob: new Date('2002-04-15'),
        gender: 'male',
        phone: '+923001234567',
        address: 'Sector F-8, Islamabad',
        session: 'FA22',
        program: 'BCS',
        semester: 6,
        section: 'A',
      },
      {
        name: 'Ayesha Bibi',
        email: 'ayesha@rahbar.edu',
        password: 'password123',
        role: 'student',
        campusID: '22-CS-12',
        department: 'Computer Science',
        fatherName: 'Bibi Shah',
        dob: new Date('2003-09-22'),
        gender: 'female',
        phone: '+923007654321',
        address: 'Gulshan Town, Karachi',
        session: 'FA22',
        program: 'BCS',
        semester: 6,
        section: 'A',
      },
      {
        name: 'Bilal Ahmed',
        email: 'bilal@rahbar.edu',
        password: 'password123',
        role: 'student',
        campusID: '22-CS-05',
        department: 'Computer Science',
        fatherName: 'Ahmed Ali',
        dob: new Date('2002-12-10'),
        gender: 'male',
        phone: '+923001122334',
        address: 'Johar Town, Lahore',
        session: 'FA22',
        program: 'BCS',
        semester: 6,
        section: 'A',
      },
      {
        name: 'Zain Malik',
        email: 'zain@rahbar.edu',
        password: 'password123',
        role: 'student',
        campusID: '22-CS-99',
        department: 'Computer Science',
        fatherName: 'Malik Khan',
        dob: new Date('2001-07-30'),
        gender: 'male',
        phone: '+923009988776',
        address: 'Westridge, Rawalpindi',
        session: 'FA22',
        program: 'BCS',
        semester: 6,
        section: 'A',
      },
      {
        name: 'Hira Fatima',
        email: 'hira@rahbar.edu',
        password: 'password123',
        role: 'student',
        campusID: '22-CS-34',
        department: 'Computer Science',
        fatherName: 'Tariq Javed',
        dob: new Date('2003-01-05'),
        gender: 'female',
        phone: '+923004455667',
        address: 'Defense Phase 6, Lahore',
        session: 'FA22',
        program: 'BCS',
        semester: 6,
        section: 'A',
      }
    ];

    const students = [];
    for (const data of studentsData) {
      const student = await User.create(data);
      students.push(student);
    }

    console.log(`\x1b[32m✔ Seeded: 1 Admin, 2 Faculty, ${students.length} Students!\x1b[0m`);

    // ── 2. SEED COURSES ─────────────────────────────────────────────────────────
    console.log('\x1b[33mSeeding Courses...\x1b[0m');

    const course1 = await Course.create({
      title: 'Operating Systems',
      code: 'CS-301',
      creditHours: 3,
      department: 'Computer Science',
      description: 'Core concepts of process scheduling, threads, memory management, and file systems.',
      faculty: faculty1._id,
      students: students.map(s => s._id),
    });

    const course2 = await Course.create({
      title: 'Database Systems',
      code: 'CS-302',
      creditHours: 4,
      department: 'Computer Science',
      description: 'Fundamentals of relational modeling, SQL syntax, normalizations, and database tuning.',
      faculty: faculty2._id,
      students: students.map(s => s._id),
    });

    console.log(`\x1b[32m✔ Seeded: Course CS-301 (OS) and CS-302 (DBMS)!\x1b[0m`);

    // ── 3. SEED ATTENDANCE RECORDS ──────────────────────────────────────────────
    console.log('\x1b[33mSeeding Attendance...\x1b[0m');

    // Create 10 days of attendance for both courses
    const dates = [
      '2026-06-01', '2026-06-03', '2026-06-05', '2026-06-08', '2026-06-10',
      '2026-06-12', '2026-06-15', '2026-06-17', '2026-06-19', '2026-06-20'
    ];

    // Student index reference mapping
    // students[0] = Sher Ali (Absent often to trigger ML critical risk status)
    // students[1] = Ayesha Bibi (Absent often to trigger ML high risk status)
    // students[2, 3, 4] = Safe students (Mostly Present)

    for (const d of dates) {
      // OS class daily logs
      const recordsOS = students.map((s, idx) => {
        let status = 'Present';
        if (idx === 0) { // Sher Ali
          status = ['Absent', 'Late', 'Present', 'Absent', 'Absent'][d.charCodeAt(d.length - 1) % 5] || 'Present';
        } else if (idx === 1) { // Ayesha
          status = ['Present', 'Absent', 'Present', 'Absent', 'Present'][d.charCodeAt(d.length - 1) % 5] || 'Present';
        }
        return { student: s._id, status, remarks: status === 'Absent' ? 'Unexcused absence' : '' };
      });

      await Attendance.create({
        course: course1._id,
        date: d,
        recordedBy: faculty1._id,
        records: recordsOS
      });

      // DBMS class daily logs
      const recordsDB = students.map((s, idx) => {
        let status = 'Present';
        if (idx === 0) { // Sher Ali
          status = ['Present', 'Absent', 'Absent', 'Present', 'Absent'][d.charCodeAt(d.length - 1) % 5] || 'Present';
        } else if (idx === 1) { // Ayesha
          status = ['Absent', 'Present', 'Absent', 'Present', 'Present'][d.charCodeAt(d.length - 1) % 5] || 'Present';
        }
        return { student: s._id, status, remarks: status === 'Absent' ? 'No submission' : '' };
      });

      await Attendance.create({
        course: course2._id,
        date: d,
        recordedBy: faculty2._id,
        records: recordsDB
      });
    }

    console.log(`\x1b[32m✔ Seeded: Attendance records for both courses!\x1b[0m`);

    // ── 4. SEED ASSESSMENTS & MARKS ─────────────────────────────────────────────
    console.log('\x1b[33mSeeding Assessment Marks...\x1b[0m');

    // OS Assessments
    const osQuiz = await Assessment.create({
      course: course1._id,
      title: 'Quiz 1',
      type: 'Quiz',
      totalMarks: 10,
      weightage: 10,
      date: '2026-06-05',
      records: [
        { student: students[0]._id, marksObtained: 5, remarks: 'Needs revision' },
        { student: students[1]._id, marksObtained: 4, remarks: 'Low score' },
        { student: students[2]._id, marksObtained: 9 },
        { student: students[3]._id, marksObtained: 8 },
        { student: students[4]._id, marksObtained: 9.5 }
      ]
    });

    const osAssignment = await Assessment.create({
      course: course1._id,
      title: 'Assignment 1',
      type: 'Assignment',
      totalMarks: 10,
      weightage: 10,
      date: '2026-06-12',
      records: [
        { student: students[0]._id, marksObtained: 5 },
        { student: students[1]._id, marksObtained: 6 },
        { student: students[2]._id, marksObtained: 8 },
        { student: students[3]._id, marksObtained: 9 },
        { student: students[4]._id, marksObtained: 9 }
      ]
    });

    const osMidterm = await Assessment.create({
      course: course1._id,
      title: 'Midterm Exam',
      type: 'Midterm',
      totalMarks: 100,
      weightage: 30,
      date: '2026-06-15',
      records: [
        { student: students[0]._id, marksObtained: 42, remarks: 'Critical performance' },
        { student: students[1]._id, marksObtained: 35, remarks: 'Failed midterm' },
        { student: students[2]._id, marksObtained: 78 },
        { student: students[3]._id, marksObtained: 85 },
        { student: students[4]._id, marksObtained: 92 }
      ]
    });

    // DBMS Assessments
    const dbQuiz = await Assessment.create({
      course: course2._id,
      title: 'Quiz 1',
      type: 'Quiz',
      totalMarks: 10,
      weightage: 10,
      date: '2026-06-08',
      records: [
        { student: students[0]._id, marksObtained: 5 },
        { student: students[1]._id, marksObtained: 5 },
        { student: students[2]._id, marksObtained: 8.5 },
        { student: students[3]._id, marksObtained: 9 },
        { student: students[4]._id, marksObtained: 9 }
      ]
    });

    const dbMidterm = await Assessment.create({
      course: course2._id,
      title: 'Midterm Exam',
      type: 'Midterm',
      totalMarks: 100,
      weightage: 30,
      date: '2026-06-15',
      records: [
        { student: students[0]._id, marksObtained: 45, remarks: 'Low score' },
        { student: students[1]._id, marksObtained: 40, remarks: 'Needs assistance' },
        { student: students[2]._id, marksObtained: 81 },
        { student: students[3]._id, marksObtained: 88 },
        { student: students[4]._id, marksObtained: 94 }
      ]
    });

    console.log(`\x1b[32m✔ Seeded: Graded Quizzes, Assignments and Midterms!\x1b[0m`);

    // ── 5. SEED NOTICES ──────────────────────────────────────────────────────────
    console.log('\x1b[33mSeeding Notice Announcements...\x1b[0m');

    await Notice.create({
      title: 'Midterm Review & Advisor Advisory Program',
      content: 'All students with scores lower than 50% in midterm examinations are directed to meet their designated academic advisors immediately for advisory consultations.',
      author: admin._id,
      audience: 'All',
      urgency: 'Urgent'
    });

    await Notice.create({
      title: 'Academic Roster Verification FA22',
      content: 'Faculty members are requested to audit enrollment rosters for BCS Semester 6th students prior to final mark submissions.',
      author: admin._id,
      audience: 'Faculty',
      urgency: 'High'
    });

    await Notice.create({
      title: 'Annual Hackathon Registration 2026',
      content: 'Registration is now open for the campus Hackathon. Submit your team proposals by the end of this week at the main administration desk.',
      author: admin._id,
      audience: 'Students',
      urgency: 'Normal'
    });

    console.log(`\x1b[32m✔ Seeded: Notices board announcements!\x1b[0m`);

    // ── 6. SEED TIMETABLE SLOTS ──────────────────────────────────────────────────
    console.log('\x1b[33mSeeding Timetable Slots...\x1b[0m');

    await Timetable.create({
      course: course1._id,
      day: 'Monday',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      room: 'Room 302 (Block B)',
      department: 'Computer Science'
    });

    await Timetable.create({
      course: course2._id,
      day: 'Monday',
      startTime: '11:00 AM',
      endTime: '01:00 PM',
      room: 'Lab 5 (Block C)',
      department: 'Computer Science'
    });

    await Timetable.create({
      course: course1._id,
      day: 'Wednesday',
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      room: 'Room 302 (Block B)',
      department: 'Computer Science'
    });

    await Timetable.create({
      course: course2._id,
      day: 'Wednesday',
      startTime: '11:00 AM',
      endTime: '12:30 PM',
      room: 'Room 401 (Block B)',
      department: 'Computer Science'
    });

    console.log(`\x1b[32m✔ Seeded: Weekly timetable slots!\x1b[0m`);

    console.log('\n\x1b[32m🌟 SUCCESS: Database seeded completely with academic demo data! 🌟\x1b[0m');
    console.log(`Admin email: admin@rahbar.edu | adminpassword123`);
    console.log(`Faculty email: sarah@rahbar.edu | password123`);
    console.log(`Student email: sher.ali@university.edu | password123`);

    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m✖ Error during seeding execution:\x1b[0m', err);
    process.exit(1);
  }
};

seedAll();
