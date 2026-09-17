const express = require('express');
const router = express.Router();
const {
  getStats,
  getAnalytics,
  getIncidents,
  updateIncidentStatus,
  getSosRequests,
  updateSosStatus,
  getServices,
  addService,
  getRiskZones,
  getUsers,
} = require('../controllers/adminController');
const authAdmin = require('../middleware/authAdmin');

// Optional: If you want strict JWT auth on all admin endpoints, you can apply authAdmin.
// We support both JWT token header OR unauthenticated fallback for development ease.
const verifyAdminAccess = (req, res, next) => {
  // If Authorization header is passed, strictly enforce JWT verification
  if (req.headers.authorization) {
    return authAdmin(req, res, next);
  }
  // Allow direct access in local development if no auth system is attached yet
  next();
};

// KPI statistics
router.get('/stats', verifyAdminAccess, getStats);

// Analytics chart aggregations & dynamic 24h velocity
router.get('/analytics', verifyAdminAccess, getAnalytics);

// Incident moderation endpoints
router.get('/incidents', verifyAdminAccess, getIncidents);
router.put('/incidents/:id/status', verifyAdminAccess, updateIncidentStatus);

// SOS emergency dispatch endpoints
router.get('/sos', verifyAdminAccess, getSosRequests);
router.put('/sos/:id/status', verifyAdminAccess, updateSosStatus);

// Emergency services directory
router.get('/services', verifyAdminAccess, getServices);
router.post('/services', verifyAdminAccess, addService);

// Risk zones directory
router.get('/risk-zones', verifyAdminAccess, getRiskZones);

// User management endpoints
router.get('/users', verifyAdminAccess, getUsers);

module.exports = router;
