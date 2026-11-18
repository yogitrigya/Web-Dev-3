const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const { campusEvents } = require('../events/campusEvents');

// @desc    Publish announcement (Admin: university/section/course; Faculty: assigned course/section)
// @route   POST /api/announcements
const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, scope, targetSection, targetCourse } = req.body;

    if (req.user.role === 'faculty' && scope === 'university') {
      res.status(403);
      throw new Error('Forbidden: Only administrators can post university-wide announcements');
    }

    if (scope === 'section' && !targetSection) {
      res.status(400);
      throw new Error('targetSection is required when scope is "section"');
    }

    if (scope === 'course') {
      if (!targetCourse) {
        res.status(400);
        throw new Error('targetCourse is required when scope is "course"');
      }
      const course = await Course.findById(targetCourse);
      if (!course) {
        res.status(404);
        throw new Error('Target course not found');
      }
      if (req.user.role === 'faculty') {
        const teachesCourse = course.sections.some(
          (sec) => sec.faculty.toString() === req.user._id.toString()
        );
        if (!teachesCourse) {
          res.status(403);
          throw new Error('Forbidden: You are not assigned to this course');
        }
      }
    }

    const announcement = await Announcement.create({
      title,
      message,
      scope,
      targetSection: targetSection?.toUpperCase(),
      targetCourse,
      createdBy: req.user._id,
    });

    // Trigger EventEmitter -> broadcasts via Socket.IO
    campusEvents.emit('announcement:published', announcement);

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve relevant announcements for logged-in user
// @route   GET /api/announcements
const getAnnouncements = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'student') {
      const enrolledCourses = await Course.find({
        'sections.enrolledStudents': req.user._id,
      }).select('_id');

      const courseIds = enrolledCourses.map((c) => c._id);

      filter = {
        $or: [
          { scope: 'university' },
          { scope: 'section', targetSection: req.user.section },
          { scope: 'course', targetCourse: { $in: courseIds } },
        ],
      };
    }

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'name role')
      .populate('targetCourse', 'code title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAnnouncement, getAnnouncements };
