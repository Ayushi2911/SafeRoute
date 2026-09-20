/* oxlint-disable react(set-state-in-effect) */
import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  Navigation,
  MapPin,
  Compass,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Crosshair,
  ArrowUpDown,
  PhoneCall,
  Building2,
  Flame,
  Milestone,
  Route,
  Info,
  Layers,
  Sparkles,
  Map as MapIcon,
  Loader2,
} from 'lucide-react';
import {
  getRiskZones,
  getNearbyServices,
  getVerifiedIncidents,
  getSafetyScore,
  calculateRoute,
} from '../services/routeService';
import SafeRouteLogo from '../components/SafeRouteLogo';
import './SafeRouteMap.css';

// Fix Vite asset URL resolution for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Default center: Mumbai (matches saferoute.sql seed coordinates)
const DEFAULT_CENTER = [19.0760, 72.8777];
const DEFAULT_ZOOM = 13;

/**
 * Coordinate parser: accepts "lat, lon", "Current Location (lat, lon)",
 * or popular Mumbai landmark shortcuts for seamless demo usability.
 */
function parseCoordinates(input, defaultUserCoords = null) {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // Pattern: "Current Location (lat, lon)"
  const currentLocMatch = str.match(
    /Current Location\s*\(\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)/i
  );
  if (currentLocMatch) {
    return { lat: parseFloat(currentLocMatch[1]), lon: parseFloat(currentLocMatch[3]) };
  }

  // Pattern: "lat, lon"
  const commaMatch = str.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
  if (commaMatch) {
    return { lat: parseFloat(commaMatch[1]), lon: parseFloat(commaMatch[3]) };
  }

  // User typed "current location" and we have GPS coordinates
  if (/current\s*location/i.test(str) && defaultUserCoords) {
    return { lat: defaultUserCoords.lat, lon: defaultUserCoords.lng };
  }

  // Common landmarks for demo testing
  const landmarks = {
    'dadar': { lat: 19.0178, lon: 72.8478 },
    'bkc': { lat: 19.0657, lon: 72.8687 },
    'bandra kurla complex': { lat: 19.0657, lon: 72.8687 },
    'mumbai central': { lat: 18.9696, lon: 72.8194 },
    'cst': { lat: 18.9401, lon: 72.8354 },
    'bandra': { lat: 19.0596, lon: 72.8295 },
    'kurla': { lat: 19.0726, lon: 72.8845 },
    'central mumbai': { lat: 19.0760, lon: 72.8777 },
    'andheri': { lat: 19.1197, lon: 72.8464 },
  };

  const lower = str.toLowerCase();
  for (const [name, coords] of Object.entries(landmarks)) {
    if (lower.includes(name)) {
      return coords;
    }
  }

  return null;
}

export default function SafeRouteMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const clickMarkerRef = useRef(null);

  // Leaflet Layer Groups
  const riskZonesLayerRef = useRef(null);
  const servicesLayerRef = useRef(null);
  const incidentsLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  // Form Inputs & Geolocation State
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [notification, setNotification] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  // Backend Data State
  const [riskZones, setRiskZones] = useState([]);
  const [emergencyServices, setEmergencyServices] = useState([]);
  const [verifiedIncidents, setVerifiedIncidents] = useState([]);
  const [safetyScoreData, setSafetyScoreData] = useState(null);
  const [routesData, setRoutesData] = useState(null);

  // Loading & Action State
  const [isLoadingMapData, setIsLoadingMapData] = useState(true);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Layer Toggles
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

  // -------------------------------------------------------------------------
  // 1. Initialize Leaflet Map and Layer Groups
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initialize individual layer groups
    riskZonesLayerRef.current = L.layerGroup().addTo(map);
    servicesLayerRef.current = L.layerGroup().addTo(map);
    incidentsLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    // Map click handler to select Origin or Destination
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const formattedCoords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      if (clickMarkerRef.current) {
        clickMarkerRef.current.setLatLng(e.latlng);
      } else {
        clickMarkerRef.current = L.marker(e.latlng).addTo(map);
      }

      clickMarkerRef.current
        .bindPopup(
          `<div class="map-popup-custom">
            <strong>Selected Coordinates</strong>
            <p>${formattedCoords}</p>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="popup-btn" id="pop-set-origin">Set Origin</button>
              <button class="popup-btn secondary" id="pop-set-dest">Set Dest</button>
            </div>
          </div>`
        )
        .openPopup();

      setTimeout(() => {
        const originBtn = document.getElementById('pop-set-origin');
        const destBtn = document.getElementById('pop-set-dest');
        if (originBtn) {
          originBtn.onclick = () => {
            setOrigin(formattedCoords);
            map.closePopup();
          };
        }
        if (destBtn) {
          destBtn.onclick = () => {
            setDestination(formattedCoords);
            map.closePopup();
          };
        }
      }, 100);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------------
  // 2. Initial Data Fetch (Risk Zones, Services, Incidents, Safety Score)
  // -------------------------------------------------------------------------
  const fetchInitialData = useCallback(async () => {
    try {
      const [zonesRes, incidentsRes, servicesRes, scoreRes] = await Promise.all([
        getRiskZones().catch((err) => ({ success: false, error: err })),
        getVerifiedIncidents().catch((err) => ({ success: false, error: err })),
        getNearbyServices(DEFAULT_CENTER[0], DEFAULT_CENTER[1], 8).catch((err) => ({
          success: false,
          error: err,
        })),
        getSafetyScore(DEFAULT_CENTER[0], DEFAULT_CENTER[1]).catch((err) => ({
          success: false,
          error: err,
        })),
      ]);

      if (zonesRes?.success && Array.isArray(zonesRes.data)) {
        setRiskZones(zonesRes.data);
      }
      if (incidentsRes?.success && Array.isArray(incidentsRes.data)) {
        setVerifiedIncidents(incidentsRes.data);
      }
      if (servicesRes?.success && Array.isArray(servicesRes.data)) {
        setEmergencyServices(servicesRes.data);
      }
      if (scoreRes?.success && scoreRes.data) {
        setSafetyScoreData(scoreRes.data);
      }
    } catch (err) {
      console.error('Failed to load initial map data:', err);
      setNotification({
        type: 'warning',
        title: 'Backend Connectivity Notice',
        message: 'Could not fetch live map data. Ensure the SafeRoute backend API is accessible and running.',
      });
    } finally {
      setIsLoadingMapData(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await fetchInitialData();
    };
    init();
  }, [fetchInitialData]);

  // -------------------------------------------------------------------------
  // 3. Render Risk Zones on Map
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!riskZonesLayerRef.current) return;
    riskZonesLayerRef.current.clearLayers();

    riskZones.forEach((zone) => {
      const isHigh = zone.risk_level === 'high';
      const isMed = zone.risk_level === 'medium';
      const color = isHigh ? 'var(--color-accent)' : isMed ? 'var(--color-accent-soft)' : 'var(--color-blue-dark)';

      const circle = L.circle([zone.latitude, zone.longitude], {
        radius: zone.radius,
        color,
        fillColor: color,
        fillOpacity: isHigh ? 0.28 : isMed ? 0.22 : 0.15,
        weight: isHigh ? 2 : 1.5,
        dashArray: isHigh ? '5, 5' : null,
      });

      circle.bindPopup(`
        <div class="map-popup-custom">
          <div class="popup-title-row">
            <span class="popup-tag ${zone.risk_level}">${zone.risk_level.toUpperCase()} RISK</span>
            <strong>${zone.area_name}</strong>
          </div>
          <p>Safety Score: <b>${zone.safety_score}/100</b></p>
          <p>Monitored Radius: <b>${zone.radius} meters</b></p>
        </div>
      `);

      circle.addTo(riskZonesLayerRef.current);
    });
  }, [riskZones]);

  // -------------------------------------------------------------------------
  // 4. Render Emergency Services on Map
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!servicesLayerRef.current) return;
    servicesLayerRef.current.clearLayers();

    emergencyServices.forEach((svc) => {
      const iconSymbol = svc.type === 'police' ? '👮' : svc.type === 'hospital' ? '🏥' : '🚒';

      const customIcon = L.divIcon({
        className: 'custom-service-marker',
        html: `<div class="service-map-pin ${svc.type}">${iconSymbol}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker([svc.latitude, svc.longitude], { icon: customIcon });

      marker.bindPopup(`
        <div class="map-popup-custom">
          <strong>${svc.name}</strong>
          <span class="popup-type-badge ${svc.type}">${svc.type.replace('_', ' ').toUpperCase()}</span>
          <p>${svc.address || 'Central address on file'}</p>
          <p>Proximity: <b>${svc.distanceKm} km away</b></p>
          ${
            svc.phone
              ? `<a href="tel:${svc.phone}" class="popup-btn-call">📞 Call ${svc.phone}</a>`
              : ''
          }
        </div>
      `);

      marker.addTo(servicesLayerRef.current);
    });
  }, [emergencyServices]);

  // -------------------------------------------------------------------------
  // 5. Render Verified Incidents on Map
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!incidentsLayerRef.current) return;
    incidentsLayerRef.current.clearLayers();

    verifiedIncidents.forEach((inc) => {
      const pinClass = inc.severity === 'high' ? 'danger' : inc.severity === 'medium' ? 'caution' : 'info';

      const customIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `<div class="incident-map-pin ${pinClass}">⚠️</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });

      const dateString = inc.created_at ? new Date(inc.created_at).toLocaleString() : 'Recent';

      marker.bindPopup(`
        <div class="map-popup-custom">
          <div class="popup-title-row">
            <span class="popup-tag ${pinClass}">${inc.severity.toUpperCase()} SEVERITY</span>
            <strong>${inc.category}</strong>
          </div>
          <p class="popup-desc">${inc.description}</p>
          <p class="popup-sub">${inc.address || 'Address logged'}</p>
          <small class="popup-time">${dateString}</small>
        </div>
      `);

      marker.addTo(incidentsLayerRef.current);
    });
  }, [verifiedIncidents]);

  // -------------------------------------------------------------------------
  // 6. Layer Toggle Visibility Sync
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current || !riskZonesLayerRef.current) return;
    if (showRiskZones) {
      if (!mapInstanceRef.current.hasLayer(riskZonesLayerRef.current)) {
        mapInstanceRef.current.addLayer(riskZonesLayerRef.current);
      }
    } else if (mapInstanceRef.current.hasLayer(riskZonesLayerRef.current)) {
      mapInstanceRef.current.removeLayer(riskZonesLayerRef.current);
    }
  }, [showRiskZones]);

  useEffect(() => {
    if (!mapInstanceRef.current || !servicesLayerRef.current) return;
    if (showServices) {
      if (!mapInstanceRef.current.hasLayer(servicesLayerRef.current)) {
        mapInstanceRef.current.addLayer(servicesLayerRef.current);
      }
    } else if (mapInstanceRef.current.hasLayer(servicesLayerRef.current)) {
      mapInstanceRef.current.removeLayer(servicesLayerRef.current);
    }
  }, [showServices]);

  useEffect(() => {
    if (!mapInstanceRef.current || !incidentsLayerRef.current) return;
    if (showIncidents) {
      if (!mapInstanceRef.current.hasLayer(incidentsLayerRef.current)) {
        mapInstanceRef.current.addLayer(incidentsLayerRef.current);
      }
    } else if (mapInstanceRef.current.hasLayer(incidentsLayerRef.current)) {
      mapInstanceRef.current.removeLayer(incidentsLayerRef.current);
    }
  }, [showIncidents]);

  // -------------------------------------------------------------------------
  // 7. Browser Geolocation: Get User's Current Location
  // -------------------------------------------------------------------------
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Detecting precise GPS coordinates...');
    setNotification(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setOrigin(`Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setLocationStatus('GPS location acquired.');

        if (mapInstanceRef.current) {
          const map = mapInstanceRef.current;
          map.setView([latitude, longitude], 15, { animate: true });

          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const pulseIcon = L.divIcon({
              className: 'custom-pulse-marker',
              html: `
                <div class="pulse-beacon-container">
                  <div class="pulse-beacon-ring"></div>
                  <div class="pulse-beacon-core"></div>
                </div>
              `,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            userMarkerRef.current = L.marker([latitude, longitude], { icon: pulseIcon }).addTo(map);
          }

          userMarkerRef.current
            .bindPopup(
              `<div class="map-popup-custom">
                <strong>Your Current Location</strong>
                <p>Accuracy: within ${Math.round(accuracy)} meters</p>
                <span class="badge-safe">Live GPS</span>
              </div>`
            )
            .openPopup();
        }

        // Dynamically fetch nearby emergency services & safety score for the user's real coordinates
        try {
          const [servicesRes, scoreRes] = await Promise.all([
            getNearbyServices(latitude, longitude, 5),
            getSafetyScore(latitude, longitude),
          ]);
          if (servicesRes?.success && Array.isArray(servicesRes.data)) {
            setEmergencyServices(servicesRes.data);
          }
          if (scoreRes?.success && scoreRes.data) {
            setSafetyScoreData(scoreRes.data);
          }
        } catch (e) {
          console.warn('Could not update location-specific services:', e.message);
        }
      },
      (error) => {
        let msg = 'Unable to retrieve location. Please check browser permissions.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access in your browser.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Retrying with default center.';
        }
        setLocationStatus(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // Swap Origin and Destination
  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // -------------------------------------------------------------------------
  // 8. Handle Calculate Route Action (OSRM + Real Backend API)
  // -------------------------------------------------------------------------
  const handleCalculateRoute = async (e) => {
    e.preventDefault();

    const origCoords = parseCoordinates(origin, userCoords);
    const destCoords = parseCoordinates(destination, userCoords);

    if (!origCoords) {
      setNotification({
        type: 'warning',
        title: 'Invalid Origin',
        message:
          'Please enter valid origin coordinates (e.g. 19.0760, 72.8777) or click directly on the map to set a starting point.',
      });
      return;
    }

    if (!destCoords) {
      setNotification({
        type: 'warning',
        title: 'Invalid Destination',
        message:
          'Please enter valid destination coordinates (e.g. 19.0820, 72.8890) or click directly on the map to set a destination.',
      });
      return;
    }

    setIsCalculatingRoute(true);
    setNotification(null);

    try {
      const response = await calculateRoute(origCoords, destCoords);

      if (!response?.success || !response.routes || response.routes.length === 0) {
        throw new Error(response?.message || 'No driveable routes found.');
      }

      setRoutesData(response);

      // Render routes on Leaflet Map
      if (routesLayerRef.current) {
        routesLayerRef.current.clearLayers();

        const { fastestRoute, safestRoute, isSingleRoute } = response;
        const allLatLngs = [];

        const isSameRoute = isSingleRoute || fastestRoute.routeIndex === safestRoute.routeIndex;

        if (isSameRoute) {
          // If fastest and safest are the same, draw one clear, optimal green polyline
          const latLngs = fastestRoute.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          allLatLngs.push(...latLngs);

          const polyline = L.polyline(latLngs, {
            color: 'var(--color-blue-dark)',
            weight: 6,
            opacity: 0.92,
          });

          polyline.bindPopup(`
            <div class="map-popup-custom">
              <span class="recommend-tag">RECOMMENDED SAFER &amp; OPTIMAL ROUTE</span>
              <strong>${fastestRoute.name}</strong>
              <p>Safety Score: <b>${fastestRoute.safetyScore}/100</b> (${fastestRoute.riskTier})</p>
              <p>Distance: <b>${fastestRoute.distanceKm} km</b> &bull; Duration: <b>${fastestRoute.durationMins} mins</b></p>
            </div>
          `);

          polyline.addTo(routesLayerRef.current);
        } else {
          // Draw Fastest Route (amber dashed line)
          const fastLatLngs = fastestRoute.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          allLatLngs.push(...fastLatLngs);

          const fastPolyline = L.polyline(fastLatLngs, {
            color: 'var(--color-accent-soft)',
            weight: 4,
            opacity: 0.8,
            dashArray: '6, 8',
          });

          fastPolyline.bindPopup(`
            <div class="map-popup-custom">
              <span class="alternate-tag">SHORTEST PATH</span>
              <strong>${fastestRoute.name}</strong>
              <p>Safety Score: <b>${fastestRoute.safetyScore}/100</b> (${fastestRoute.riskTier})</p>
              <p>Distance: <b>${fastestRoute.distanceKm} km</b> &bull; Duration: <b>${fastestRoute.durationMins} mins</b></p>
            </div>
          `);

          fastPolyline.addTo(routesLayerRef.current);

          // Draw Safest Route (solid emerald green line)
          const safeLatLngs = safestRoute.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
          allLatLngs.push(...safeLatLngs);

          const safePolyline = L.polyline(safeLatLngs, {
            color: 'var(--color-blue-dark)',
            weight: 6,
            opacity: 0.95,
          });

          safePolyline.bindPopup(`
            <div class="map-popup-custom">
              <span class="recommend-tag">RECOMMENDED SAFER ROUTE</span>
              <strong>${safestRoute.name}</strong>
              <p>Safety Score: <b>${safestRoute.safetyScore}/100</b> (${safestRoute.riskTier})</p>
              <p>Distance: <b>${safestRoute.distanceKm} km</b> &bull; Duration: <b>${safestRoute.durationMins} mins</b></p>
            </div>
          `);

          safePolyline.addTo(routesLayerRef.current);
        }

        // Add Origin & Destination markers
        const originMarker = L.marker([origCoords.lat, origCoords.lon]).bindPopup('<b>Starting Point (Origin)</b>');
        const destMarker = L.marker([destCoords.lat, destCoords.lon]).bindPopup('<b>Destination</b>');
        originMarker.addTo(routesLayerRef.current);
        destMarker.addTo(routesLayerRef.current);

        // Fit Map bounds to the calculated route
        if (allLatLngs.length > 0 && mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(L.latLngBounds(allLatLngs), { padding: [40, 40] });
        }

        // Success notification
        if (isSameRoute) {
          setNotification({
            type: 'success',
            title: 'Optimal Route Calculated',
            message: `The fastest arterial path is also the recommended safer route for this trip (Safety Score: ${safestRoute.safetyScore}/100).`,
          });
        } else {
          setNotification({
            type: 'success',
            title: 'Route Alternatives Evaluated',
            message: `Evaluated multiple routes: Safest route scores ${safestRoute.safetyScore}/100; Fastest path scores ${fastestRoute.safetyScore}/100.`,
          });
        }
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      const errMsg =
        err.response?.data?.message || err.message || 'Unable to compute route between coordinates.';
      setNotification({
        type: 'error',
        title: 'Route Calculation Notice',
        message: errMsg.includes('OSRM')
          ? 'Routing service is temporarily busy. Please try nearby street coordinates.'
          : errMsg,
      });
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Reset map view to default center
  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
    }
  };

  // Compute tier class for safety score
  const scoreNumber = safetyScoreData?.score;
  const scoreClass =
    scoreNumber !== undefined
      ? scoreNumber >= 75
        ? 'safe'
        : scoreNumber >= 50
        ? 'caution'
        : 'danger'
      : 'safe';

  return (
    <div className="saferoute-page">
      {/* 1. Header Section */}
      <header className="saferoute-header">
        <div className="header-brand-wrap">
          <div className="header-icon-box">
            <SafeRouteLogo size={32} />
          </div>
          <div>
            <div className="eyebrow-tag">
              <Sparkles size={13} />
              <span>SAFEROUTE SAFETY ENGINE</span>
            </div>
            <h1 className="page-title">Safe Route & Maps</h1>
            <p className="page-description">
              Intelligent multi-criteria route optimization. Avoid high-risk crime zones, steer clear of reported
              hazards, and navigate with real-time proximity to emergency police and medical services.
            </p>
          </div>
        </div>

        <div className="header-status-badge">
          <span className="live-dot"></span>
          <span>OpenStreetMap &amp; AI Engine Online</span>
        </div>
      </header>

      {/* Notification Banner if active */}
      {notification && (
        <div className={`saferoute-notification ${notification.type}`}>
          <Info size={18} />
          <div>
            <strong>{notification.title}: </strong>
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            className="notice-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. Main Workspace: Split View (Search Form + Map) */}
      <div className="saferoute-workspace">
        {/* Left Column: Route Search & Quick Actions */}
        <div className="saferoute-control-panel">
          <form className="route-form" onSubmit={handleCalculateRoute}>
            <div className="form-heading">
              <Route size={18} className="icon-accent" />
              <span>Plan a Safe Journey</span>
            </div>

            {/* Origin Field */}
            <div className="input-group">
              <label htmlFor="origin-input">
                <MapPin size={15} className="text-emerald" />
                <span>Starting Point (Origin)</span>
              </label>
              <div className="input-with-action">
                <input
                  id="origin-input"
                  type="text"
                  placeholder="e.g., 19.0760, 72.8777 or Dadar Station"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="swap-button-row">
              <button
                type="button"
                className="btn-icon-swap"
                onClick={handleSwapLocations}
                title="Swap origin and destination"
                aria-label="Swap origin and destination"
              >
                <ArrowUpDown size={15} />
                <span>Swap Origin &amp; Destination</span>
              </button>

              <button
                type="button"
                className="btn-location-gps"
                onClick={handleUseCurrentLocation}
                title="Use current GPS location"
              >
                <Crosshair size={14} />
                <span>Use Current Location</span>
              </button>
            </div>

            {locationStatus && (
              <div className="location-status-text">
                {locationStatus}
                {userCoords && ` [${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}]`}
              </div>
            )}

            {/* Destination Field */}
            <div className="input-group">
              <label htmlFor="destination-input">
                <Milestone size={15} className="text-accent" />
                <span>Destination</span>
              </label>
              <input
                id="destination-input"
                type="text"
                placeholder="e.g., 19.0820, 72.8890 or BKC"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="btn-calculate-route"
              disabled={isCalculatingRoute}
            >
              {isCalculatingRoute ? (
                <>
                  <Loader2 size={17} className="spin-animate" />
                  <span>Calculating Safe Path...</span>
                </>
              ) : (
                <>
                  <Navigation size={17} />
                  <span>Search &amp; Calculate Route</span>
                </>
              )}
            </button>

            <div className="route-tip">
              <Info size={14} />
              <span>Tip: You can also click anywhere directly on the map to select points or use demo landmarks (Dadar, BKC, CST).</span>
            </div>
          </form>

          {/* Interactive Layer Toggles Card */}
          <div className="mini-status-card">
            <div className="mini-status-header">
              <Layers size={16} />
              <span>Interactive Map Layers</span>
            </div>
            <div className="layer-toggle-grid">
              <button
                type="button"
                className={`layer-toggle-btn ${showRiskZones ? 'active' : ''}`}
                onClick={() => setShowRiskZones((prev) => !prev)}
              >
                <span>Monitored Risk Zones ({riskZones.length})</span>
                <span className="toggle-status-indicator">{showRiskZones ? 'VISIBLE' : 'HIDDEN'}</span>
              </button>

              <button
                type="button"
                className={`layer-toggle-btn ${showServices ? 'active' : ''}`}
                onClick={() => setShowServices((prev) => !prev)}
              >
                <span>Emergency Services ({emergencyServices.length})</span>
                <span className="toggle-status-indicator">{showServices ? 'VISIBLE' : 'HIDDEN'}</span>
              </button>

              <button
                type="button"
                className={`layer-toggle-btn ${showIncidents ? 'active' : ''}`}
                onClick={() => setShowIncidents((prev) => !prev)}
              >
                <span>Verified Incidents ({verifiedIncidents.length})</span>
                <span className="toggle-status-indicator">{showIncidents ? 'VISIBLE' : 'HIDDEN'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map Display */}
        <div className="saferoute-map-wrapper">
          <div className="map-toolbar">
            <div className="map-toolbar-left">
              <span className="map-badge">
                <MapIcon size={14} /> Live Interactive Canvas
              </span>
              <span className="map-subtext">
                {isLoadingMapData ? 'Loading live telemetry...' : 'Click map to set points or drag to pan'}
              </span>
            </div>
            <div className="map-toolbar-right">
              <button
                type="button"
                className="map-tool-btn"
                onClick={handleUseCurrentLocation}
                title="Pan to my GPS location"
              >
                <Crosshair size={14} />
                <span>Locate Me</span>
              </button>
              <button
                type="button"
                className="map-tool-btn"
                onClick={handleResetView}
                title="Reset map to default view"
              >
                <Compass size={14} />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* Leaflet DOM container */}
          <div className="leaflet-map-host" ref={mapContainerRef} />

          {/* Map Overlay Legend */}
          <div className="map-legend-bar">
            <div className="legend-item">
              <span className="legend-dot user-dot"></span>
              <span>Your Location</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot safe-dot"></span>
              <span>Recommended Safer Route</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot fast-dot"></span>
              <span>Fastest Route</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot danger-dot"></span>
              <span>Risk Zones</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot service-dot"></span>
              <span>Emergency Services</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot incident-dot"></span>
              <span>Verified Incidents</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Real Backend Cards Grid */}
      <section className="cards-bento-grid">
        {/* Card A: Location Safety Score */}
        <div className="bento-card card-safety-score">
          <div className="card-header">
            <div className="card-title-wrap">
              <div className="card-icon-pill icon-safe">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3>Safety Score Engine</h3>
                <span className="card-subtitle">Live Location &amp; Corridor Safety Index</span>
              </div>
            </div>
            <span className="badge-live-feed">Live Telemetry</span>
          </div>

          <div className="safety-score-content">
            <div className={`score-meter-box ${scoreClass}`}>
              <div className="score-number">{safetyScoreData?.score ?? '--'}</div>
              <div className="score-scale">/ 100</div>
              <span className={`score-tier ${scoreClass}`}>
                {safetyScoreData?.riskTier ? safetyScoreData.riskTier.toUpperCase() : 'CALCULATING...'}
              </span>
            </div>
            <div className="score-breakdown-list">
              <div className="breakdown-item">
                <span className="item-label">Verified Incidents (1km / 2km):</span>
                <span className="item-val good">
                  {safetyScoreData?.factors?.incidentsWithin1Km ?? 0} in 1km ({safetyScoreData?.factors?.incidentsWithin2Km ?? 0} in 2km)
                </span>
              </div>
              <div className="breakdown-item">
                <span className="item-label">Nearest Police Station:</span>
                <span className="item-val good">
                  {safetyScoreData?.factors?.nearestPolice
                    ? `${safetyScoreData.factors.nearestPolice.name} (${safetyScoreData.factors.nearestPolice.distanceKm} km)`
                    : 'None within range'}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="item-label">Nearest Hospital / Medical:</span>
                <span className="item-val neutral">
                  {safetyScoreData?.factors?.nearestHospital
                    ? `${safetyScoreData.factors.nearestHospital.name} (${safetyScoreData.factors.nearestHospital.distanceKm} km)`
                    : 'None within range'}
                </span>
              </div>
              <div className="breakdown-item">
                <span className="item-label">Intersecting Risk Zones:</span>
                <span className={`item-val ${safetyScoreData?.factors?.intersectingRiskZones?.length ? 'warn' : 'good'}`}>
                  {safetyScoreData?.factors?.intersectingRiskZones?.length
                    ? safetyScoreData.factors.intersectingRiskZones.map((z) => z.name).join(', ')
                    : 'None (Outside hazard perimeter)'}
                </span>
              </div>
            </div>
          </div>
          <div className="card-footer-note">
            <strong>Informational Risk Indicator:</strong> Safety scores are calculated from spatial proximity to verified incidents and emergency services. They provide informational threat awareness, not an absolute guarantee of personal safety.
          </div>
        </div>

        {/* Card B: Safest Route (Recommended) */}
        <div className="bento-card card-route-safest">
          <div className="card-header">
            <div className="card-title-wrap">
              <div className="card-icon-pill icon-emerald">
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className="recommend-tag">RECOMMENDED</span>
                <h3>Safest Route</h3>
                <span className="card-subtitle">Threat Avoidance Optimized</span>
              </div>
            </div>
            <span className={`route-score-pill ${routesData?.safestRoute ? 'safe' : 'idle'}`}>
              {routesData?.safestRoute ? `Score: ${routesData.safestRoute.safetyScore}/100` : 'Awaiting Calculation'}
            </span>
          </div>

          <div className="route-metrics-row">
            <div className="metric-cell">
              <span className="metric-label">Estimated Time</span>
              <span className="metric-value">
                {routesData?.safestRoute ? `${routesData.safestRoute.durationMins} mins` : '--'}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Total Distance</span>
              <span className="metric-value">
                {routesData?.safestRoute ? `${routesData.safestRoute.distanceKm} km` : '--'}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Hazards Along Path</span>
              <span className="metric-value text-emerald">
                {routesData?.safestRoute
                  ? `${routesData.safestRoute.riskFactors?.incidentCountAlongRoute || 0} incidents`
                  : '--'}
              </span>
            </div>
          </div>

          <p className="route-summary-text">
            {routesData?.safestRoute ? (
              routesData.safestRoute.isFastestAsWell ? (
                'The recommended safer route follows main well-lit arterial thoroughfares with continuous police patrol proximity and optimal travel time.'
              ) : (
                `Recommended safer route via ${routesData.safestRoute.name}. Avoids high-risk crime zones and reported incidents.`
              )
            ) : (
              'Enter origin and destination coordinates above, then click "Search & Calculate Route" to evaluate multi-criteria route safety.'
            )}
          </p>

          <div className="card-footer-status">
            <span className={`status-dot ${routesData?.safestRoute ? 'good' : 'idle'}`}></span>
            <span>
              {routesData?.safestRoute
                ? `Evaluated via ${routesData.safestRoute.riskFactors?.sampledWaypointsCount || 0} waypoints`
                : 'Awaiting route calculation'}
            </span>
          </div>
        </div>

        {/* Card C: Fastest Route (Alternate) */}
        <div className="bento-card card-route-fastest">
          <div className="card-header">
            <div className="card-title-wrap">
              <div className="card-icon-pill icon-amber">
                <AlertTriangle size={18} />
              </div>
              <div>
                <span className="alternate-tag">SHORTEST PATH</span>
                <h3>Fastest Route</h3>
                <span className="card-subtitle">Direct Distance &amp; Speed Optimized</span>
              </div>
            </div>
            <span className={`route-score-pill ${routesData?.fastestRoute ? 'caution' : 'idle'}`}>
              {routesData?.fastestRoute ? `Score: ${routesData.fastestRoute.safetyScore}/100` : 'Awaiting Calculation'}
            </span>
          </div>

          <div className="route-metrics-row">
            <div className="metric-cell">
              <span className="metric-label">Estimated Time</span>
              <span className="metric-value">
                {routesData?.fastestRoute ? `${routesData.fastestRoute.durationMins} mins` : '--'}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Total Distance</span>
              <span className="metric-value">
                {routesData?.fastestRoute ? `${routesData.fastestRoute.distanceKm} km` : '--'}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-label">Caution Points</span>
              <span className="metric-value text-amber">
                {routesData?.fastestRoute
                  ? `${routesData.fastestRoute.riskFactors?.riskZonesIntersected?.length || 0} risk zones`
                  : '--'}
              </span>
            </div>
          </div>

          <p className="route-summary-text">
            {routesData?.fastestRoute ? (
              routesData.fastestRoute.isSafestAsWell ? (
                'Identical to recommended safer route — the shortest arterial trajectory also achieves the highest safety rating.'
              ) : (
                `Fastest trajectory via ${routesData.fastestRoute.name}. Saves travel time but passes near areas with lower safety ratings.`
              )
            ) : (
              'Comparative risk metrics between fastest and safest routes will be displayed here once paths are generated.'
            )}
          </p>

          <div className="card-footer-status">
            <span className={`status-dot ${routesData?.fastestRoute ? 'caution' : 'idle'}`}></span>
            <span>
              {routesData?.fastestRoute
                ? (routesData.isSingleRoute ? 'Single direct trajectory identified' : 'Alternate trajectory generated')
                : 'Awaiting route calculation'}
            </span>
          </div>
        </div>

        {/* Card D: Nearby Emergency Services */}
        <div className="bento-card card-emergency-services">
          <div className="card-header">
            <div className="card-title-wrap">
              <div className="card-icon-pill icon-service">
                <PhoneCall size={18} />
              </div>
              <div>
                <h3>Nearby Emergency Services</h3>
                <span className="card-subtitle">One-Touch Distress &amp; Medical Assistance</span>
              </div>
            </div>
            <span className="badge-live-feed">Real DB Feed</span>
          </div>

          <div className="services-sample-list">
            {emergencyServices.length === 0 ? (
              <div className="empty-state-notice">No emergency services found within current search radius.</div>
            ) : (
              emergencyServices.slice(0, 3).map((svc) => (
                <div key={svc.id} className="service-sample-row">
                  <div className={`service-icon-col ${svc.type}`}>
                    {svc.type === 'police' && <Building2 size={16} />}
                    {svc.type === 'hospital' && <ShieldAlert size={16} />}
                    {svc.type === 'fire_station' && <Flame size={16} />}
                  </div>
                  <div className="service-info-col">
                    <div className="service-name">{svc.name}</div>
                    <div className="service-sub">
                      {svc.address || 'Address logged'} &bull; {svc.distanceKm} km away
                    </div>
                  </div>
                  {svc.phone && (
                    <a href={`tel:${svc.phone}`} className={`btn-call-emergency ${svc.type}`}>
                      <PhoneCall size={13} />
                      <span>Call {svc.phone}</span>
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="card-footer-note">
            Queried from live MySQL `emergency_services` registry sorted by Haversine distance.
          </div>
        </div>

        {/* Card E: Monitored Risk Zones */}
        <div className="bento-card card-risk-zones">
          <div className="card-header">
            <div className="card-title-wrap">
              <div className="card-icon-pill icon-danger">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3>Monitored Risk Zones</h3>
                <span className="card-subtitle">Active Hotspot Registry</span>
              </div>
            </div>
            <span className="badge-live-feed">Real DB Feed</span>
          </div>

          <div className="risk-zones-sample-list">
            {riskZones.length === 0 ? (
              <div className="empty-state-notice">No active risk zones registered in database.</div>
            ) : (
              riskZones.map((zone) => {
                const isHigh = zone.risk_level === 'high';
                const isMed = zone.risk_level === 'medium';
                const barClass = isHigh ? 'danger' : isMed ? 'caution' : 'good';

                return (
                  <div key={zone.id} className="risk-zone-row">
                    <div className={`zone-indicator-bar ${barClass}`}></div>
                    <div className="zone-meta">
                      <strong>{zone.area_name} ({zone.risk_level.toUpperCase()} RISK)</strong>
                      <span>Radius: {zone.radius}m perimeter</span>
                    </div>
                    <div className={`zone-score-pill ${barClass}`}>
                      Safety Score: {zone.safety_score}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="card-footer-note">
            Geographic circular hazard overlays rendered directly on Leaflet canvas with toggle control.
          </div>
        </div>
      </section>
    </div>
  );
}
