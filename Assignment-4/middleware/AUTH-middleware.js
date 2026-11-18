const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  let token = null;

  // 1. Check Authorization header ("Bearer <token>")
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Fallback: Check Cookie header ("token=<token>")
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, item) => {
      const [key, val] = item.trim().split('=');
      acc[key] = val;
      return acc;
    }, {});
    if (cookies.token) {
      token = cookies.token;
    }
  }

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, username }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-Based Access Control (RBAC) middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: requires role [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
