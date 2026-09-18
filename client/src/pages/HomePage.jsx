import SafeRouteLogo from '../components/SafeRouteLogo'
import {
  Shield,
  Navigation,
  AlertTriangle,
  HeartPulse,
  BarChart3,
  History,
  PhoneCall,
  MapPin,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  Flame,
  Radio,
} from 'lucide-react'
import './HomePage.css'

export default function HomePage({ onNavigate }) {
  return (
    <main className="home-container">
      {/* 1. HERO SECTION */}
      <section className="home-hero-section">
        <div className="hero-glow-orb hero-glow-1" aria-hidden="true" />
        <div className="hero-glow-glow hero-glow-2" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>SMART PUBLIC SAFETY &amp; EMERGENCY ASSISTANCE PLATFORM</span>
          </div>

          <div className="hero-logo-mark">
            <SafeRouteLogo size={72} />
          </div>

          <div className="hero-brand-name">SafeRoute</div>

          <h1 className="hero-headline">
            Safer Paths. <br className="hero-break" />
            <span className="hero-headline-gradient">Brighter Tomorrows.</span>
          </h1>

          <p className="hero-subheadline">
            Intelligent route safety scoring, community incident reporting, and real-time emergency service
            proximity — engineered to keep citizens protected on every journey.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-primary-glow"
              onClick={() => onNavigate('safe-route')}
            >
              <Navigation size={18} />
              <span>Explore Safe Routes</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="btn-secondary-glow"
              onClick={() => onNavigate('report')}
            >
              <AlertTriangle size={18} />
              <span>Report an Incident</span>
            </button>

            <a href="#emergency-section" className="btn-emergency-pill">
              <PhoneCall size={16} />
              <span>Emergency Hotlines</span>
            </a>
          </div>

          {/* Descriptive Pillar Cards (No fake stats) */}
          <div className="hero-pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-wrap icon-cyan">
                <Compass size={22} />
              </div>
              <div className="pillar-body">
                <h3>Dynamic Route Scoring</h3>
                <p>Calculates multi-criteria safety ratings from 0 to 100 based on verified road conditions.</p>
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-wrap icon-purple">
                <Shield size={22} />
              </div>
              <div className="pillar-body">
                <h3>Risk-Zone Intelligence</h3>
                <p>Visualizes danger perimeters with real-time circular overlays and radial hazard penalties.</p>
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-wrap icon-rose">
                <Radio size={22} />
              </div>
              <div className="pillar-body">
                <h3>Verified Incident Triage</h3>
                <p>Crowd-sourced citizen reports vetted and geotagged for dependable street-level awareness.</p>
              </div>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-wrap icon-emerald">
                <HeartPulse size={22} />
              </div>
              <div className="pillar-body">
                <h3>Emergency Proximity</h3>
                <p>Instant Haversine distance tracking to Police, Hospitals, and Fire Stations with one-tap calls.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SAFE ROUTE & MAPS SECTION */}
      <section className="home-feature-section" id="safe-routes-section">
        <div className="feature-grid">
          <div className="feature-copy">
            <div className="section-eyebrow">
              <Navigation size={14} />
              <span>SAFE ROUTE &amp; MAPS</span>
            </div>
            <h2>Intelligent Navigation &amp; Risk-Zone Mapping</h2>
            <p>
              Traditional map services optimize purely for travel time, frequently routing pedestrians and drivers
              through poorly lit alleys or elevated risk corridors. SafeRoute assesses roadway geometries against
              active risk zones and reported incidents to find the balance between speed and security.
            </p>

            <ul className="feature-checklist">
              <li>
                <CheckCircle2 size={18} className="check-icon" />
                <div>
                  <strong>Fastest vs. Safest Path Comparison</strong>
                  <span>Evaluate alternative road paths with turn-by-turn safety assessments.</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={18} className="check-icon" />
                <div>
                  <strong>Real-Time Layer Toggles</strong>
                  <span>Switch risk zones, emergency stations, and verified incidents on or off effortlessly.</span>
                </div>
              </li>
              <li>
                <CheckCircle2 size={18} className="check-icon" />
                <div>
                  <strong>Proximity-Weighted Scoring</strong>
                  <span>Bonuses for emergency station closeness and automated deductions for nearby hazards.</span>
                </div>
              </li>
            </ul>

            <button
              type="button"
              className="btn-section-cta"
              onClick={() => onNavigate('safe-route')}
            >
              <span>Launch Safe Route Map</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="feature-card-display">
            <div className="display-card-inner">
              <div className="display-card-header">
                <div className="status-indicator">
                  <span className="pulsing-dot" />
                  <span>Smart Engine Live</span>
                </div>
                <span className="display-badge">Leaflet &amp; OSRM</span>
              </div>

              <div className="display-route-demo">
                <div className="route-score-preview">
                  <div className="preview-score-circle">
                    <span className="score-val">92</span>
                    <span className="score-label">/ 100</span>
                  </div>
                  <div className="preview-score-meta">
                    <h4>Low Risk (Safe) Route</h4>
                    <p>0 incidents within 1 km · Nearest Police 450m</p>
                  </div>
                </div>

                <div className="preview-layers-list">
                  <div className="preview-layer-item">
                    <span className="layer-dot dot-red" />
                    <span>High Risk Zones (Red) — Avoidance Active</span>
                  </div>
                  <div className="preview-layer-item">
                    <span className="layer-dot dot-orange" />
                    <span>Medium Risk Zones (Orange) — Caution Advisory</span>
                  </div>
                  <div className="preview-layer-item">
                    <span className="layer-dot dot-blue" />
                    <span>Emergency Services (Police, Medical, Fire)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. REPORT INCIDENT SECTION */}
      <section className="home-feature-section alt-bg" id="report-section">
        <div className="feature-grid reverse">
          <div className="feature-copy">
            <div className="section-eyebrow">
              <AlertTriangle size={14} />
              <span>COMMUNITY VIGILANCE</span>
            </div>
            <h2>Geotagged Incident Reporting</h2>
            <p>
              Public safety thrives on collective vigilance. SafeRoute enables citizens to file structured incident
              reports with exact geographical coordinates, severity ratings, and photographic evidence.
            </p>

            <div className="reporting-steps">
              <div className="step-card">
                <span className="step-number">01</span>
                <div>
                  <h4>Select Category &amp; Severity</h4>
                  <p>Choose from harassment, road hazard, theft, assault, or public disturbance.</p>
                </div>
              </div>

              <div className="step-card">
                <span className="step-number">02</span>
                <div>
                  <h4>Pinpoint Geolocation</h4>
                  <p>Use automatic device GPS or manual map placement for street-exact coordinate accuracy.</p>
                </div>
              </div>

              <div className="step-card">
                <span className="step-number">03</span>
                <div>
                  <h4>Upload Evidence &amp; Submit</h4>
                  <p>Attach photographic documentation to expedite administrator verification.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-section-cta"
              onClick={() => onNavigate('report')}
            >
              <span>File an Incident Report</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="feature-card-display">
            <div className="incident-preview-card">
              <div className="incident-card-top">
                <span className="severity-pill pill-high">High Severity</span>
                <span className="time-pill">Recent Report</span>
              </div>
              <h3>Poor Street Lighting &amp; Harassment Risk</h3>
              <p className="incident-address">
                <MapPin size={15} />
                <span>Station Road Junction, Near West Flyover</span>
              </p>
              <p className="incident-snippet">
                Streetlights out along a 400m pedestrian stretch. Verified by community reports; safety score
                temporarily adjusted in navigation.
              </p>
              <div className="incident-footer-status">
                <span className="status-tag">Status: Verified</span>
                <span className="triage-tag">Mapped on Safe Route</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EMERGENCY ASSISTANCE SECTION */}
      <section className="home-feature-section" id="emergency-section">
        <div className="section-header-center">
          <div className="section-eyebrow">
            <PhoneCall size={14} />
            <span>RAPID RESPONSE</span>
          </div>
          <h2>Emergency Assistance &amp; Direct Hotlines</h2>
          <p>
            Immediate access to official emergency dispatch contacts. In critical distress, connect instantly with
            first responders.
          </p>
        </div>

        <div className="emergency-cards-grid">
          <div className="emergency-service-card police-card">
            <div className="service-card-header">
              <div className="service-badge">👮 POLICE</div>
              <span className="service-status">24/7 Dispatch</span>
            </div>
            <h3>Police Control Room</h3>
            <p>Immediate law enforcement response, crime reporting, and emergency patrol dispatch.</p>
            <a href="tel:100" className="call-button btn-police">
              <PhoneCall size={18} />
              <span>Dial 100</span>
            </a>
          </div>

          <div className="emergency-service-card medical-card">
            <div className="service-card-header">
              <div className="service-badge">🏥 MEDICAL</div>
              <span className="service-status">24/7 Ambulance</span>
            </div>
            <h3>Emergency Medical Services</h3>
            <p>Rapid ambulance dispatch, trauma stabilization, and hospital routing.</p>
            <a href="tel:108" className="call-button btn-medical">
              <PhoneCall size={18} />
              <span>Dial 108</span>
            </a>
          </div>

          <div className="emergency-service-card fire-card">
            <div className="service-card-header">
              <div className="service-badge">🚒 FIRE</div>
              <span className="service-status">Rescue Active</span>
            </div>
            <h3>Fire &amp; Rescue Services</h3>
            <p>Firefighting, hazardous material containment, and emergency disaster rescue.</p>
            <a href="tel:101" className="call-button btn-fire">
              <Flame size={18} />
              <span>Dial 101</span>
            </a>
          </div>

          <div className="emergency-service-card helpline-card">
            <div className="service-card-header">
              <div className="service-badge">🛡️ HELPLINE</div>
              <span className="service-status">National Line</span>
            </div>
            <h3>Women &amp; Child Safety</h3>
            <p>Confidential emergency safety helpline for women and children in danger.</p>
            <a href="tel:1091" className="call-button btn-helpline">
              <PhoneCall size={18} />
              <span>Dial 1091</span>
            </a>
          </div>
        </div>

        <div className="emergency-map-banner">
          <div className="banner-copy">
            <h4>Need to locate the nearest emergency station?</h4>
            <p>SafeRoute dynamically tracks nearby police stations, hospitals, and fire stations on the interactive map.</p>
          </div>
          <button
            type="button"
            className="btn-banner-action"
            onClick={() => onNavigate('safe-route')}
          >
            <MapPin size={16} />
            <span>View Stations on Map</span>
          </button>
        </div>
      </section>

      {/* 5. SAFETY INSIGHTS & ANALYTICS */}
      <section className="home-feature-section alt-bg" id="analytics-section">
        <div className="feature-grid">
          <div className="feature-copy">
            <div className="section-eyebrow">
              <BarChart3 size={14} />
              <span>GOVERNANCE &amp; INTELLIGENCE</span>
            </div>
            <h2>Safety Insights &amp; Analytics</h2>
            <p>
              Equipping safety administrators with situational awareness to spot emerging crime clusters, track
              incident resolution timelines, and optimize municipal emergency resource allocation.
            </p>

            <div className="analytics-points">
              <div className="point-item">
                <div className="point-bullet" />
                <div>
                  <strong>Category Distribution</strong>
                  <p>Track proportion of incidents across harassment, theft, hazards, and assault.</p>
                </div>
              </div>

              <div className="point-item">
                <div className="point-bullet" />
                <div>
                  <strong>Risk Zone Administration</strong>
                  <p>Adjust perimeter radii and baseline risk tiers according to recent field reports.</p>
                </div>
              </div>

              <div className="point-item">
                <div className="point-bullet" />
                <div>
                  <strong>Verification Pipeline</strong>
                  <p>Audit incoming user reports before integrating them into public routing safety scores.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-section-cta"
              onClick={() => onNavigate('admin')}
            >
              <span>Access Admin Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="feature-card-display">
            <div className="analytics-display-card">
              <div className="analytics-card-header">
                <BarChart3 size={20} className="analytics-icon" />
                <span>City Safety Metrics Overview</span>
              </div>
              <div className="analytics-bars">
                <div className="bar-group">
                  <div className="bar-label">
                    <span>Incident Resolution Rate</span>
                    <span className="bar-val">Active Triage</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill fill-cyan" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="bar-group">
                  <div className="bar-label">
                    <span>Safe Route Corridor Coverage</span>
                    <span className="bar-val">Citywide</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill fill-purple" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="bar-group">
                  <div className="bar-label">
                    <span>Emergency Proximity Index</span>
                    <span className="bar-val">Optimal</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill fill-emerald" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMMUNITY SAFETY & HISTORY */}
      <section className="home-feature-section" id="community-section">
        <div className="section-header-center">
          <div className="section-eyebrow">
            <History size={14} />
            <span>COMMUNITY SAFETY</span>
          </div>
          <h2>Transparent Incident History &amp; Community Archives</h2>
          <p>
            Stay updated on past reports and verified resolutions across your neighborhoods. Transparency builds
            trust and empowers citizens to protect one another.
          </p>
        </div>

        <div className="community-cta-box">
          <div className="community-cta-inner">
            <History size={36} className="community-icon" />
            <div className="community-cta-text">
              <h3>Track Reported Incidents Over Time</h3>
              <p>
                Browse chronological records of submitted hazards, review verified updates, and monitor neighborhood
                safety trends with complete visibility.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary-glow"
              onClick={() => onNavigate('history')}
            >
              <span>View Incident History</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 7. PROFESSIONAL FOOTER */}
      <footer className="home-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <SafeRouteLogo size={36} />
              <div className="footer-brand-text">
                <span className="brand-name">SAFEROUTE</span>
                <span className="brand-tagline">Safer Paths. Brighter Tomorrows.</span>
              </div>
            </div>
            <p className="footer-mission">
              Smart Public Safety &amp; Emergency Assistance Platform. Combining real-time risk intelligence,
              verified incident reporting, and rapid emergency services.
            </p>
          </div>

          <div className="footer-nav-col">
            <h4>Platform</h4>
            <ul>
              <li>
                <button type="button" onClick={() => onNavigate('home')}>
                  Home
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('safe-route')}>
                  Safe Route &amp; Maps
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('report')}>
                  Report Incident
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('history')}>
                  Incident History
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('admin')}>
                  Admin &amp; Analytics
                </button>
              </li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4>Emergency Dispatch</h4>
            <ul>
              <li>
                <a href="tel:100">Police (100)</a>
              </li>
              <li>
                <a href="tel:108">Ambulance (108)</a>
              </li>
              <li>
                <a href="tel:101">Fire &amp; Rescue (101)</a>
              </li>
              <li>
                <a href="tel:1091">Women Helpline (1091)</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} SafeRoute Platform. Smart Public Safety &amp; Emergency Assistance.</p>
          <p className="footer-note">All data verified by community reporting &amp; municipal emergency services.</p>
        </div>
      </footer>
    </main>
  )
}
