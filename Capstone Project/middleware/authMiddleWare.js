const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized: No access token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('Not authorized: User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      return next(new Error('Access token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      res.status(401);
      return next(new Error('Invalid access token'));
    }
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`Forbidden: Role '${req.user?.role}' is not permitted to access this resource`)
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
