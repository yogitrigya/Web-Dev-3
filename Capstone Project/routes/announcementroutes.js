const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router
  .route('/')
  .post(authorize('admin', 'faculty'), createAnnouncement)
  .get(getAnnouncements);

module.exports = router;
