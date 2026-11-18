const express = require('express');
const router = express.Router();
const {
  getAttendanceSummaryReport,
  getEnrolmentSummaryReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/attendance-summary', getAttendanceSummaryReport);
router.get('/enrolment-summary', authorize('admin', 'faculty'), getEnrolmentSummaryReport);

module.exports = router;
