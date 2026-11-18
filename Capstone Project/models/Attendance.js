const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema(
  {
    previousStatus: { type: String, enum: ['Present', 'Absent', 'Late'] },
    newStatus: { type: String, enum: ['Present', 'Absent', 'Late'] },
    reason: { type: String, required: true },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    modifiedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    section: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true,
    },
    auditTrail: [auditEntrySchema],
  },
  { timestamps: true }
);

// Index 3 (Compound Unique): Prevents duplicate attendance for same student, course & session date
attendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
