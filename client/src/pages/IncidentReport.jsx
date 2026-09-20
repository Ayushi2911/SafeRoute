import { useState } from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import SafeRouteLogo from '../components/SafeRouteLogo';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const categories = [
  'Theft',
  'Harassment',
  'Accident',
  'Medical Emergency',
  'Fire',
  'Suspicious Activity',
  'Unsafe Area',
  'Other',
];

const severityOptions = [
  {
    value: 'low',
    label: 'LOW',
    description: 'Low concern',
    tone: 'low',
  },
  {
    value: 'medium',
    label: 'MEDIUM',
    description: 'Needs attention',
    tone: 'medium',
  },
  {
    value: 'high',
    label: 'HIGH',
    description: 'Immediate safety concern',
    tone: 'high',
  },
];

function IncidentReport({ onNavigate }) {
  const { user, token, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    category: '',
    severity: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Location not added');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cursor, setCursor] = useState({ x: -500, y: -500 });

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  };

  const handleMouseMove = (event) => {
    setCursor({ x: event.clientX, y: event.clientY });
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Locating your position...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setForm((current) => ({
          ...current,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }));
        setLocationStatus(`Captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setMessage('');
      },
      (error) => {
        setLocationStatus(`Location error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please upload a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be 5MB or smaller.');
      return;
    }

    setSelectedImage(file);
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (!isAuthenticated || !user?.id) {
      setMessage('Citizen authentication required: Please sign in or register to submit a verified report.');
      return;
    }

    if (!form.category) {
      setMessage('Please select an incident category.');
      return;
    }

    if (!form.severity) {
      setMessage('Please choose a severity level.');
      return;
    }

    if (!form.description.trim()) {
      setMessage('Please provide a brief description of the incident.');
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    if (
      !form.latitude ||
      !form.longitude ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setMessage('Please use a valid location before submitting the report.');
      return;
    }

    const formData = new FormData();
    formData.append('user_id', String(user.id));
    formData.append('category', form.category);
    formData.append('severity', form.severity);
    formData.append('description', form.description.trim());
    formData.append('latitude', form.latitude);
    formData.append('longitude', form.longitude);
    formData.append('address', form.address.trim());

    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const apiBaseUrl = API_BASE_URL;
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/api/incidents`, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Unable to submit incident report.');
      }

      setMessage(data.message || 'Incident reported successfully.');
      setForm({
        category: '',
        severity: '',
        description: '',
        address: '',
        latitude: '',
        longitude: '',
      });
      setSelectedImage(null);
      setLocationStatus('Location not added');
      formElement.reset();
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the incident reporting server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="incident-page"
      onMouseMove={handleMouseMove}
      style={{ '--incident-cursor-x': `${cursor.x}px`, '--incident-cursor-y': `${cursor.y}px` }}
    >
      <style>{`
        .incident-page {
          --incident-background: var(--color-background);
          --incident-surface: rgb(var(--color-surface-rgb) / 0.78);
          --incident-surface-light: rgb(var(--color-surface-elevated-rgb) / 0.72);
          --incident-line: rgb(var(--color-accent-soft-rgb) / 0.14);
          --incident-line-strong: rgb(var(--color-accent-rgb) / 0.48);
          --incident-white: var(--color-text-heading);
          --incident-lavender: var(--color-text-subtle);
          --incident-muted: var(--color-text-muted);
          --incident-faint: var(--color-text-muted);
          --incident-mauve: var(--color-accent);
          --incident-primary: var(--color-accent);
          --incident-teal: var(--color-teal);
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
          box-sizing: border-box;
          padding: 48px clamp(18px, 5vw, 78px) 68px;
          color: var(--incident-white);
          background:
            radial-gradient(circle at 91% 7%, rgb(var(--color-primary-light-rgb) / 0.18), transparent 28rem),
            radial-gradient(circle at 5% 92%, rgb(var(--color-mauve-rgb) / 0.1), transparent 28rem),
            linear-gradient(125deg, var(--color-background) 0%, var(--color-surface) 48%, var(--color-surface) 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        [data-theme="light"] .incident-page {
          --incident-background: var(--color-background);
          --incident-surface: rgba(255, 255, 255, 0.92);
          --incident-surface-light: rgba(241, 245, 249, 0.92);
          --incident-line: rgb(var(--color-primary-light-rgb) / 0.22);
          --incident-line-strong: rgb(var(--color-primary-light-rgb) / 0.45);
          --incident-white: var(--color-text);
          --incident-lavender: var(--color-text-subtle);
          --incident-muted: var(--color-text-muted);
          --incident-faint: var(--color-text-muted);
          --incident-mauve: var(--color-accent);
          --incident-primary: var(--color-primary-light);
          --incident-teal: var(--color-teal-dark);
          background:
            radial-gradient(circle at 91% 7%, rgb(var(--color-primary-light-rgb) / 0.06), transparent 28rem),
            radial-gradient(circle at 5% 92%, rgb(var(--color-mauve-rgb) / 0.05), transparent 28rem),
            linear-gradient(125deg, var(--color-background) 0%, var(--color-surface-elevated) 48%, #ffffff 100%);
          color: var(--incident-white);
        }

        [data-theme="light"] .incident-status {
          background: rgba(255, 255, 255, 0.9);
          color: var(--color-text);
        }

        [data-theme="light"] .incident-card {
          background: rgba(255, 255, 255, 0.94);
          border-color: rgb(var(--color-primary-light-rgb) / 0.22);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
          color: var(--color-text);
        }

        [data-theme="light"] .incident-input,
        [data-theme="light"] .incident-select,
        [data-theme="light"] .incident-textarea {
          background: var(--color-input);
          border-color: var(--color-text-subtle);
          color: var(--color-text-primary);
        }

        [data-theme="light"] .incident-input::placeholder,
        [data-theme="light"] .incident-textarea::placeholder {
          color: var(--color-text-muted);
        }

        [data-theme="light"] .incident-severity {
          background: var(--color-input);
          border-color: rgb(var(--color-primary-light-rgb) / 0.25);
          color: var(--color-text);
        }

        [data-theme="light"] .incident-label,
        [data-theme="light"] .incident-card-title,
        [data-theme="light"] .incident-intro,
        [data-theme="light"] .incident-upload-title,
        [data-theme="light"] .incident-guideline-heading,
        [data-theme="light"] .incident-guideline-note,
        [data-theme="light"] .incident-severity-name {
          color: var(--color-text);
        }

        [data-theme="light"] .incident-severity-description,
        [data-theme="light"] .incident-upload-copy,
        [data-theme="light"] .incident-location-status,
        [data-theme="light"] .incident-privacy,
        [data-theme="light"] .incident-guideline,
        [data-theme="light"] .incident-message {
          color: var(--color-text-muted);
        }

        [data-theme="light"] .incident-button:not(.incident-submit-button):hover,
        [data-theme="light"] .incident-severity:hover,
        [data-theme="light"] .incident-upload:hover {
          color: var(--color-text);
        }

        .incident-page *,
        .incident-page *::before,
        .incident-page *::after {
          box-sizing: border-box;
        }

        .incident-page::before {
          position: fixed;
          z-index: 0;
          top: var(--incident-cursor-y);
          left: var(--incident-cursor-x);
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgb(var(--color-accent-soft-rgb) / 0.105), rgb(var(--color-accent-soft-rgb) / 0.04) 38%, transparent 70%);
          content: "";
          pointer-events: none;
          transform: translate(-50%, -50%);
          transition: top 90ms ease-out, left 90ms ease-out;
        }

        .incident-shell {
          position: relative;
          z-index: 1;
          width: min(1190px, 100%);
          margin: 0 auto;
        }

        .incident-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 36px;
          margin-bottom: 36px;
          animation: incident-rise 500ms ease both;
        }

        .incident-eyebrow,
        .incident-kicker {
          display: flex;
          align-items: center;
          gap: 9px;
          color: var(--color-accent-soft);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.17em;
          text-transform: uppercase;
        }

        .incident-eyebrow-mark {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--incident-mauve);
          box-shadow: 0 0 0 5px rgb(var(--color-mauve-rgb) / 0.12), 0 0 18px rgb(var(--color-mauve-rgb) / 0.8);
        }

        .incident-brand-wrap {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .incident-logo-box {
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

        .incident-title {
          margin: 15px 0 11px;
          color: var(--incident-white);
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-size: clamp(2.35rem, 5vw, 4.05rem);
          font-weight: 760;
          letter-spacing: -0.04em;
          line-height: 1.05;
        }

        .incident-intro {
          max-width: 625px;
          margin: 0;
          color: var(--incident-muted);
          font-size: 0.98rem;
          line-height: 1.7;
        }

        .incident-status {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 225px;
          padding: 15px 17px;
          border: 1px solid var(--incident-line);
          border-radius: 15px;
          background: rgb(var(--color-background-rgb) / 0.7);
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.05), 0 14px 32px rgba(0, 0, 0, 0.15);
        }

        .incident-status-icon {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border: 1px solid rgb(var(--color-mauve-rgb) / 0.3);
          border-radius: 11px;
          color: var(--color-accent-soft);
          background: linear-gradient(145deg, rgb(var(--color-mauve-rgb) / 0.2), rgb(var(--color-primary-light-rgb) / 0.13));
          font-size: 1rem;
        }

        .incident-status strong,
        .incident-status span {
          display: block;
        }

        .incident-status strong {
          margin-bottom: 4px;
          font-size: 0.76rem;
          font-weight: 760;
        }

        .incident-status span {
          color: var(--incident-muted);
          font-size: 0.67rem;
        }

        .incident-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
          padding: 0 16px;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.38);
          border-radius: 11px;
          color: var(--color-text-subtle);
          background: rgb(var(--color-primary-light-rgb) / 0.1);
          font-size: 0.72rem;
          font-weight: 760;
          text-decoration: none;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .incident-nav-link:hover {
          border-color: var(--color-accent-soft);
          background: rgb(var(--color-accent-rgb) / 0.2);
          box-shadow: 0 8px 22px rgb(var(--color-primary-light-rgb) / 0.2);
          transform: translateY(-2px);
        }

        .incident-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.06fr) minmax(0, 0.94fr);
          gap: 18px;
        }

        .incident-card {
          border: 1px solid var(--incident-line);
          border-radius: 21px;
          background:
            linear-gradient(145deg, rgb(var(--color-background-rgb) / 0.73), rgb(var(--color-background-rgb) / 0.86)),
            var(--incident-surface);
          box-shadow: 0 25px 65px rgba(0, 0, 0, 0.22), inset 0 1px rgba(255, 255, 255, 0.045);
          transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
        }

        .incident-card:hover {
          border-color: rgb(var(--color-accent-soft-rgb) / 0.27);
          box-shadow: 0 29px 72px rgba(0, 0, 0, 0.3), 0 0 28px rgb(var(--color-accent-soft-rgb) / 0.06), inset 0 1px rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }

        .incident-form-card {
          min-height: 495px;
          padding: clamp(23px, 3vw, 34px);
          animation: incident-rise 600ms 80ms ease both;
        }

        .incident-location-card {
          min-height: 495px;
          padding: clamp(23px, 3vw, 34px);
          animation: incident-rise 600ms 160ms ease both;
        }

        .incident-kicker {
          color: var(--color-accent-soft);
          font-size: 0.65rem;
        }

        .incident-card-title {
          margin: 9px 0 28px;
          color: var(--incident-white);
          font-size: 1.38rem;
          font-weight: 720;
          letter-spacing: -0.035em;
        }

        .incident-field {
          margin: 0 0 25px;
        }

        .incident-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 10px;
          color: var(--incident-lavender);
          font-size: 0.76rem;
          font-weight: 720;
        }

        .incident-required {
          color: var(--color-accent-soft);
          font-size: 0.63rem;
          font-weight: 650;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .incident-input,
        .incident-select,
        .incident-textarea {
          width: 100%;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.17);
          border-radius: 11px;
          outline: none;
          color: var(--incident-white);
          background: rgb(var(--color-background-rgb) / 0.65);
          font: inherit;
          transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .incident-input,
        .incident-select {
          height: 50px;
          padding: 0 15px;
        }

        .incident-select {
          appearance: none;
          padding-right: 42px;
          cursor: pointer;
        }

        .incident-select-wrap {
          position: relative;
        }

        .incident-select-wrap::after {
          position: absolute;
          top: 50%;
          right: 16px;
          color: var(--color-accent-soft);
          content: "⌄";
          pointer-events: none;
          transform: translateY(-55%);
        }

        .incident-textarea {
          display: block;
          min-height: 154px;
          padding: 14px 15px;
          resize: vertical;
          line-height: 1.6;
        }

        .incident-input::placeholder,
        .incident-textarea::placeholder {
          color: var(--color-accent);
        }

        .incident-input:hover,
        .incident-select:hover,
        .incident-textarea:hover {
          border-color: rgb(var(--color-accent-soft-rgb) / 0.4);
          background: rgb(var(--color-background-rgb) / 0.8);
        }

        .incident-input:focus,
        .incident-select:focus,
        .incident-textarea:focus,
        .incident-button:focus-visible,
        .incident-severity:focus-visible,
        .incident-upload:focus-within {
          border-color: var(--color-accent-soft);
          box-shadow: 0 0 0 3px rgb(var(--color-accent-soft-rgb) / 0.15), 0 0 22px rgb(var(--color-accent-soft-rgb) / 0.1);
        }

        .incident-severity-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .incident-severity {
          min-height: 91px;
          padding: 14px 12px;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.15);
          border-radius: 12px;
          outline: none;
          color: var(--incident-white);
          text-align: left;
          background: rgb(var(--color-background-rgb) / 0.42);
          cursor: pointer;
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }

        .incident-severity:hover {
          border-color: rgb(var(--color-accent-soft-rgb) / 0.48);
          background: rgb(var(--color-background-rgb) / 0.72);
          transform: translateY(-3px);
        }

        .incident-severity.is-selected {
          border-color: var(--color-accent-soft);
          background: linear-gradient(145deg, rgb(var(--color-accent-rgb) / 0.36), rgb(var(--color-accent-rgb) / 0.75));
          box-shadow: 0 0 0 1px rgb(var(--color-accent-soft-rgb) / 0.15), 0 9px 28px rgb(var(--color-accent-soft-rgb) / 0.19);
          transform: translateY(-3px);
        }

        .incident-severity-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .incident-severity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .incident-severity-low .incident-severity-dot { background: var(--color-teal); box-shadow: 0 0 12px var(--color-teal); }
        .incident-severity-medium .incident-severity-dot { background: var(--color-accent-soft); box-shadow: 0 0 12px var(--color-accent-soft); }
        .incident-severity-high .incident-severity-dot { background: var(--color-accent-soft); box-shadow: 0 0 12px var(--color-accent-soft); }

        .incident-selected-mark {
          display: grid;
          width: 17px;
          height: 17px;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 50%;
          color: white;
          font-size: 0.63rem;
          opacity: 0;
        }

        .incident-severity.is-selected .incident-selected-mark {
          border-color: var(--color-accent-soft);
          background: linear-gradient(135deg, var(--incident-mauve), var(--incident-primary));
          opacity: 1;
        }

        .incident-severity-name,
        .incident-severity-description {
          display: block;
        }

        .incident-severity-name {
          margin-bottom: 5px;
          font-size: 0.73rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .incident-severity-description {
          color: var(--incident-muted);
          font-size: 0.68rem;
        }

        .incident-address-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 9px;
        }

        .incident-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
          padding: 0 16px;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.38);
          border-radius: 11px;
          color: var(--color-text-subtle);
          background: rgb(var(--color-primary-light-rgb) / 0.1);
          font: inherit;
          font-size: 0.72rem;
          font-weight: 760;
          cursor: pointer;
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
        }

        .incident-button:hover {
          border-color: var(--color-accent-soft);
          background: rgb(var(--color-accent-rgb) / 0.2);
          box-shadow: 0 8px 22px rgb(var(--color-primary-light-rgb) / 0.2);
          transform: translateY(-2px);
        }

        .incident-button:active {
          transform: translateY(1px);
        }

        .incident-location-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          color: var(--incident-faint);
          font-size: 0.69rem;
        }

        .incident-location-status::before {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-accent);
          box-shadow: 0 0 8px rgb(var(--color-accent-soft-rgb) / 0.5);
          content: "";
        }

        .incident-upload {
          position: relative;
          display: flex;
          min-height: 176px;
          align-items: center;
          justify-content: center;
          border: 1px dashed rgb(var(--color-accent-soft-rgb) / 0.46);
          border-radius: 14px;
          outline: none;
          text-align: center;
          background:
            linear-gradient(135deg, rgb(var(--color-accent-soft-rgb) / 0.1), rgb(var(--color-background-rgb) / 0.3)),
            repeating-linear-gradient(135deg, transparent 0 12px, rgba(255, 255, 255, 0.012) 12px 13px);
          cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease, box-shadow 200ms ease;
        }

        .incident-upload:hover {
          border-color: var(--color-accent-soft);
          background-color: rgb(var(--color-accent-rgb) / 0.18);
          box-shadow: 0 0 26px rgb(var(--color-accent-soft-rgb) / 0.12);
        }

        .incident-upload input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
        }

        .incident-upload-icon {
          display: grid;
          width: 45px;
          height: 45px;
          margin: 0 auto 12px;
          place-items: center;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.36);
          border-radius: 13px;
          color: var(--color-accent-soft);
          background: linear-gradient(145deg, rgb(var(--color-accent-soft-rgb) / 0.2), rgb(var(--color-accent-soft-rgb) / 0.2));
          font-size: 1.25rem;
        }

        .incident-upload-title,
        .incident-upload-copy {
          display: block;
        }

        .incident-upload-title {
          margin-bottom: 6px;
          color: var(--incident-lavender);
          font-size: 0.78rem;
          font-weight: 760;
        }

        .incident-upload-copy {
          color: var(--incident-muted);
          font-size: 0.68rem;
        }

        .incident-file-list {
          max-width: 250px;
          margin: 10px auto 0;
          padding: 0;
          overflow: hidden;
          color: var(--color-accent-soft);
          font-size: 0.66rem;
          list-style: none;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .incident-submit {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 18px;
          padding: 22px 25px;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.23);
          border-radius: 18px;
          background:
            linear-gradient(100deg, rgb(var(--color-primary-rgb) / 0.68), rgb(var(--color-background-rgb) / 0.84)),
            var(--incident-surface);
          box-shadow: inset 0 1px rgba(255, 255, 255, 0.05);
          animation: incident-rise 600ms 230ms ease both;
        }

        .incident-privacy {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          max-width: 560px;
          color: var(--incident-muted);
          font-size: 0.72rem;
          line-height: 1.55;
        }

        .incident-privacy-icon {
          flex: 0 0 auto;
          color: var(--color-accent-soft);
          font-size: 1rem;
        }

        .incident-submit-button {
          min-width: 218px;
          border-color: transparent;
          color: white;
          background: linear-gradient(110deg, var(--color-accent-soft), var(--color-accent-soft) 52%, var(--color-accent-soft));
          box-shadow: 0 11px 30px rgb(var(--color-accent-soft-rgb) / 0.27), inset 0 1px rgba(255, 255, 255, 0.22);
        }

        .incident-submit-button:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: linear-gradient(110deg, var(--color-accent-soft), var(--color-accent-soft) 52%, var(--color-accent-soft));
          box-shadow: 0 14px 34px rgb(var(--color-accent-soft-rgb) / 0.4), 0 0 25px rgb(var(--color-accent-soft-rgb) / 0.19);
        }

        .incident-submit-button:active {
          box-shadow: 0 5px 14px rgb(var(--color-accent-soft-rgb) / 0.24);
        }

        .incident-message {
          margin-top: 11px;
          padding: 12px 15px;
          border: 1px solid rgb(var(--color-teal-rgb) / 0.25);
          border-radius: 10px;
          color: var(--color-primary-light);
          background: rgb(var(--color-primary-light-rgb) / 0.09);
          font-size: 0.72rem;
          animation: incident-rise 240ms ease both;
        }

        .incident-guidelines {
          margin-top: 20px;
          padding: 25px 28px;
          animation: incident-rise 600ms 300ms ease both;
        }

        .incident-guideline-heading {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
        }

        .incident-guideline-heading .incident-card-title {
          margin-bottom: 0;
        }

        .incident-guideline-note {
          color: var(--incident-faint);
          font-size: 0.68rem;
        }

        .incident-guideline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 13px;
          margin-top: 21px;
        }

        .incident-guideline {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-height: 65px;
          padding: 13px;
          border: 1px solid rgb(var(--color-accent-soft-rgb) / 0.1);
          border-radius: 11px;
          color: var(--incident-muted);
          font-size: 0.72rem;
          line-height: 1.48;
          background: rgb(var(--color-background-rgb) / 0.3);
          transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
        }

        .incident-guideline:hover {
          border-color: rgb(var(--color-accent-soft-rgb) / 0.3);
          background: rgb(var(--color-background-rgb) / 0.48);
          transform: translateY(-2px);
        }

        .incident-guideline-number {
          display: grid;
          width: 24px;
          height: 24px;
          flex: 0 0 auto;
          place-items: center;
          border-radius: 7px;
          color: var(--color-accent-soft);
          background: linear-gradient(135deg, rgb(var(--color-accent-rgb) / 0.28), rgb(var(--color-accent-soft-rgb) / 0.23));
          font-size: 0.62rem;
          font-weight: 800;
        }

        @keyframes incident-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .incident-page *,
          .incident-page::before {
            animation-duration: 1ms !important;
            transition-duration: 1ms !important;
          }
        }

        @media (max-width: 820px) {
          .incident-page { padding-top: 32px; }
          .incident-header { align-items: flex-start; flex-direction: column; }
          .incident-status { min-width: 0; }
          .incident-layout { grid-template-columns: 1fr; }
          .incident-submit { align-items: stretch; flex-direction: column; }
          .incident-privacy { max-width: none; }
          .incident-submit-button { width: 100%; }
          .incident-guideline-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 500px) {
          .incident-page { padding-right: 14px; padding-left: 14px; }
          .incident-form-card,
          .incident-location-card { padding: 21px 17px; }
          .incident-severity-grid { grid-template-columns: 1fr; }
          .incident-address-row { grid-template-columns: 1fr; }
          .incident-guidelines { padding: 21px 17px; }
          .incident-guideline-heading { align-items: flex-start; flex-direction: column; gap: 7px; }
          .incident-submit { padding: 20px 17px; }
        }
      `}</style>

      <div className="incident-shell">
        <header className="incident-header">
          <div className="incident-brand-wrap">
            <div className="incident-logo-box">
              <SafeRouteLogo size={30} />
            </div>
            <div>
              <div className="incident-eyebrow">
                <span className="incident-eyebrow-mark" aria-hidden="true" />
                SafeRoute / Community Safety
              </div>
              <h1 className="incident-title">Report an Incident</h1>
              <p className="incident-intro">
                Help make your community safer by reporting unsafe situations and
                providing accurate information.
              </p>
            </div>
          </div>

          <div className="incident-status" aria-label="Safety channel status">
            <span className="incident-status-icon" aria-hidden="true">✦</span>
            <div>
              <strong>Safety Channel Active</strong>
              <span>Reports are handled securely</span>
            </div>
          </div>

          <button
            type="button"
            className="incident-nav-link"
            onClick={() => (onNavigate ? onNavigate('history') : (window.location.hash = 'history'))}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            View Incident History <span aria-hidden="true">→</span>
          </button>
        </header>

        <form className="incident-layout" onSubmit={handleSubmit}>
          <section className="incident-card incident-form-card" aria-labelledby="incident-details-title">
            {isAuthenticated && user ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'rgb(var(--color-accent-rgb) / 0.1)',
                  border: '1px solid rgb(var(--color-accent-soft-rgb) / 0.25)',
                  borderRadius: '10px',
                  marginBottom: '18px',
                  fontSize: '0.86rem',
                  color: 'var(--color-accent-soft)',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--color-accent-soft)', flexShrink: 0 }} />
                <span>
                  Reporting as verified citizen: <strong>{user.name}</strong> ({user.email})
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '12px 14px',
                  background: 'rgb(var(--color-accent-soft-rgb) / 0.1)',
                  border: '1px solid rgb(var(--color-accent-soft-rgb) / 0.3)',
                  borderRadius: '10px',
                  marginBottom: '18px',
                  fontSize: '0.86rem',
                  color: 'var(--color-text-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--color-accent-soft)', flexShrink: 0 }} />
                  <span>Citizen sign-in required to submit verified reports.</span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('login')}
                  style={{
                    background: 'rgb(var(--color-accent-soft-rgb) / 0.2)',
                    border: '1px solid rgb(var(--color-accent-soft-rgb) / 0.4)',
                    color: 'var(--color-accent)',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
              </div>
            )}
            <div className="incident-kicker">01 / Incident details</div>
            <h2 id="incident-details-title" className="incident-card-title">Tell us what happened</h2>

            <div className="incident-field">
              <label className="incident-label" htmlFor="incident-category">
                Incident category
                <span className="incident-required">Required</span>
              </label>
              <div className="incident-select-wrap">
                <select
                  id="incident-category"
                  className="incident-select"
                  value={form.category}
                  onChange={(event) => updateForm('category', event.target.value)}
                  required
                >
                  <option value="" disabled>Select an incident type</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <fieldset className="incident-field" style={{ border: 0, padding: 0 }}>
              <legend className="incident-label">
                Severity
                <span className="incident-required">Required</span>
              </legend>
              <div className="incident-severity-grid">
                {severityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`incident-severity incident-severity-${option.tone} ${form.severity === option.value ? 'is-selected' : ''}`}
                    aria-pressed={form.severity === option.value}
                    onClick={() => updateForm('severity', option.value)}
                  >
                    <span className="incident-severity-top">
                      <span className="incident-severity-dot" aria-hidden="true" />
                      <span className="incident-selected-mark" aria-hidden="true">✓</span>
                    </span>
                    <span className="incident-severity-name">{option.label}</span>
                    <span className="incident-severity-description">{option.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="incident-field" style={{ marginBottom: 0 }}>
              <label className="incident-label" htmlFor="incident-description">
                Description
                <span className="incident-required">Required</span>
              </label>
              <textarea
                id="incident-description"
                className="incident-textarea"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder="What happened? Please provide clear details..."
                required
              />
            </div>
          </section>

          <section className="incident-card incident-location-card" aria-labelledby="incident-location-title">
            <div className="incident-kicker">02 / Location &amp; evidence</div>
            <h2 id="incident-location-title" className="incident-card-title">Add useful context</h2>

            <div className="incident-field">
              <label className="incident-label" htmlFor="incident-address">
                Address
                <span className="incident-required">Required</span>
              </label>
              <div className="incident-address-row">
                <input
                  id="incident-address"
                  className="incident-input"
                  type="text"
                  value={form.address}
                  onChange={(event) => updateForm('address', event.target.value)}
                  placeholder="Street, landmark, or nearby location"
                />
                <button
                  className="incident-button"
                  type="button"
                  onClick={handleUseLocation}
                >
                  <span aria-hidden="true">⌖</span>
                  Use My Location
                </button>
              </div>
              <div className="incident-location-status" aria-live="polite">
                {locationStatus}
              </div>
            </div>

            <div className="incident-field" style={{ marginBottom: 0 }}>
              <label className="incident-label" htmlFor="incident-evidence">
                Evidence
                <span style={{ color: 'var(--incident-faint)', fontWeight: 500 }}>Optional</span>
              </label>
              <label className="incident-upload" htmlFor="incident-evidence">
                <input
                  id="incident-evidence"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                />
                <span>
                  <span className="incident-upload-icon" aria-hidden="true">↑</span>
                  <span className="incident-upload-title">Add Evidence</span>
                  <span className="incident-upload-copy">Drop an image here or browse · PNG, JPG up to 10 MB</span>
                  {selectedImage && (
                    <ul className="incident-file-list">
                      <li key={`${selectedImage.name}-${selectedImage.lastModified}`}>{selectedImage.name}</li>
                    </ul>
                  )}
                </span>
              </label>
            </div>
          </section>

          <div className="incident-submit">
            <div className="incident-privacy">
              <span className="incident-privacy-icon" aria-hidden="true">▣</span>
              <span>
                Please provide accurate information. False reports may affect emergency response.
              </span>
            </div>
            <button className="incident-button incident-submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Incident Report'} <span aria-hidden="true">→</span>
            </button>
          </div>

          {message && <div className="incident-message" role="status">{message}</div>}
        </form>

        <aside className="incident-card incident-guidelines" aria-labelledby="incident-guidelines-title">
          <div className="incident-guideline-heading">
            <div>
              <div className="incident-kicker">Before you submit</div>
              <h2 id="incident-guidelines-title" className="incident-card-title">Reporting Guidelines</h2>
            </div>
            <span className="incident-guideline-note">Help us keep reports useful</span>
          </div>
          <div className="incident-guideline-grid">
            <div className="incident-guideline">
              <span className="incident-guideline-number">01</span>
              <span>Provide accurate information and describe only what you observed.</span>
            </div>
            <div className="incident-guideline">
              <span className="incident-guideline-number">02</span>
              <span>Report emergencies through SOS when immediate assistance is required.</span>
            </div>
            <div className="incident-guideline">
              <span className="incident-guideline-number">03</span>
              <span>Do not submit false reports or information intended to mislead.</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default IncidentReport;
