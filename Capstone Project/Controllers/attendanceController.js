const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { campusEvents } = require('../events/campusEvents');

// Normalize date to UTC midnight so duplicate checks on the same day work reliably
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// @desc    Mark bulk attendance for a course, section, and date (Faculty)
// @route   POST /api/attendance
const markAttendance = async (req, res, next) => {
  try {
    const { courseId, section, date, records } = req.body;
    // records: [{ studentId, status: 'Present' | 'Absent' | 'Late' }]

    const normalizedDate = normalizeDate(date);
    if (!normalizedDate || !Array.isArray(records) || records.length === 0) {
      res.status(400);
      throw new Error('Valid courseId, section, date, and non-empty records array are required');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    const targetSection = course.sections.find(
      (sec) => sec.sectionName === section.toUpperCase().trim()
    );
    if (!targetSection) {
      res.status(404);
      throw new Error(`Section '${section}' not found in ${course.code}`);
    }

    // Business Rule: Faculty must only mark attendance for sections assigned to them
    if (targetSection.faculty.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Forbidden: You are not assigned to teach this course/section');
    }

    const enrolledIds = new Set(
      targetSection.enrolledStudents.map((id) => id.toString())
    );

    const docsToInsert = [];
    for (const rec of records) {
      if (!enrolledIds.has(rec.studentId)) {
        res.status(400);
        throw new Error(`Student ${rec.studentId} is not enrolled in ${course.code} (${section})`);
      }

      docsToInsert.push({
        course: course._id,
        section: targetSection.sectionName,
        student: rec.studentId,
        markedBy: req.user._id,
        date: normalizedDate,
        status: rec.status,
      });
    }

    const createdRecords = await Attendance.insertMany(docsToInsert);

    // Emit real-time alert for each student
    createdRecords.forEach((record) => {
      campusEvents.emit('attendance:updated', {
        courseCode: course.code,
        section: record.section,
        studentId: record.student.toString(),
        status: record.status,
        date: normalizedDate,
      });
    });

    res.status(201).json({
      success: true,
      message: `Attendance recorded for ${createdRecords.length} students`,
      records: createdRecords,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Correct an existing attendance entry with mandatory audit reason (Faculty)
// @route   PATCH /api/attendance/:id
const updateAttendance = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status || !reason) {
      res.status(400);
      throw new Error('Both new status and audit reason are required');
    }

    const attendance = await Attendance.findById(req.params.id).populate('course');
    if (!attendance) {
      res.status(404);
      throw new Error('Attendance record not found');
    }

    const targetSection = attendance.course.sections.find(
      (sec) => sec.sectionName === attendance.section
    );
    if (targetSection.faculty.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Forbidden: Only the assigned faculty can modify this attendance record');
    }

    attendance.auditTrail.push({
      previousStatus: attendance.status,
      newStatus: status,
      reason,
      modifiedBy: req.user._id,
    });

    attendance.status = status;
    await attendance.save();

    campusEvents.emit('attendance:updated', {
      courseCode: attendance.course.code,
      section: attendance.section,
      studentId: attendance.student.toString(),
      status: attendance.status,
      date: attendance.date,
    });

    res.status(200).json({
      success: true,
      message: 'Attendance updated and logged to audit trail',
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View attendance records (Students see ONLY their own; Faculty/Admin see filtered)
// @route   GET /api/attendance
const getAttendance = async (req, res, next) => {
  try {
    const { courseId, section, studentId, date } = req.query;
    const filter = {};

    if (courseId) filter.course = courseId;
    if (section) filter.section = section.toUpperCase();
    if (date) {
      const normalized = normalizeDate(date);
      if (normalized) filter.date = normalized;
    }

    // Business Rule: Students cannot view another student's private attendance
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (studentId) {
      filter.student = studentId;
    }

    const records = await Attendance.find(filter)
      .populate('course', 'code title')
      .populate('student', 'name rollNumber')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  updateAttendance,
  getAttendance,
};
