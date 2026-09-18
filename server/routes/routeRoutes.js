const express = require('express');
const router = express.Router();
const {
  getRiskZones,
  getNearbyServices,
  getVerifiedIncidents,
  getSafetyScore,
  calculateRoute,
} = require('../controllers/routeController');

// 1. Public Risk Zones Endpoint
router.get('/risk-zones', getRiskZones);

// 2. Nearby Emergency Services Endpoint (Query params: lat, lon, radius, type)
router.get('/services/nearby', getNearbyServices);

// 3. Verified Incidents Feed for Public Map & Routing
router.get('/incidents', getVerifiedIncidents);

// 4. Point / Location Safety Score Endpoint (Query params: lat, lon)
router.get('/safety-score', getSafetyScore);

// 5. OSRM Safe Route Calculation Endpoint (Body: { origin, destination })
router.post('/calculate', calculateRoute);

module.exports = router;
