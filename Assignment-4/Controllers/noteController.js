const Note = require('../models/Note');
const appEvents = require('../events/appEvents');

// @desc    Create a note for the authenticated user
// @route   POST /api/notes
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = await Note.create({
      title,
      content,
      owner: req.user.id,
    });

    appEvents.emit('note:created', {
      username: req.user.username,
      title: note.title,
    });

    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all notes belonging to the logged-in user
// @route   GET /api/notes
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.id }).sort({ createdAt: 1 });
    return res.status(200).json(notes);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a note owned by the logged-in user
// @route   PUT /api/notes/:id
const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found or unauthorized' });
    }

    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a note owned by the logged-in user
// @route   DELETE /api/notes/:id
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found or unauthorized' });
    }

    return res.status(200).json({ message: 'Note deleted', id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Admin-only endpoint demonstrating RBAC
// @route   GET /api/notes/admin/all
const getAllNotesAdmin = async (req, res) => {
  try {
    const notes = await Note.find().populate('owner', 'username email role');
    return res.status(200).json({ count: notes.length, notes });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
  getAllNotesAdmin,
};
