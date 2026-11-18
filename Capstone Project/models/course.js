const mongoose = require('mongoose');

const sectionAssignmentSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: [true, 'Section name is required (e.g., CSE-A)'],
      uppercase: true,
      trim: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned faculty is required'],
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
      default: 4,
    },
    sections: [sectionAssignmentSchema],
  },
  { timestamps: true }
);

// Index 2: Fast course filtering by department and assigned faculty
courseSchema.index({ department: 1, 'sections.faculty': 1 });

module.exports = mongoose.model('Course', courseSchema);
