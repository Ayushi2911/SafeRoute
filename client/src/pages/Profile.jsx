import { useEffect, useState, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function Profile({ onNavigate }) {
  const { user: authUser, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form edit state
  const [form, setForm] = useState({
    age: '',
    gender: '',
    address: '',
    safety_preferences: '',
  });

  const apiBaseUrl = API_BASE_URL;

  const fetchProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setErrorMessage('');
      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          setErrorMessage('Session expired. Please sign in again.');
        } else {
          setErrorMessage(data.message || 'Failed to fetch profile details.');
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        setProfile(data.user);
        setForm({
          age: data.user.age ?? '',
          gender: data.user.gender ?? '',
          address: data.user.address ?? '',
          safety_preferences: data.user.safety_preferences ?? '',
        });
      }
    } catch {
      setErrorMessage('Unable to connect to server. Please check your network.');
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, logout]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          age: form.age === '' ? null : parseInt(form.age, 10),
          gender: form.gender || null,
          address: form.address || null,
          safety_preferences: form.safety_preferences || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.message || 'Failed to update profile.');
        setIsSaving(false);
        return;
      }

      setSuccessMessage('Citizen profile updated successfully!');
      setIsEditing(false);
      // Refresh profile
      await fetchProfile();
    } catch {
      setErrorMessage('Unable to connect to server to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 120px)',
          color: 'var(--muted)',
        }}
      >
        <p>Loading citizen profile...</p>
      </div>
    );
  }

  const citizen = profile || authUser;

  return (
    <div
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '36px 20px 60px',
      }}
    >
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
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(99, 102, 241, 0.25))',
              border: '1px solid rgba(185, 155, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d8b4fe',
            }}
          >
            <User size={34} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1
                style={{
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: 'var(--text-heading)',
                  margin: 0,
                }}
              >
                {citizen?.name || 'SafeRoute Citizen'}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  background: citizen?.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  border: citizen?.role === 'admin' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(139, 92, 246, 0.35)',
                  color: citizen?.role === 'admin' ? '#f87171' : '#c084fc',
                }}
              >
                <Shield size={12} />
                {citizen?.role === 'admin' ? 'System Admin' : 'Verified Citizen'}
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0 }}>
              Member of SafeRoute Public Safety Network
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--line-strong)',
                color: 'var(--accent)',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              <Edit3 size={16} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--line)',
                color: 'var(--muted)',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            color: '#fca5a5',
            fontSize: '0.88rem',
            marginBottom: '20px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            color: '#6ee7b7',
            fontSize: '0.88rem',
            marginBottom: '20px',
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Account Credentials Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontSize: '1.08rem',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                margin: 0,
                color: 'var(--text-heading)',
              }}
            >
              Citizen Account Info
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                FULL NAME
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '0.94rem' }}>
                <User size={16} style={{ color: 'var(--muted)' }} />
                <span>{citizen?.name || 'Not provided'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                EMAIL ADDRESS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '0.94rem' }}>
                <Mail size={16} style={{ color: 'var(--muted)' }} />
                <span>{citizen?.email || 'Not provided'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                CONTACT PHONE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '0.94rem' }}>
                <Phone size={16} style={{ color: 'var(--muted)' }} />
                <span>{citizen?.phone || 'No phone registered'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                REGISTRATION STATUS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '0.94rem' }}>
                <Calendar size={16} style={{ color: 'var(--muted)' }} />
                <span>
                  {citizen?.created_at
                    ? new Date(citizen.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Preferences & Personal Information Card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sliders size={20} style={{ color: 'var(--accent)' }} />
            <h2
              style={{
                fontSize: '1.08rem',
                fontWeight: 700,
                fontFamily: "'Space Grotesk', sans-serif",
                margin: 0,
                color: 'var(--text-heading)',
              }}
            >
              Safety Profile &amp; Preferences
            </h2>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  htmlFor="profile-age"
                  style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}
                >
                  AGE
                </label>
                <input
                  id="profile-age"
                  name="age"
                  type="number"
                  min="1"
                  max="125"
                  placeholder="e.g. 24"
                  value={form.age}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-gender"
                  style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}
                >
                  GENDER
                </label>
                <input
                  id="profile-gender"
                  name="gender"
                  type="text"
                  placeholder="e.g. Female / Male / Non-binary"
                  value={form.gender}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-address"
                  style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}
                >
                  RESIDENTIAL ADDRESS / FREQUENT AREA
                </label>
                <input
                  id="profile-address"
                  name="address"
                  type="text"
                  placeholder="e.g. Bandra West, Mumbai"
                  value={form.address}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="profile-safety-pref"
                  style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '4px' }}
                >
                  ROUTING &amp; SAFETY PREFERENCES
                </label>
                <textarea
                  id="profile-safety-pref"
                  name="safety_preferences"
                  rows={3}
                  placeholder="e.g. Prefer well-lit primary avenues; prioritize police station proximity during night travel."
                  value={form.safety_preferences}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  AGE &amp; GENDER
                </span>
                <div style={{ color: 'var(--text)', fontSize: '0.94rem' }}>
                  {profile?.age || profile?.gender
                    ? `${profile?.age ? `${profile.age} years old` : ''}${profile?.age && profile?.gender ? ' • ' : ''}${profile?.gender || ''}`
                    : 'Not specified'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  RESIDENTIAL ADDRESS
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontSize: '0.94rem' }}>
                  <MapPin size={16} style={{ color: 'var(--muted)' }} />
                  <span>{profile?.address || 'No residential address set'}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                  SAFETY &amp; ROUTING PREFERENCES
                </span>
                <div
                  style={{
                    color: profile?.safety_preferences ? 'var(--text)' : 'var(--muted)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    background: 'var(--surface-raised)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  {profile?.safety_preferences ||
                    'Default safe navigation: Avoid verified high-severity zones and prefer routes with higher lighting.'}
                </div>
              </div>

              {profile?.updated_at && (
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px' }}>
                  Last updated: {new Date(profile.updated_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
