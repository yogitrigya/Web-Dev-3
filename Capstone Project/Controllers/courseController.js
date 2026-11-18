const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create a new course (Admin)
// @route   POST /api/courses
const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @desc    Get courses (filtered by role, department, pagination)
// @route   GET /api/courses
const getCourses = async (req, res, next) => {
  try {
    const { department, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (department) filter.department = department;

    // Faculty see courses assigned to them; students see courses they are enrolled in
    if (req.user.role === 'faculty') {
      filter['sections.faculty'] = req.user._id;
    } else if (req.user.role === 'student') {
      filter['sections.enrolledStudents'] = req.user._id;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .populate('sections.faculty', 'name email employeeId')
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('sections.faculty', 'name email employeeId')
      .populate('sections.enrolledStudents', 'name email rollNumber section');

    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    res.status(200).json({ success: true, course });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a faculty member to a course section (Admin)
// @route   POST /api/courses/:id/assign-faculty
const assignFacultyToSection = async (req, res, next) => {
  try {
    const { sectionName, facultyId } = req.body;
    const normalizedSection = sectionName?.toUpperCase().trim();

    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      res.status(400);
      throw new Error('Provided facultyId does not belong to a valid faculty member');
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    const existingSection = course.sections.find(
      (sec) => sec.sectionName === normalizedSection
    );

    if (existingSection) {
      existingSection.faculty = faculty._id;
    } else {
      course.sections.push({
        sectionName: normalizedSection,
        faculty: faculty._id,
        enrolledStudents: [],
      });
    }

    await course.save();
    res.status(200).json({
      success: true,
      message: `Faculty ${faculty.name} assigned to ${course.code} (${normalizedSection})`,
      course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Enroll a student in a course section (Admin)
// @route   POST /api/courses/:id/enroll
const enrollStudent = async (req, res, next) => {
  try {
    const { sectionName, studentId } = req.body;
    const normalizedSection = sectionName?.toUpperCase().trim();

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      res.status(400);
      throw new Error('Provided studentId does not belong to a valid student');
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    const targetSection = course.sections.find(
      (sec) => sec.sectionName === normalizedSection
    );
    if (!targetSection) {
      res.status(404);
      throw new Error(`Section '${normalizedSection}' does not exist in this course`);
    }

    // Prevent duplicate enrolment across all sections of the same course
    const alreadyEnrolled = course.sections.some((sec) =>
      sec.enrolledStudents.some((id) => id.toString() === student._id.toString())
    );
    if (alreadyEnrolled) {
      res.status(409);
      throw new Error('Student is already enrolled in this course');
    }

    targetSection.enrolledStudents.push(student._id);
    await course.save();

    res.status(200).json({
      success: true,
      message: `Student ${student.name} enrolled in ${course.code} (${normalizedSection})`,
      course,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete course (Admin)
// @route   DELETE /api/courses/:id
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    res.status(200).json({ success: true, message: 'Course deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  assignFacultyToSection,
  enrollStudent,
  deleteCourse,
};
