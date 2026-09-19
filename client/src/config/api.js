/**
 * SafeRoute API Configuration
 *
 * Configured API base URL for network calls.
 * Uses VITE_API_BASE_URL when defined (e.g. in production: https://saferoute-backend-lgis.onrender.com),
 * falling back to local development (http://localhost:5000).
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = rawBaseUrl && typeof rawBaseUrl === 'string'
  ? rawBaseUrl.trim().replace(/\/+$/, '')
  : 'http://localhost:5000';

export default API_BASE_URL;
