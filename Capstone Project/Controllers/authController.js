const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (user) => {
  const payload = {
    id: user._id,
    role: user.role,
    section: user.section || null,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
};

// @desc    Register user (Admin creates faculty/admin; students can self-register or be created by admin)
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, rollNumber, section, employeeId } = req.body;

    if (!name || !email || !password || !department) {
      res.status(400);
      throw new Error('Name, email, password, and department are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      department,
      rollNumber,
      section,
      employeeId,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        section: user.section,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & return Access + Refresh Tokens
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        section: user.section,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Issue new Access Token using valid Refresh Token
// @route   POST /api/auth/refresh
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400);
      throw new Error('Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      res.status(403);
      throw new Error('Invalid or revoked refresh token');
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(403);
    next(new Error('Refresh token invalid or expired'));
  }
};

// @desc    Logout user & invalidate Refresh Token
// @route   POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// @desc    Update permitted profile fields
// @route   PATCH /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const allowedUpdates = {};
    if (req.body.name) allowedUpdates.name = req.body.name;
    if (req.body.password) {
      allowedUpdates.password = await bcrypt.hash(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: List users with filtering & pagination
// @route   GET /api/auth/users
const getAllUsers = async (req, res, next) => {
  try {
    const { role, department, section, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (section) filter.section = section.toUpperCase();

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).skip(skip).limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
  updateMe,
  getAllUsers,
};
