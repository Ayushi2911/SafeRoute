const jwt = require('jsonwebtoken');

/**
 * Admin Authentication & Authorization Middleware
 * Verifies JWT and confirms user has role === 'admin'.
 * Integrates directly with Shaily's authentication system tokens.
 */
const authAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing Bearer token in Authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Malformed authorization token.'
      });
    }

    const secret = process.env.JWT_SECRET || 'saferoute_jwt_secret_key_2026';
    const decoded = jwt.verify(token, secret);

    // Verify admin role authorization
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin role authorization required to access this resource.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session token has expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token.'
    });
  }
};

module.exports = authAdmin;
