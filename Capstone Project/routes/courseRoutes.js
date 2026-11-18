const express = require('express');
const router = express.Router();
const {
  createCourse,
  getCourses,
  getCourseById,
  assignFacultyToSection,
  enrollStudent,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .post(authorize('admin'), createCourse)
  .get(getCourses);

router
  .route('/:id')
  .get(getCourseById)
  .delete(authorize('admin'), deleteCourse);

router.post('/:id/assign-faculty', authorize('admin'), assignFacultyToSection);
router.post('/:id/enroll', authorize('admin'), enrollStudent);

module.exports = router;
