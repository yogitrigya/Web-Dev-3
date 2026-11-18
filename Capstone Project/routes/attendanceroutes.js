const express = require('express');
const router = express.Router();
const {
  markAttendance,
  updateAttendance,
  getAttendance,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .post(authorize('faculty'), markAttendance)
  .get(getAttendance);

router.patch('/:id', authorize('faculty'), updateAttendance);

module.exports = router;
