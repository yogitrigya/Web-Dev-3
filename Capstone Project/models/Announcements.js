const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
    },
    scope: {
      type: String,
      enum: ['university', 'section', 'course'],
      required: true,
    },
    targetSection: {
      type: String,
      uppercase: true,
      trim: true,
    },
    targetCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

announcementSchema.index({ scope: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
