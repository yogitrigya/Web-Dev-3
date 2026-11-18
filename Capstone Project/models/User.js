const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'student'],
      default: 'student',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    // Student-specific fields
    rollNumber: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      uppercase: true,
    },
    // Faculty-specific fields
    employeeId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    // Refresh token stored for rotation & logout invalidation
    refreshToken: {
      type: String,
      select: false,
    },
  },
  { timestamps: true }
);

// Index 1: Fast lookups by role, department, and section
userSchema.index({ role: 1, department: 1, section: 1 });

module.exports = mongoose.model('User', userSchema);
