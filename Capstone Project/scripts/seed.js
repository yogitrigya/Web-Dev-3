require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[SEED] Connected to MongoDB. Clearing old data...');

    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Attendance.deleteMany({}),
      Announcement.deleteMany({}),
    ]);

    const hashedPassword = await bcrypt.hash('Password@123', 10);

    const [admin, faculty1, student1, student2] = await User.create([
      {
        name: 'Dr. R. K. Sharma',
        email: 'admin@university.edu',
        password: hashedPassword,
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM-001',
      },
      {
        name: 'Prof. Ananya Verma',
        email: 'ananya.faculty@university.edu',
        password: hashedPassword,
        role: 'faculty',
        department: 'CSE',
        employeeId: 'FAC-104',
      },
      {
        name: 'Aarav Mehta',
        email: 'aarav.student@university.edu',
        password: hashedPassword,
        role: 'student',
        department: 'CSE',
        rollNumber: '23CSE101',
        section: 'CSE-A',
      },
      {
        name: 'Diya Nair',
        email: 'diya.student@university.edu',
        password: hashedPassword,
        role: 'student',
        department: 'CSE',
        rollNumber: '23CSE102',
        section: 'CSE-A',
      },
    ]);

    const course = await Course.create({
      code: 'CS304',
      title: 'Backend Engineering & Distributed Systems',
      department: 'CSE',
      credits: 4,
      sections: [
        {
          sectionName: 'CSE-A',
          faculty: faculty1._id,
          enrolledStudents: [student1._id, student2._id],
        },
      ],
    });

    await Attendance.create([
      {
        course: course._id,
        section: 'CSE-A',
        student: student1._id,
        markedBy: faculty1._id,
        date: new Date('2026-11-10T00:00:00.000Z'),
        status: 'Present',
      },
      {
        course: course._id,
        section: 'CSE-A',
        student: student1._id,
        markedBy: faculty1._id,
        date: new Date('2026-11-11T00:00:00.000Z'),
        status: 'Present',
      },
      {
        course: course._id,
        section: 'CSE-A',
        student: student2._id,
        markedBy: faculty1._id,
        date: new Date('2026-11-10T00:00:00.000Z'),
        status: 'Absent',
      },
      {
        course: course._id,
        section: 'CSE-A',
        student: student2._id,
        markedBy: faculty1._id,
        date: new Date('2026-11-11T00:00:00.000Z'),
        status: 'Present',
      },
    ]);

    await Announcement.create({
      title: 'End-Semester Practical Schedule',
      message: 'Backend Capstone demonstrations begin next Monday at 10:00 AM.',
      scope: 'university',
      createdBy: admin._id,
    });

    console.log('[SEED] Database seeded successfully!');
    console.log('Test Accounts (Password: Password@123):');
    console.log('  Admin   -> admin@university.edu');
    console.log('  Faculty -> ananya.faculty@university.edu');
    console.log('  Student -> aarav.student@university.edu (100% attendance)');
    console.log('  Student -> diya.student@university.edu (50% attendance - triggers low-attendance alert)');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error:', error);
    process.exit(1);
  }
};

seedDatabase();
