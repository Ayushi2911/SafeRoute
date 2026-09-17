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

// KPI statistics
router.get('/stats', getStats);

// Analytics chart aggregations
router.get('/analytics', getAnalytics);

// Incident moderation endpoints
router.get('/incidents', getIncidents);
router.put('/incidents/:id/status', updateIncidentStatus);

// SOS emergency dispatch endpoints
router.get('/sos', getSosRequests);
router.put('/sos/:id/status', updateSosStatus);

// Emergency services directory (Day 4/5)
router.get('/services', getServices);
router.post('/services', addService);

// Risk zones directory (Day 4/5)
router.get('/risk-zones', getRiskZones);

// User management endpoints
router.get('/users', getUsers);

module.exports = router;
