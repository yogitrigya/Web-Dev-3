const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

// @desc    Aggregation 1: Subject-wise attendance percentage & low-attendance alert list
// @route   GET /api/reports/attendance-summary
const getAttendanceSummaryReport = async (req, res, next) => {
  try {
    const threshold = Number(
      req.query.threshold || process.env.DEFAULT_ATTENDANCE_THRESHOLD || 75
    );
    const { courseId, belowThresholdOnly } = req.query;

    const matchStage = {};
    if (courseId) {
      matchStage.course = new mongoose.Types.ObjectId(courseId);
    }
    // Students can only run summary reports for themselves
    if (req.user.role === 'student') {
      matchStage.student = req.user._id;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: { student: '$student', course: '$course' },
          totalClasses: { $sum: 1 },
          attendedClasses: {
            $sum: {
              $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          studentId: '$_id.student',
          courseId: '$_id.course',
          totalClasses: 1,
          attendedClasses: 1,
          attendancePercentage: {
            $round: [
              { $multiply: [{ $divide: ['$attendedClasses', '$totalClasses'] }, 100] },
              2,
            ],
          },
        },
      },
      {
        $addFields: {
          belowThreshold: { $lt: ['$attendancePercentage', threshold] },
        },
      },
    ];

    if (belowThresholdOnly === 'true') {
      pipeline.push({ $match: { belowThreshold: true } });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      {
        $project: {
          studentName: '$student.name',
          rollNumber: '$student.rollNumber',
          section: '$student.section',
          courseCode: '$course.code',
          courseTitle: '$course.title',
          totalClasses: 1,
          attendedClasses: 1,
          attendancePercentage: 1,
          belowThreshold: 1,
        },
      },
      { $sort: { attendancePercentage: 1 } }
    );

    const report = await Attendance.aggregate(pipeline);

    res.status(200).json({
      success: true,
      thresholdApplied: threshold,
      count: report.length,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Aggregation 2: Course enrolment counts and section-wise breakdown
// @route   GET /api/reports/enrolment-summary
const getEnrolmentSummaryReport = async (req, res, next) => {
  try {
    const summary = await Course.aggregate([
      { $unwind: { path: '$sections', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'sections.faculty',
          foreignField: '_id',
          as: 'facultyInfo',
        },
      },
      { $unwind: { path: '$facultyInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            courseId: '$_id',
            code: '$code',
            title: '$title',
            department: '$department',
          },
          totalEnrolledInCourse: {
            $sum: { $size: { $ifNull: ['$sections.enrolledStudents', []] } },
          },
          sections: {
            $push: {
              sectionName: '$sections.sectionName',
              facultyName: '$facultyInfo.name',
              studentCount: { $size: { $ifNull: ['$sections.enrolledStudents', []] } },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          courseId: '$_id.courseId',
          code: '$_id.code',
          title: '$_id.title',
          department: '$_id.department',
          totalEnrolledInCourse: 1,
          sections: 1,
        },
      },
      { $sort: { code: 1 } },
    ]);

    res.status(200).json({
      success: true,
      totalCourses: summary.length,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceSummaryReport,
  getEnrolmentSummaryReport,
};
