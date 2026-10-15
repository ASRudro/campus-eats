const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campuseats_university_jwt_super_secret_key_2026';

/**
 * Middleware to verify JWT token from Authorization header
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, email, role, student_id, name
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
}

/**
 * Middleware to restrict access by user role
 * @param  {...string} allowedRoles e.g. 'admin', 'kitchen', 'student'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: [${allowedRoles.join(', ')}]. Your role is: ${req.user.role}`
      });
    }

    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET
};
