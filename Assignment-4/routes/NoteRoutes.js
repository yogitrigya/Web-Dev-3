const express = require('express');
const router = express.Router();
const {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  getAllNotesAdmin,
} = require('../controllers/noteController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// All note routes require a valid JWT
router.use(verifyToken);

// RBAC protected admin route
router.get('/admin/all', authorizeRoles('admin'), getAllNotesAdmin);

// Standard user CRUD routes
router.route('/').post(createNote).get(getNotes);
router.route('/:id').put(updateNote).delete(deleteNote);

module.exports = router;
