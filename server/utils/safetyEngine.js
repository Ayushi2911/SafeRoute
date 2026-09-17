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

module.exports = {
  analyzeIncidentThreat,
  calculateDistance,
  computeSafetyScore
};
