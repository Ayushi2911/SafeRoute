import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const ROUTE_API = `${API_BASE_URL}/api/routes`;

/**
 * Fetch all public risk zones with radius and safety scores
 */
export const getRiskZones = async () => {
  const response = await axios.get(`${ROUTE_API}/risk-zones`);
  return response.data;
};

/**
 * Fetch nearby emergency services sorted by distance
 */
export const getNearbyServices = async (lat, lon, radius = 5, type = null) => {
  const params = { lat, lon, radius };
  if (type && type !== 'all') {
    params.type = type;
  }
  const response = await axios.get(`${ROUTE_API}/services/nearby`, { params });
  return response.data;
};

/**
 * Fetch verified incidents feed for map display and hazards
 */
export const getVerifiedIncidents = async () => {
  const response = await axios.get(`${ROUTE_API}/incidents`);
  return response.data;
};

/**
 * Fetch real-time safety score and proximity factors for coordinates
 */
export const getSafetyScore = async (lat, lon) => {
  const response = await axios.get(`${ROUTE_API}/safety-score`, {
    params: { lat, lon },
  });
  return response.data;
};

/**
 * Calculate multi-path routes via OSRM with safety evaluations
 */
export const calculateRoute = async (origin, destination) => {
  const response = await axios.post(`${ROUTE_API}/calculate`, {
    origin,
    destination,
  });
  return response.data;
};
