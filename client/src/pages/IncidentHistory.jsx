/* oxlint-disable react(set-state-in-effect) */
import { useEffect, useState } from 'react';
import IncidentReport from './IncidentReport';
import SafeRouteLogo from '../components/SafeRouteLogo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const INCIDENTS_URL = `${API_BASE_URL}/api/incidents/user/1`;
const INCIDENT_REPORT_HASH = '#incident-report';

function formatDate(dateValue) {
  if (!dateValue) {
    return 'Date unavailable';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getStatusClass(status) {
  return String(status || 'Pending').toLowerCase();
}

function getSeverityClass(severity) {
  return String(severity || 'Medium').toLowerCase();
}

function IncidentHistory({ onNavigate }) {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isReportPage, setIsReportPage] = useState(
    () => window.location.hash === INCIDENT_REPORT_HASH,
  );

  useEffect(() => {
    const handleHashChange = () => {
      setIsReportPage(window.location.hash === INCIDENT_REPORT_HASH);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isReportPage) {
      return undefined;
    }

    const loadIncidents = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const response = await fetch(INCIDENTS_URL);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch incidents');
        }

        if (!Array.isArray(data.incidents)) {
          throw new Error('API did not return an incidents array');
        }

        setIncidents(data.incidents);
        setIsLoading(false);
      } catch (error) {
        console.error("Incident fetch error:", error.message);
        setErrorMessage('Unable to load your incident history. Please try again.');
        setIsLoading(false);
      }
    };

    loadIncidents();
    return undefined;
  }, [isReportPage, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  if (isReportPage) {
    return <IncidentReport onNavigate={onNavigate} />;
  }

  return (
    <main className="incident-history-page">
      <style>{`
        .incident-history-page {
          --history-background: #080713;
          --history-surface: rgba(24, 18, 42, 0.78);
          --history-surface-light: rgba(39, 27, 63, 0.72);
          --history-line: rgba(222, 193, 255, 0.14);
          --history-line-strong: rgba(226, 127, 255, 0.48);
          --history-white: #fbf8ff;
          --history-lavender: #dcd0ec;
          --history-muted: #a398b9;
          --history-faint: #756986;
          --history-pink: #ef70bd;
          --history-violet: #9b6cff;
          width: 100%;
          min-height: 100vh;
          padding: 48px clamp(18px, 5vw, 78px) 68px;
          color: var(--history-white);
          background:
            radial-gradient(circle at 91% 7%, rgba(156, 92, 255, 0.18), transparent 28rem),
            radial-gradient(circle at 5% 92%, rgba(235, 81, 169, 0.1), transparent 28rem),
            linear-gradient(125deg, #080713 0%, #0d0a1c 48%, #100b20 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-sizing: border-box;
        }

        .incident-history-page *,
        .incident-history-page *::before,
        .incident-history-page *::after {
          box-sizing: border-box;
        }

        .incident-history-shell {
          position: relative;
          z-index: 1;
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .incident-history-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 28px;
          margin-bottom: 34px;
        }

        .incident-history-eyebrow {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 16px;
          color: #d795f5;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .incident-history-eyebrow-mark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--history-pink), var(--history-violet));
          box-shadow: 0 0 18px rgba(239, 112, 189, 0.8);
        }

        .incident-history-brand-wrap {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .incident-history-logo-box {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(185, 155, 255, 0.12);
          border: 1px solid rgba(185, 155, 255, 0.3);
          flex-shrink: 0;
          margin-top: 4px;
        }

        .incident-history-title {
          max-width: 700px;
          margin: 0;
          color: var(--history-white);
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: clamp(2.2rem, 5vw, 4.4rem);
          font-weight: 760;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }

        .incident-history-intro {
          max-width: 590px;
          margin: 18px 0 0;
          color: var(--history-muted);
          font-size: 1rem;
          line-height: 1.7;
        }

        .incident-history-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex: 0 0 auto;
        }

        .incident-history-nav-link,
        .incident-history-refresh {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          flex: 0 0 auto;
          border: 1px solid var(--history-line-strong);
          border-radius: 12px;
          padding: 13px 17px;
          color: var(--history-white);
          background: linear-gradient(135deg, rgba(222, 105, 209, 0.2), rgba(132, 92, 255, 0.18));
          cursor: pointer;
          font: inherit;
          font-size: 0.83rem;
          font-weight: 750;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }

        .incident-history-nav-link {
          color: #edc9ff;
          background: rgba(155, 108, 255, 0.1);
          text-decoration: none;
        }

        .incident-history-nav-link:hover,
        .incident-history-refresh:hover:not(:disabled) {
          border-color: #e9a1ff;
          background: linear-gradient(135deg, rgba(222, 105, 209, 0.32), rgba(132, 92, 255, 0.3));
          transform: translateY(-2px);
        }

        .incident-history-refresh:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .incident-history-message {
          border: 1px solid var(--history-line);
          border-radius: 18px;
          padding: 36px 24px;
          color: var(--history-muted);
          background: var(--history-surface);
          text-align: center;
        }

        .incident-history-message strong {
          display: block;
          margin-bottom: 8px;
          color: var(--history-white);
          font-size: 1.1rem;
        }

        .incident-history-error {
          border-color: rgba(255, 126, 174, 0.35);
          color: #f4b8d2;
        }

        .incident-history-retry {
          margin-top: 18px;
          border: 0;
          border-radius: 9px;
          padding: 10px 15px;
          color: var(--history-white);
          background: rgba(239, 112, 189, 0.2);
          cursor: pointer;
          font: inherit;
          font-weight: 700;
        }

        .incident-history-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .incident-history-card {
          min-width: 0;
          border: 1px solid var(--history-line);
          border-radius: 18px;
          padding: 23px;
          background:
            linear-gradient(145deg, rgba(44, 27, 67, 0.74), rgba(18, 14, 34, 0.9)),
            var(--history-surface);
          box-shadow: 0 18px 45px rgba(3, 2, 12, 0.2);
          transition: border-color 180ms ease, transform 180ms ease;
        }

        .incident-history-card:hover {
          border-color: rgba(217, 126, 255, 0.38);
          transform: translateY(-3px);
        }

        .incident-history-card-top,
        .incident-history-card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .incident-history-card-top {
          margin-bottom: 22px;
        }

        .incident-history-id {
          color: #cbb7e3;
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .incident-history-badge {
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .incident-history-status-pending {
          border-color: rgba(255, 203, 117, 0.3);
          color: #ffd990;
          background: rgba(255, 183, 77, 0.12);
        }

        .incident-history-status-verified {
          border-color: rgba(118, 232, 190, 0.3);
          color: #9af0c8;
          background: rgba(80, 208, 155, 0.12);
        }

        .incident-history-status-rejected {
          border-color: rgba(255, 126, 174, 0.3);
          color: #ffabc9;
          background: rgba(239, 93, 145, 0.12);
        }

        .incident-history-category {
          margin: 0 0 11px;
          color: var(--history-white);
          font-size: 1.35rem;
          letter-spacing: -0.025em;
        }

        .incident-history-description {
          min-height: 52px;
          margin: 0 0 21px;
          color: var(--history-lavender);
          line-height: 1.6;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .incident-history-card-meta {
          align-items: flex-start;
          border-top: 1px solid rgba(222, 193, 255, 0.1);
          padding-top: 17px;
        }

        .incident-history-detail {
          min-width: 0;
        }

        .incident-history-detail-label {
          display: block;
          margin-bottom: 6px;
          color: var(--history-faint);
          font-size: 0.67rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .incident-history-detail-value {
          display: block;
          color: var(--history-lavender);
          font-size: 0.86rem;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .incident-history-severity-low { color: #91e3bd; }
        .incident-history-severity-medium { color: #ffd17d; }
        .incident-history-severity-high { color: #ff8eaf; }

        @media (max-width: 760px) {
          .incident-history-page { padding-top: 32px; }
          .incident-history-header { align-items: flex-start; flex-direction: column; }
          .incident-history-actions { width: 100%; flex-direction: column; }
          .incident-history-nav-link,
          .incident-history-refresh { width: 100%; justify-content: center; }
          .incident-history-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .incident-history-page { padding-right: 14px; padding-left: 14px; }
          .incident-history-card { padding: 19px; }
          .incident-history-card-meta { flex-direction: column; }
        }
      `}</style>

      <div className="incident-history-shell">
        <header className="incident-history-header">
          <div className="incident-history-brand-wrap">
            <div className="incident-history-logo-box">
              <SafeRouteLogo size={30} />
            </div>
            <div>
              <div className="incident-history-eyebrow">
                <span className="incident-history-eyebrow-mark" aria-hidden="true" />
                SafeRoute / Activity Log
              </div>
              <h1 className="incident-history-title">Incident History</h1>
              <p className="incident-history-intro">
                View the incidents you have previously reported and keep track of their
                review status in one place.
              </p>
            </div>
          </div>

          <div className="incident-history-actions">
            <button
              type="button"
              className="incident-history-nav-link"
              onClick={() => (onNavigate ? onNavigate('report') : (window.location.hash = 'incident-report'))}
              style={{ background: 'none', border: '1px solid var(--history-line-strong)', cursor: 'pointer' }}
            >
              Report New Incident <span aria-hidden="true">→</span>
            </button>
            <button
              className="incident-history-refresh"
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <span aria-hidden="true">↻</span>
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="incident-history-detail-value" style={{ marginBottom: '18px' }}>
          Loaded incidents: {incidents.length}
        </div>

        {isLoading && (
          <div className="incident-history-message" role="status">
            <strong>Loading your incident history</strong>
            Please wait while we retrieve your reported incidents.
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="incident-history-message incident-history-error" role="alert">
            <strong>We couldn&apos;t load your incidents</strong>
            Unable to load your incident history. Please try again.
            <br />
            <button className="incident-history-retry" type="button" onClick={handleRefresh}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && incidents.length === 0 && (
          <div className="incident-history-message incident-history-empty">
            <strong>No history available for now</strong>
            You haven&apos;t reported any incidents yet.
          </div>
        )}

        {!isLoading && !errorMessage && incidents.length > 0 && (
          <section className="incident-history-grid" aria-label="Previously reported incidents">
            {incidents.map((incident) => {
              const status = getStatusClass(incident.status);
              const severity = getSeverityClass(incident.severity);
              const location = incident.address
                || (incident.latitude && incident.longitude
                  ? `${incident.latitude}, ${incident.longitude}`
                  : 'Location unavailable');

              return (
                <article className="incident-history-card" key={incident.id}>
                  <div className="incident-history-card-top">
                    <span className="incident-history-id">Incident #{incident.id}</span>
                    <span className={`incident-history-badge incident-history-status-${status}`}>
                      {incident.status || 'Pending'}
                    </span>
                  </div>

                  <h2 className="incident-history-category">{incident.category || 'Uncategorized incident'}</h2>
                  <p className="incident-history-description">
                    {incident.description || 'No description provided.'}
                  </p>

                  <div className="incident-history-card-meta">
                    <div className="incident-history-detail">
                      <span className="incident-history-detail-label">Severity</span>
                      <strong className={`incident-history-detail-value incident-history-severity-${severity}`}>
                        {incident.severity || 'Medium'}
                      </strong>
                    </div>
                    <div className="incident-history-detail">
                      <span className="incident-history-detail-label">Location</span>
                      <span className="incident-history-detail-value">{location}</span>
                    </div>
                    <div className="incident-history-detail">
                      <span className="incident-history-detail-label">Reported</span>
                      <span className="incident-history-detail-value">{formatDate(incident.created_at)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default IncidentHistory;
