const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
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

const jwt = require('jsonwebtoken');

// Public Admin Auth helper for development & login verification
router.post('/login', (req, res) => {
  const secret = process.env.JWT_SECRET || 'saferoute_jwt_secret_key_2026';
  const token = jwt.sign(
    { id: 1, email: 'admin@saferoute.internal', role: 'admin', name: 'Lead Dispatcher' },
    secret,
    { expiresIn: '7d' }
  );
  return res.json({ success: true, token, user: { name: 'Lead Dispatcher', role: 'admin' } });
});

router.get('/dev-token', (req, res) => {
  const secret = process.env.JWT_SECRET || 'saferoute_jwt_secret_key_2026';
  const token = jwt.sign(
    { id: 1, email: 'admin@saferoute.internal', role: 'admin', name: 'Lead Dispatcher' },
    secret,
    { expiresIn: '7d' }
  );
  return res.json({ success: true, token });
});

// All Admin & Analytics routes below protected by authAdmin JWT authorization
router.use(authAdmin);

// KPI statistics
router.get('/stats', getStats);

// Analytics chart aggregations & dynamic 24h velocity
router.get('/analytics', getAnalytics);

// Incident moderation endpoints
router.get('/incidents', getIncidents);
router.put('/incidents/:id/status', updateIncidentStatus);

// SOS emergency dispatch endpoints
router.get('/sos', getSosRequests);
router.put('/sos/:id/status', updateSosStatus);

// Emergency services directory
router.get('/services', getServices);
router.post('/services', addService);

// Risk zones directory
router.get('/risk-zones', getRiskZones);

// User management endpoints
router.get('/users', getUsers);

module.exports = router;
