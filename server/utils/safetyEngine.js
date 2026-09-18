/**
 * SafeRoute Intelligence Engine (AI & Algorithmic Triage)
 * Admin Analytics & Platform Intelligence Module
 */

// 1. Keyword-based AI Threat Classifier for Incident Descriptions
const analyzeIncidentThreat = (description = '', category = '') => {
  const descLower = description.toLowerCase();
  const catLower = category.toLowerCase();

  // High severity trigger words
  const highKeywords = [
    'weapon', 'knife', 'gun', 'attack', 'assault', 'snatch', 'robbery',
    'harass', 'stalking', 'molest', 'fight', 'severe', 'danger', 'bleeding',
    'accident', 'injured', 'threat'
  ];

  // Medium severity trigger words
  const mediumKeywords = [
    'dark', 'lights', 'lighting', 'broken', 'suspicious', 'crowd', 'pothole',
    'isolated', 'deserted', 'shouting', 'argument', 'speeding'
  ];

  let score = 0;
  let matches = [];

  highKeywords.forEach((kw) => {
    if (descLower.includes(kw)) {
      score += 3;
      matches.push(kw);
    }
  });

  mediumKeywords.forEach((kw) => {
    if (descLower.includes(kw)) {
      score += 1.5;
      matches.push(kw);
    }
  });

  if (catLower.includes('theft') || catLower.includes('harassment') || catLower.includes('accident')) {
    score += 2;
  }

  let aiSeverity = 'low';
  let urgency = 'Standard';

  if (score >= 4) {
    aiSeverity = 'high';
    urgency = 'Critical Immediate';
  } else if (score >= 2) {
    aiSeverity = 'medium';
    urgency = 'Elevated';
  }

  const confidence = Math.min(0.98, Math.max(0.72, 0.7 + score * 0.05));

  return {
    aiSeverity,
    urgency,
    confidence: Number((confidence * 100).toFixed(0)),
    detectedKeywords: matches.slice(0, 4)
  };
};

// 2. Haversine Distance Formula (km)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// 3. Multi-Factor Route & Area Safety Score Calculator
const computeSafetyScore = (lat, lon, incidents = [], emergencyServices = []) => {
  let score = 100;

  // Incident penalty within 2km
  incidents.forEach((inc) => {
    const dist = calculateDistance(lat, lon, Number(inc.latitude), Number(inc.longitude));
    if (dist <= 2.0) {
      const severityMultiplier = inc.severity === 'high' ? 15 : inc.severity === 'medium' ? 8 : 4;
      const proximityFactor = Math.max(0.2, (2.0 - dist) / 2.0); // closer = higher penalty
      score -= severityMultiplier * proximityFactor;
    }
  });

  // Emergency services bonus within 3km (Police / Hospitals)
  emergencyServices.forEach((svc) => {
    const dist = calculateDistance(lat, lon, Number(svc.latitude), Number(svc.longitude));
    if (dist <= 3.0 && svc.availability === 'available') {
      const bonus = svc.type === 'police' ? 6 : svc.type === 'hospital' ? 4 : 3;
      const proximityFactor = Math.max(0.1, (3.0 - dist) / 3.0);
      score += bonus * proximityFactor;
    }
  });

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  let riskTier = 'Low Risk (Safe)';
  if (finalScore < 50) riskTier = 'High Risk Zone';
  else if (finalScore < 75) riskTier = 'Moderate Caution';

  return {
    score: finalScore,
    riskTier
  };
};

// 4. Multi-Waypoint Route Safety Score Evaluator
const evaluateRouteSafety = (coordinates = [], incidents = [], emergencyServices = [], riskZones = []) => {
  if (!coordinates || coordinates.length === 0) {
    return {
      safetyScore: 100,
      riskTier: 'Low Risk (Safe)',
      riskFactors: {
        incidentCountAlongRoute: 0,
        riskZonesIntersected: [],
        averageWaypointScore: 100
      }
    };
  }

  // Sample coordinates to maintain high performance (< 25ms)
  const step = Math.max(1, Math.floor(coordinates.length / 40));
  const sampled = [];
  for (let i = 0; i < coordinates.length; i += step) {
    sampled.push(coordinates[i]);
  }
  // Include last coordinate if not already present
  if (sampled.length > 0 && sampled[sampled.length - 1] !== coordinates[coordinates.length - 1]) {
    sampled.push(coordinates[coordinates.length - 1]);
  }

  let totalScore = 0;
  const intersectedZoneIds = new Set();
  const intersectedZoneNames = [];
  const nearbyIncidentIds = new Set();

  sampled.forEach((pt) => {
    // GeoJSON coordinates are [longitude, latitude]
    const lon = Number(pt[0]);
    const lat = Number(pt[1]);

    const { score } = computeSafetyScore(lat, lon, incidents, emergencyServices);
    totalScore += score;

    // Check intersecting risk zones
    riskZones.forEach((zone) => {
      const distKm = calculateDistance(lat, lon, Number(zone.latitude), Number(zone.longitude));
      const radiusKm = Number(zone.radius) / 1000;
      if (distKm <= radiusKm && !intersectedZoneIds.has(zone.id)) {
        intersectedZoneIds.add(zone.id);
        intersectedZoneNames.push({
          id: zone.id,
          name: zone.area_name,
          riskLevel: zone.risk_level,
          safetyScore: zone.safety_score
        });
      }
    });

    // Check unique incidents within 500m of path
    incidents.forEach((inc) => {
      const distKm = calculateDistance(lat, lon, Number(inc.latitude), Number(inc.longitude));
      if (distKm <= 0.5 && !nearbyIncidentIds.has(inc.id)) {
        nearbyIncidentIds.add(inc.id);
      }
    });
  });

  const avgScore = Math.round(totalScore / (sampled.length || 1));

  // Risk zone intersection penalties
  let zonePenalty = 0;
  intersectedZoneNames.forEach((z) => {
    if (z.riskLevel === 'high') zonePenalty += 18;
    else if (z.riskLevel === 'medium') zonePenalty += 10;
    else zonePenalty += 4;
  });

  const finalScore = Math.max(10, Math.min(100, Math.round(avgScore - zonePenalty)));

  let riskTier = 'Low Risk (Safe)';
  if (finalScore < 50) riskTier = 'High Risk Zone';
  else if (finalScore < 75) riskTier = 'Moderate Caution';

  return {
    safetyScore: finalScore,
    riskTier,
    riskFactors: {
      averageWaypointScore: avgScore,
      incidentCountAlongRoute: nearbyIncidentIds.size,
      riskZonesIntersected: intersectedZoneNames,
      sampledWaypointsCount: sampled.length
    }
  };
};

module.exports = {
  analyzeIncidentThreat,
  calculateDistance,
  computeSafetyScore,
  evaluateRouteSafety
};
