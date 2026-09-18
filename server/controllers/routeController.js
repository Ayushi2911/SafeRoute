const db = require('../config/db');
const {
  calculateDistance,
  computeSafetyScore,
  evaluateRouteSafety,
} = require('../utils/safetyEngine');

/**
 * Helper: Validate geographic coordinates
 */
const isValidCoordinate = (lat, lon) => {
  const nLat = Number(lat);
  const nLon = Number(lon);
  return (
    lat !== undefined &&
    lon !== undefined &&
    lat !== '' &&
    lon !== '' &&
    Number.isFinite(nLat) &&
    Number.isFinite(nLon) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLon >= -180 &&
    nLon <= 180
  );
};

// =========================================================================
// 1. GET /api/routes/risk-zones
// Public endpoint for registered risk zones with danger radius & scores
// =========================================================================
const getRiskZones = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, area_name, latitude, longitude, radius, risk_level, safety_score, created_at, updated_at
      FROM risk_zones
      ORDER BY safety_score ASC
    `);

    const formatted = rows.map((zone) => ({
      id: zone.id,
      area_name: zone.area_name,
      latitude: Number(zone.latitude),
      longitude: Number(zone.longitude),
      radius: Number(zone.radius),
      risk_level: zone.risk_level,
      safety_score: Number(zone.safety_score),
      created_at: zone.created_at,
      updated_at: zone.updated_at,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('Database Error [getRiskZones]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve risk zones: ${error.message}`,
    });
  }
};

// =========================================================================
// 2. GET /api/routes/services/nearby
// Returns nearby available emergency services sorted by distance
// Query params: lat, lon, radius (km, optional), type (optional)
// =========================================================================
const getNearbyServices = async (req, res) => {
  try {
    const { lat, lon, radius = 5.0, type } = req.query;

    if (!isValidCoordinate(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
      });
    }

    const radiusLimit = Number(radius);
    if (!Number.isFinite(radiusLimit) || radiusLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Radius must be a positive number (in kilometers).',
      });
    }

    const validTypes = ['police', 'hospital', 'fire_station'];
    if (type && type !== 'all' && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid service type "${type}". Allowed types: police, hospital, fire_station, or all.`,
      });
    }

    let query = `
      SELECT id, name, type, phone, latitude, longitude, address, availability
      FROM emergency_services
      WHERE availability = 'available'
    `;
    const params = [];

    if (type && type !== 'all') {
      query += ' AND type = ?';
      params.push(type);
    }

    const [rows] = await db.query(query, params);
    const userLat = Number(lat);
    const userLon = Number(lon);

    const servicesWithDistance = rows
      .map((svc) => {
        const dist = calculateDistance(
          userLat,
          userLon,
          Number(svc.latitude),
          Number(svc.longitude)
        );
        return {
          id: svc.id,
          name: svc.name,
          type: svc.type,
          phone: svc.phone,
          latitude: Number(svc.latitude),
          longitude: Number(svc.longitude),
          address: svc.address,
          availability: svc.availability,
          distanceKm: Number(dist.toFixed(2)),
        };
      })
      .filter((svc) => svc.distanceKm <= radiusLimit)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return res.json({
      success: true,
      count: servicesWithDistance.length,
      radiusKm: radiusLimit,
      data: servicesWithDistance,
    });
  } catch (error) {
    console.error('Database Error [getNearbyServices]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve nearby emergency services: ${error.message}`,
    });
  }
};

// =========================================================================
// 3. GET /api/routes/incidents
// Returns ONLY verified incidents suitable for public map & hazard routing
// =========================================================================
const getVerifiedIncidents = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, category, severity, description, latitude, longitude, address, created_at
      FROM incidents
      WHERE status = 'verified'
      ORDER BY created_at DESC
    `);

    const formatted = rows.map((inc) => ({
      id: inc.id,
      category: inc.category,
      severity: inc.severity,
      description: inc.description,
      latitude: Number(inc.latitude),
      longitude: Number(inc.longitude),
      address: inc.address,
      created_at: inc.created_at,
    }));

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('Database Error [getVerifiedIncidents]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve verified incidents: ${error.message}`,
    });
  }
};

// =========================================================================
// 4. GET /api/routes/safety-score
// Calculates safety score for a specific geographic coordinate
// Query params: lat, lon
// =========================================================================
const getSafetyScore = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!isValidCoordinate(lat, lon)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude (-90 to 90) and longitude (-180 to 180) are required.',
      });
    }

    const targetLat = Number(lat);
    const targetLon = Number(lon);

    // Parallel DB queries for verified incidents, emergency services & risk zones
    const [incidentsRows, servicesRows, riskZoneRows] = await Promise.all([
      db.query(`SELECT id, category, severity, latitude, longitude FROM incidents WHERE status = 'verified'`),
      db.query(`SELECT id, name, type, phone, latitude, longitude, availability FROM emergency_services WHERE availability = 'available'`),
      db.query(`SELECT id, area_name, latitude, longitude, radius, risk_level, safety_score FROM risk_zones`),
    ]);

    const incidents = incidentsRows[0];
    const services = servicesRows[0];
    const riskZones = riskZoneRows[0];

    // Compute point safety score via Safety Engine
    const scoreResult = computeSafetyScore(targetLat, targetLon, incidents, services);

    // Compute contextual proximity factors
    let nearestPolice = null;
    let nearestHospital = null;
    let nearestFire = null;

    services.forEach((s) => {
      const dist = calculateDistance(targetLat, targetLon, Number(s.latitude), Number(s.longitude));
      const svcInfo = { name: s.name, phone: s.phone, distanceKm: Number(dist.toFixed(2)) };

      if (s.type === 'police' && (!nearestPolice || dist < nearestPolice.distanceKm)) {
        nearestPolice = svcInfo;
      } else if (s.type === 'hospital' && (!nearestHospital || dist < nearestHospital.distanceKm)) {
        nearestHospital = svcInfo;
      } else if (s.type === 'fire_station' && (!nearestFire || dist < nearestFire.distanceKm)) {
        nearestFire = svcInfo;
      }
    });

    // Check intersecting risk zones
    const intersectingZones = [];
    riskZones.forEach((z) => {
      const distKm = calculateDistance(targetLat, targetLon, Number(z.latitude), Number(z.longitude));
      const radiusKm = Number(z.radius) / 1000;
      if (distKm <= radiusKm) {
        intersectingZones.push({
          id: z.id,
          name: z.area_name,
          riskLevel: z.risk_level,
          safetyScore: Number(z.safety_score),
          distanceToCenterKm: Number(distKm.toFixed(2)),
        });
      }
    });

    // Count verified incidents within 1km & 2km
    let incidentsWithin1Km = 0;
    let incidentsWithin2Km = 0;
    incidents.forEach((inc) => {
      const dist = calculateDistance(targetLat, targetLon, Number(inc.latitude), Number(inc.longitude));
      if (dist <= 1.0) incidentsWithin1Km++;
      if (dist <= 2.0) incidentsWithin2Km++;
    });

    return res.json({
      success: true,
      data: {
        latitude: targetLat,
        longitude: targetLon,
        score: scoreResult.score,
        riskTier: scoreResult.riskTier,
        factors: {
          incidentsWithin1Km,
          incidentsWithin2Km,
          nearestPolice,
          nearestHospital,
          nearestFire,
          intersectingRiskZones: intersectingZones,
        },
      },
    });
  } catch (error) {
    console.error('Database Error [getSafetyScore]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to calculate safety score: ${error.message}`,
    });
  }
};

// =========================================================================
// 5. POST /api/routes/calculate
// Calculates routes using OSRM, evaluates route safety scores,
// and determines the "Fastest Route" and "Safest Route"
// =========================================================================
const calculateRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body || {};

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Both origin and destination objects containing lat and lon are required.',
      });
    }

    if (!isValidCoordinate(origin.lat, origin.lon)) {
      return res.status(400).json({
        success: false,
        message: 'Origin must have valid latitude (-90 to 90) and longitude (-180 to 180).',
      });
    }

    if (!isValidCoordinate(destination.lat, destination.lon)) {
      return res.status(400).json({
        success: false,
        message: 'Destination must have valid latitude (-90 to 90) and longitude (-180 to 180).',
      });
    }

    const oLat = Number(origin.lat);
    const oLon = Number(origin.lon);
    const dLat = Number(destination.lat);
    const dLon = Number(destination.lon);

    // Call OSRM public API (format: {lon},{lat};{lon},{lat})
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;

    let osrmData;
    try {
      const response = await fetch(osrmUrl, {
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) {
        throw new Error(`OSRM HTTP status ${response.status}`);
      }

      osrmData = await response.json();
    } catch (fetchError) {
      console.error('OSRM API Error:', fetchError.message);
      return res.status(502).json({
        success: false,
        message: `Routing service temporarily unavailable: ${fetchError.message}`,
      });
    }

    if (!osrmData || osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No driveable route found between the requested coordinates.',
      });
    }

    // Fetch verified incidents, available services, and risk zones from DB
    const [incidentsRows, servicesRows, riskZoneRows] = await Promise.all([
      db.query(`SELECT id, category, severity, latitude, longitude FROM incidents WHERE status = 'verified'`),
      db.query(`SELECT id, name, type, phone, latitude, longitude, availability FROM emergency_services WHERE availability = 'available'`),
      db.query(`SELECT id, area_name, latitude, longitude, radius, risk_level, safety_score FROM risk_zones`),
    ]);

    const incidents = incidentsRows[0];
    const services = servicesRows[0];
    const riskZones = riskZoneRows[0];

    // Evaluate each route returned by OSRM
    const evaluatedRoutes = osrmData.routes.map((route, index) => {
      const coordinates = route.geometry?.coordinates || [];
      const safetyEval = evaluateRouteSafety(coordinates, incidents, services, riskZones);

      const distanceMeters = Math.round(route.distance);
      const durationSeconds = Math.round(route.duration);
      const distanceKm = Number((distanceMeters / 1000).toFixed(2));
      const durationMins = Math.round(durationSeconds / 60);

      const routeName =
        route.legs?.[0]?.summary ||
        (route.legs?.[0]?.steps?.[0]?.name ? `Via ${route.legs[0].steps[0].name}` : `Route ${index + 1}`);

      return {
        routeIndex: index,
        name: routeName,
        distanceMeters,
        distanceKm,
        durationSeconds,
        durationMins,
        geometry: route.geometry,
        safetyScore: safetyEval.safetyScore,
        riskTier: safetyEval.riskTier,
        riskFactors: safetyEval.riskFactors,
      };
    });

    // Determine Fastest Route (min duration)
    let fastestRoute = evaluatedRoutes[0];
    evaluatedRoutes.forEach((r) => {
      if (r.durationSeconds < fastestRoute.durationSeconds) {
        fastestRoute = r;
      }
    });

    // Determine Safest Route (max safetyScore; if tie, faster duration)
    let safestRoute = evaluatedRoutes[0];
    evaluatedRoutes.forEach((r) => {
      if (
        r.safetyScore > safestRoute.safetyScore ||
        (r.safetyScore === safestRoute.safetyScore && r.durationSeconds < safestRoute.durationSeconds)
      ) {
        safestRoute = r;
      }
    });

    const isSingleRoute = evaluatedRoutes.length === 1;

    return res.json({
      success: true,
      totalRoutesFound: evaluatedRoutes.length,
      isSingleRoute,
      origin: { lat: oLat, lon: oLon },
      destination: { lat: dLat, lon: dLon },
      fastestRoute: {
        ...fastestRoute,
        isSafestAsWell: fastestRoute.routeIndex === safestRoute.routeIndex,
      },
      safestRoute: {
        ...safestRoute,
        isFastestAsWell: fastestRoute.routeIndex === safestRoute.routeIndex,
      },
      routes: evaluatedRoutes,
    });
  } catch (error) {
    console.error('Route Calculation Error [calculateRoute]:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to calculate route: ${error.message}`,
    });
  }
};

module.exports = {
  getRiskZones,
  getNearbyServices,
  getVerifiedIncidents,
  getSafetyScore,
  calculateRoute,
};
