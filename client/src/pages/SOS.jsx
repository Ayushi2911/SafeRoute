import { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon,
  PhoneCall,
  MapPin,
  ShieldAlert,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  LogIn,
  UserPlus,
  Plus,
  Trash2,
  Phone,
  Radio,
  Check,
} from 'lucide-react';
import SafeRouteLogo from '../components/SafeRouteLogo';
import { useAuth } from '../context/AuthContext';

const EMERGENCY_TYPES = [
  { id: 'General Emergency', label: 'General Emergency', icon: '🚨' },
  { id: 'Medical Emergency', label: 'Medical Urgent', icon: '🚑' },
  { id: 'Harassment / Danger', label: 'Threat / Danger', icon: '⚠️' },
  { id: 'Accident', label: 'Accident', icon: '💥' },
  { id: 'Fire / Hazard', label: 'Fire / Hazard', icon: '🔥' },
];

const DIRECT_HOTLINES = [
  { name: 'Police Control Room', number: '100', role: 'Immediate law enforcement' },
  { name: 'Medical Ambulance', number: '108', role: 'Emergency medical response' },
  { name: 'Fire & Rescue', number: '101', role: 'Fire & structural rescue' },
  { name: 'Women Safety Helpline', number: '1091', role: 'Dedicated women protection' },
  { name: 'National Emergency', number: '112', role: 'Unified emergency dispatch' },
];

export default function SOS({ onNavigate }) {
  const { user, token, isAuthenticated } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // SOS Trigger State
  const [selectedType, setSelectedType] = useState('General Emergency');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState('');
  const [triggerError, setTriggerError] = useState('');
  const [lastRecordedSos, setLastRecordedSos] = useState(null);

  // Contacts & History State
  const [contacts, setContacts] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // New Contact Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    contact_name: '',
    phone: '',
    relationship: 'Family',
  });
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactError, setContactError] = useState('');

  // Fetch emergency contacts
  const fetchContacts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/sos/contacts`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContacts(data.data || []);
      }
    } catch {
      // Silent catch for background contacts refresh
    } finally {
      setLoadingContacts(false);
    }
  }, [token, apiBaseUrl]);

  // Fetch personal SOS history
  const fetchSosHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/sos`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSosHistory(data.data || []);
      }
    } catch {
      // Silent catch for background history refresh
    } finally {
      setLoadingHistory(false);
    }
  }, [token, apiBaseUrl]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchContacts();
      fetchSosHistory();
    }
  }, [isAuthenticated, fetchContacts, fetchSosHistory]);

  // Handle Trigger SOS
  const handleTriggerSOS = () => {
    if (!isAuthenticated) {
      if (onNavigate) onNavigate('login');
      return;
    }

    setTriggerError('');
    setTriggerStatus('Requesting GPS coordinates...');
    setIsSubmitting(true);

    if (!navigator.geolocation) {
      setTriggerError('Geolocation is not supported by your browser or device.');
      setIsSubmitting(false);
      setTriggerStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setTriggerStatus('Transmitting distress coordinates to SafeRoute network...');

        try {
          const res = await fetch(`${apiBaseUrl}/api/sos`, {
            method: 'POST',
            cache: 'no-store',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              latitude,
              longitude,
              emergency_type: selectedType,
              message: customMessage.trim() || 'Emergency SOS triggered',
            }),
          });

          const data = await res.json().catch(() => ({}));

          if (!res.ok) {
            throw new Error(data.message || 'Unable to record SOS signal on server.');
          }

          setLastRecordedSos({
            id: data.sos_id,
            latitude: latitude.toFixed(5),
            longitude: longitude.toFixed(5),
            emergency_type: selectedType,
            status: 'pending',
            created_at: new Date().toISOString(),
          });

          setTriggerStatus('Distress signal recorded successfully.');
          setCustomMessage('');
          await fetchSosHistory();
        } catch (err) {
          setTriggerError(err.message || 'Connection error while transmitting SOS.');
          setTriggerStatus('');
        } finally {
          setIsSubmitting(false);
        }
      },
      (geoError) => {
        let errorMsg = 'Unable to determine your GPS location.';
        if (geoError.code === 1) {
          errorMsg = 'Location permission was denied. Please enable device location access for emergency GPS.';
        } else if (geoError.code === 2) {
          errorMsg = 'Position unavailable. Check your device GPS signal.';
        } else if (geoError.code === 3) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        setTriggerError(errorMsg);
        setTriggerStatus('');
        setIsSubmitting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Handle Update SOS Status (e.g. resolve)
  const handleUpdateStatus = async (sosId, newStatus) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/sos/${sosId}/status`, {
        method: 'PATCH',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchSosHistory();
      }
    } catch {
      // Error handling
    }
  };

  // Handle Add Emergency Contact
  const handleAddContactSubmit = async (e) => {
    e.preventDefault();
    setContactError('');

    if (!newContact.contact_name.trim() || !newContact.phone.trim()) {
      setContactError('Please enter both contact name and valid phone number.');
      return;
    }

    setIsAddingContact(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/sos/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contact_name: newContact.contact_name.trim(),
          phone: newContact.phone.trim(),
          relationship: newContact.relationship.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save contact.');
      }

      setNewContact({ contact_name: '', phone: '', relationship: 'Family' });
      setShowAddContact(false);
      await fetchContacts();
    } catch (err) {
      setContactError(err.message || 'Error saving contact.');
    } finally {
      setIsAddingContact(false);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async (contactId) => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/sos/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchContacts();
      }
    } catch {
      // Delete error handling
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(185, 28, 28, 0.35))',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)',
            }}
          >
            <AlertOctagon size={32} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: '#f5f3fb',
                  margin: 0,
                }}
              >
                SOS Emergency Assistance
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                }}
              >
                <Radio size={12} className="admin-sos-pulse" />
                Live Channel
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0 }}>
              Immediate distress location signaling &amp; direct municipal emergency hotline links
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SafeRouteLogo size={32} />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.9rem',
              fontWeight: 700,
              color: '#d4ceee',
              letterSpacing: '0.06em',
            }}
          >
            SAFEROUTE
          </span>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.28)',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '28px',
          color: '#fde68a',
          fontSize: '0.86rem',
          lineHeight: 1.5,
        }}
      >
        <AlertTriangle size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
        <span>
          <strong>Emergency Protocol:</strong> Triggering SOS logs your verified GPS coordinates to SafeRoute's
          internal dispatch records. In immediate life-threatening situations, also dial municipal emergency services
          (<strong>100</strong> or <strong>108</strong>) below immediately.
        </span>
      </div>

      {/* Main Grid: Left = SOS Beacon, Right = Hotlines & Contacts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Card 1: SOS Beacon Trigger Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '32px 28px',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '240px',
              height: '180px',
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2), transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#f5f3fb',
              margin: '0 0 6px',
            }}
          >
            Distress Beacon
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--muted)', margin: '0 0 24px' }}>
            {isAuthenticated
              ? `Connected as ${user?.name || 'Verified Citizen'}. Tap to record coordinates.`
              : 'Citizen sign-in required to log coordinates with SafeRoute'}
          </p>

          {/* Large SOS Circular Trigger */}
          <div style={{ position: 'relative', margin: '10px 0 28px' }}>
            <button
              type="button"
              onClick={handleTriggerSOS}
              disabled={isSubmitting}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ef4444, #b91c1c 70%, #7f1d1d)',
                border: '4px solid rgba(254, 202, 202, 0.4)',
                boxShadow: isSubmitting
                  ? '0 0 30px rgba(239, 68, 68, 0.8)'
                  : '0 0 45px rgba(239, 68, 68, 0.5), inset 0 2px 8px rgba(255,255,255,0.4)',
                color: '#ffffff',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'transform 180ms ease, box-shadow 180ms ease',
                transform: isSubmitting ? 'scale(0.96)' : 'scale(1)',
              }}
              aria-label="Trigger Emergency SOS"
            >
              <span>SOS</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em', opacity: 0.9 }}>
                {isSubmitting ? 'SIGNALING...' : 'EMERGENCY'}
              </span>
            </button>
          </div>

          {/* Authentication Gate or Options */}
          {isAuthenticated ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#d4ceee',
                    textAlign: 'left',
                    marginBottom: '8px',
                  }}
                >
                  EMERGENCY CATEGORY
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMERGENCY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: selectedType === type.id ? '1px solid #ef4444' : '1px solid var(--line)',
                        background:
                          selectedType === type.id ? 'rgba(239, 68, 68, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                        color: selectedType === type.id ? '#fca5a5' : 'var(--muted)',
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                    >
                      <span style={{ marginRight: '4px' }}>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional distress note (e.g. at bus stop, being followed)"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  maxLength={255}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(9, 10, 18, 0.7)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    color: 'var(--text)',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                background: 'rgba(17, 18, 28, 0.8)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                padding: '18px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--accent)' }} />
                <strong style={{ fontSize: '0.9rem', color: '#f5f3fb' }}>Citizen Account Required</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.4 }}>
                To verify caller legitimacy and link emergency contacts, citizen sign-in is required before recording SOS requests.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('login')}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <LogIn size={14} />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('register')}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#e0d8ff',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <UserPlus size={14} />
                  <span>Register</span>
                </button>
              </div>
            </div>
          )}

          {/* Status / Error feedback */}
          {triggerStatus && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#6ee7b7',
                fontSize: '0.84rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{triggerStatus}</span>
            </div>
          )}

          {triggerError && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#fca5a5',
                fontSize: '0.84rem',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
              }}
            >
              <AlertOctagon size={16} style={{ flexShrink: 0 }} />
              <span>{triggerError}</span>
            </div>
          )}

          {lastRecordedSos && (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                width: '100%',
                textAlign: 'left',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                SOS Signal Recorded (ID #{lastRecordedSos.id})
              </div>
              <div style={{ color: '#d4ceee' }}>
                Coordinates: {lastRecordedSos.latitude}, {lastRecordedSos.longitude}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                Status: Pending verification on SafeRoute Dispatch Console
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Direct Municipal Hotlines & Emergency Contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Municipal Emergency Hotlines */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <PhoneCall size={20} style={{ color: '#ef4444' }} />
              <h2
                style={{
                  fontSize: '1.08rem',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: '#f5f3fb',
                  margin: 0,
                }}
              >
                Direct Emergency Hotlines
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0 0 16px' }}>
              One-tap direct dial to government and emergency dispatch centers
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DIRECT_HOTLINES.map((hotline) => (
                <a
                  key={hotline.number}
                  href={`tel:${hotline.number}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(9, 10, 18, 0.65)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    transition: 'border-color 150ms ease, background 150ms ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f5f3fb' }}>
                      {hotline.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                      {hotline.role}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <Phone size={13} />
                    <span>{hotline.number}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Citizen Emergency Contacts (if authenticated) */}
          {isAuthenticated && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Users size={20} style={{ color: 'var(--accent)' }} />
                  <h2
                    style={{
                      fontSize: '1.08rem',
                      fontWeight: 700,
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: '#f5f3fb',
                      margin: 0,
                    }}
                  >
                    Personal Contacts
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddContact(!showAddContact)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    background: 'rgba(185, 155, 255, 0.12)',
                    border: '1px solid rgba(185, 155, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#e9dcff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  <span>{showAddContact ? 'Cancel' : 'Add Contact'}</span>
                </button>
              </div>

              {/* Add contact inline form */}
              {showAddContact && (
                <form
                  onSubmit={handleAddContactSubmit}
                  style={{
                    background: 'rgba(9, 10, 18, 0.6)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e0d8ff' }}>
                    Add Trusted Emergency Contact
                  </div>
                  {contactError && (
                    <div style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{contactError}</div>
                  )}
                  <input
                    type="text"
                    placeholder="Contact Name (e.g. Mom, Brother)"
                    value={newContact.contact_name}
                    onChange={(e) => setNewContact({ ...newContact, contact_name: e.target.value })}
                    required
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(17, 18, 28, 0.9)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (+91 ...)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    required
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(17, 18, 28, 0.9)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Family, Friend)"
                    value={newContact.relationship}
                    onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(17, 18, 28, 0.9)',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      color: 'var(--text)',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isAddingContact}
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      cursor: isAddingContact ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isAddingContact ? 'Saving...' : 'Save Emergency Contact'}
                  </button>
                </form>
              )}

              {loadingContacts ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.84rem', textAlign: 'center', padding: '12px' }}>
                  Loading contacts...
                </div>
              ) : contacts.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.84rem', textAlign: 'center', padding: '12px' }}>
                  No emergency contacts registered yet. Add a family member or friend for quick notification.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(9, 10, 18, 0.65)',
                        border: '1px solid var(--line)',
                        borderRadius: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f5f3fb' }}>
                          {contact.contact_name}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>
                          {contact.relationship || 'Emergency Contact'} • {contact.phone}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a
                          href={`tel:${contact.phone}`}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            borderRadius: '6px',
                            color: '#6ee7b7',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Phone size={12} />
                          <span>Call</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(contact.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          aria-label={`Delete ${contact.contact_name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SOS Signal Log / History (if authenticated) */}
      {isAuthenticated && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '20px',
            padding: '26px 28px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Clock size={20} style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#f5f3fb',
                margin: 0,
              }}
            >
              My SOS Signal History
            </h2>
          </div>

          {loadingHistory ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.86rem', textAlign: 'center', padding: '16px' }}>
              Loading SOS history...
            </div>
          ) : sosHistory.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.86rem', textAlign: 'center', padding: '16px' }}>
              No previous SOS signals recorded for this citizen account.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sosHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '14px 18px',
                    background: 'rgba(9, 10, 18, 0.65)',
                    border: '1px solid var(--line)',
                    borderRadius: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ color: '#f5f3fb', fontSize: '0.92rem' }}>
                        {item.emergency_type || 'Emergency SOS'}
                      </strong>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background:
                            item.status === 'pending'
                              ? 'rgba(239, 68, 68, 0.18)'
                              : item.status === 'responding'
                              ? 'rgba(245, 158, 11, 0.18)'
                              : 'rgba(16, 185, 129, 0.18)',
                          color:
                            item.status === 'pending'
                              ? '#fca5a5'
                              : item.status === 'responding'
                              ? '#fde68a'
                              : '#6ee7b7',
                          border:
                            item.status === 'pending'
                              ? '1px solid rgba(239, 68, 68, 0.4)'
                              : item.status === 'responding'
                              ? '1px solid rgba(245, 158, 11, 0.4)'
                              : '1px solid rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      Coordinates: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                      {item.message && ` • "${item.message}"`}
                    </div>

                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.74rem', marginTop: '3px' }}>
                      Triggered: {new Date(item.created_at).toLocaleString()}
                      {item.resolved_at && ` • Resolved: ${new Date(item.resolved_at).toLocaleString()}`}
                    </div>
                  </div>

                  {item.status !== 'resolved' && item.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      style={{
                        padding: '6px 14px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: '8px',
                        color: '#6ee7b7',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Check size={14} />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
