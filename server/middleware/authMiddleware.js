const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware for Citizen Endpoints
 * Verifies Bearer JWT using process.env.JWT_SECRET
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access token required. Missing Bearer token.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Malformed authorization token.',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('CRITICAL: JWT_SECRET environment variable is not configured.');
      return res.status(500).json({
        message: 'Server configuration error.',
      });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
};

module.exports = authMiddleware;
