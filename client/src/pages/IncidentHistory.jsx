/* oxlint-disable react(set-state-in-effect) */
import { useEffect, useState } from 'react';
import IncidentReport from './IncidentReport';
import SafeRouteLogo from '../components/SafeRouteLogo';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

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
  const { user, token, isAuthenticated } = useAuth();
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

    if (!isAuthenticated || !user?.id) {
      setIncidents([]);
      setIsLoading(false);
      return undefined;
    }

    const loadIncidents = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/incidents/user/${user.id}`,
          {
            headers,
            cache: 'no-store',
          },
        );

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
        console.error('Incident fetch error:', error.message);
        setErrorMessage(
          'Unable to load your incident history. Please try again.',
        );
        setIsLoading(false);
      }
    };

    loadIncidents();
    return undefined;
  }, [isReportPage, refreshKey, isAuthenticated, user?.id, token]);

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
          --history-background: var(--color-background);
          --history-surface: rgb(var(--color-surface-rgb) / 0.78);
          --history-surface-light: rgb(var(--color-surface-elevated-rgb) / 0.72);
          --history-line: rgb(var(--color-accent-soft-rgb) / 0.14);
          --history-line-strong: rgb(var(--color-accent-rgb) / 0.48);
          --history-white: var(--color-text-heading);
          --history-lavender: var(--color-text-subtle);
          --history-muted: var(--color-text-muted);
          --history-faint: var(--color-text-muted);
          --history-mauve: var(--color-accent);
          --history-primary: var(--color-accent);
          width: 100%;
          min-height: 100vh;
          padding: 48px clamp(18px, 5vw, 78px) 68px;
          color: var(--history-white);
          background:
            radial-gradient(circle at 91% 7%, rgb(var(--color-primary-light-rgb) / 0.18), transparent 28rem),
            radial-gradient(circle at 5% 92%, rgb(var(--color-mauve-rgb) / 0.1), transparent 28rem),
            linear-gradient(125deg, var(--color-background) 0%, var(--color-surface) 48%, var(--color-surface) 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          box-sizing: border-box;
        }

        [data-theme="light"] .incident-history-page {
          --history-background: var(--color-background);
          --history-surface: rgba(255, 255, 255, 0.92);
          --history-surface-light: rgba(241, 245, 249, 0.92);
          --history-line: rgb(var(--color-primary-light-rgb) / 0.22);
          --history-line-strong: rgb(var(--color-primary-light-rgb) / 0.45);
          --history-white: var(--color-text);
          --history-lavender: var(--color-text-subtle);
          --history-muted: var(--color-text-muted);
          --history-faint: var(--color-text-muted);
          --history-mauve: var(--color-accent);
          --history-primary: var(--color-primary-light);
          background:
            radial-gradient(circle at 91% 7%, rgb(var(--color-primary-light-rgb) / 0.06), transparent 28rem),
            radial-gradient(circle at 5% 92%, rgb(var(--color-mauve-rgb) / 0.05), transparent 28rem),
            linear-gradient(125deg, var(--color-background) 0%, var(--color-surface-elevated) 48%, #ffffff 100%);
          color: var(--history-white);
        }

        [data-theme="light"] .incident-history-card {
          background: rgba(255, 255, 255, 0.94);
          border-color: rgb(var(--color-primary-light-rgb) / 0.22);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
        }

        [data-theme="light"] .incident-history-filter-btn {
          background: var(--color-surface-elevated);
          border-color: rgb(var(--color-primary-light-rgb) / 0.25);
          color: var(--color-text-subtle);
        }

        [data-theme="light"] .incident-history-filter-btn.active {
          background: rgb(var(--color-primary-light-rgb) / 0.1);
          border-color: rgb(var(--color-primary-light-rgb) / 0.45);
          color: var(--color-primary);
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
          color: var(--color-accent-soft);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .incident-history-eyebrow-mark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--history-mauve), var(--history-primary));
          box-shadow: 0 0 18px rgb(var(--color-mauve-rgb) / 0.8);
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
          background: rgb(var(--color-accent-soft-rgb) / 0.12);
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.3);
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
          background: linear-gradient(135deg, rgb(var(--color-accent-rgb) / 0.2), rgb(var(--color-accent-soft-rgb) / 0.18));
          cursor: pointer;
          font: inherit;
          font-size: 0.83rem;
          font-weight: 750;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }

        .incident-history-nav-link {
          color: var(--color-text-subtle);
          background: rgb(var(--color-primary-light-rgb) / 0.1);
          text-decoration: none;
        }

        .incident-history-nav-link:hover,
        .incident-history-refresh:hover:not(:disabled) {
          border-color: var(--color-accent-soft);
          background: linear-gradient(135deg, rgb(var(--color-accent-rgb) / 0.32), rgb(var(--color-accent-soft-rgb) / 0.3));
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
          border-color: rgb(var(--color-accent-soft-rgb) / 0.35);
          color: var(--color-accent-soft);
        }

        .incident-history-retry {
          margin-top: 18px;
          border: 0;
          border-radius: 9px;
          padding: 10px 15px;
          color: var(--history-white);
          background: rgb(var(--color-mauve-rgb) / 0.2);
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
            linear-gradient(145deg, rgb(var(--color-background-rgb) / 0.74), rgb(var(--color-background-rgb) / 0.9)),
            var(--history-surface);
          box-shadow: 0 18px 45px rgb(var(--color-background-rgb) / 0.2);
          transition: border-color 180ms ease, transform 180ms ease;
        }

        .incident-history-card:hover {
          border-color: rgb(var(--color-accent-soft-rgb) / 0.38);
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
          color: var(--color-accent-soft);
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
          border-color: rgb(var(--color-accent-rgb) / 0.3);
          color: var(--color-accent);
          background: rgb(var(--color-accent-rgb) / 0.12);
        }

        .incident-history-status-verified {
          border-color: rgb(var(--color-primary-light-rgb) / 0.3);
          color: var(--color-primary-light);
          background: rgb(var(--color-primary-light-rgb) / 0.12);
        }

        .incident-history-status-rejected {
          border-color: rgb(var(--color-accent-soft-rgb) / 0.3);
          color: var(--color-accent-soft);
          background: rgb(var(--color-accent-soft-rgb) / 0.12);
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
          border-top: 1px solid rgb(var(--color-accent-soft-rgb) / 0.1);
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

        .incident-history-severity-low {
          color: var(--color-primary-light);
        }

        .incident-history-severity-medium {
          color: var(--color-accent);
        }

        .incident-history-severity-high {
          color: var(--color-accent-soft);
        }

        @media (max-width: 760px) {
          .incident-history-page {
            padding-top: 32px;
          }

          .incident-history-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .incident-history-actions {
            width: 100%;
            flex-direction: column;
          }

          .incident-history-nav-link,
          .incident-history-refresh {
            width: 100%;
            justify-content: center;
          }

          .incident-history-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .incident-history-page {
            padding-right: 14px;
            padding-left: 14px;
          }

          .incident-history-card {
            padding: 19px;
          }

          .incident-history-card-meta {
            flex-direction: column;
          }
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
                <span
                  className="incident-history-eyebrow-mark"
                  aria-hidden="true"
                />
                SafeRoute / Activity Log
              </div>

              <h1 className="incident-history-title">Incident History</h1>

              <p className="incident-history-intro">
                View the incidents you have previously reported and keep track
                of their review status in one place.
              </p>
            </div>
          </div>

          <div className="incident-history-actions">
            <button
              type="button"
              className="incident-history-nav-link"
              onClick={() =>
                onNavigate
                  ? onNavigate('report')
                  : (window.location.hash = 'incident-report')
              }
              style={{
                background: 'none',
                border: '1px solid var(--history-line-strong)',
                cursor: 'pointer',
              }}
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

        {isAuthenticated && user ? (
          <div
            className="incident-history-detail-value"
            style={{
              marginBottom: '18px',
              color: 'var(--color-accent-soft)',
            }}
          >
            Reporting citizen: <strong>{user.name}</strong> ({user.email})
            &bull; Loaded incidents: {incidents.length}
          </div>
        ) : null}

        {isLoading && (
          <div className="incident-history-message" role="status">
            <strong>Loading your incident history</strong>
            Please wait while we retrieve your reported incidents.
          </div>
        )}

        {!isLoading && !isAuthenticated && (
          <div className="incident-history-message" role="status">
            <strong>Citizen Sign-In Required</strong>
            Please sign in to view your verified incident history.

            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="incident-history-retry"
                style={{
                  background:
                    'linear-gradient(135deg, var(--color-accent), var(--color-primary-light))',
                  color: '#ffffff',
                  border: 'none',
                }}
                onClick={() => onNavigate && onNavigate('login')}
              >
                Sign In to SafeRoute
              </button>
            </div>
          </div>
        )}

        {!isLoading && isAuthenticated && errorMessage && (
          <div
            className="incident-history-message incident-history-error"
            role="alert"
          >
            <strong>We couldn&apos;t load your incidents</strong>
            Unable to load your incident history. Please try again.
            <br />

            <button
              className="incident-history-retry"
              type="button"
              onClick={handleRefresh}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading &&
          isAuthenticated &&
          !errorMessage &&
          incidents.length === 0 && (
            <div
              className="incident-history-message incident-history-empty"
            >
              <strong>No history available for now</strong>
              You haven&apos;t reported any incidents yet.
            </div>
          )}

        {!isLoading &&
          !errorMessage &&
          incidents.length > 0 && (
            <section
              className="incident-history-grid"
              aria-label="Previously reported incidents"
            >
              {incidents.map((incident) => {
                const status = getStatusClass(incident.status);
                const severity = getSeverityClass(incident.severity);

                const location =
                  incident.address ||
                  (incident.latitude && incident.longitude
                    ? `${incident.latitude}, ${incident.longitude}`
                    : 'Location unavailable');

                return (
                  <article
                    className="incident-history-card"
                    key={incident.id}
                  >
                    <div className="incident-history-card-top">
                      <span className="incident-history-id">
                        Incident #{incident.id}
                      </span>

                      <span
                        className={`incident-history-badge incident-history-status-${status}`}
                      >
                        {incident.status || 'Pending'}
                      </span>
                    </div>

                    <h2 className="incident-history-category">
                      {incident.category || 'Uncategorized incident'}
                    </h2>

                    <p className="incident-history-description">
                      {incident.description || 'No description provided.'}
                    </p>

                    <div className="incident-history-card-meta">
                      <div className="incident-history-detail">
                        <span className="incident-history-detail-label">
                          Severity
                        </span>

                        <strong
                          className={`incident-history-detail-value incident-history-severity-${severity}`}
                        >
                          {incident.severity || 'Medium'}
                        </strong>
                      </div>

                      <div className="incident-history-detail">
                        <span className="incident-history-detail-label">
                          Location
                        </span>

                        <span className="incident-history-detail-value">
                          {location}
                        </span>
                      </div>

                      <div className="incident-history-detail">
                        <span className="incident-history-detail-label">
                          Reported
                        </span>

                        <span className="incident-history-detail-value">
                          {formatDate(incident.created_at)}
                        </span>
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