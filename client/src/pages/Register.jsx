import { useState } from 'react';
import { UserPlus, User, Mail, Lock, Phone, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import SafeRouteLogo from '../components/SafeRouteLogo';

export default function Register({ onNavigate }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName || !trimmedEmail || !form.password) {
      setErrorMessage('Please fill in all required fields (Name, Email, and Password).');
      return;
    }

    if (trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: form.password,
          phone: trimmedPhone || null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.message || 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('Registration successful! Redirecting to sign in...');
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('login');
        }
      }, 1500);
    } catch {
      setErrorMessage('Unable to connect to authentication server. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('home')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: 0,
              marginBottom: '14px',
            }}
          >
            <SafeRouteLogo size={36} />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#f5f3fb',
                letterSpacing: '0.06em',
              }}
            >
              SAFEROUTE
            </span>
          </button>
          <h1
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#f5f3fb',
              margin: '0 0 6px',
            }}
          >
            Create Citizen Account
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0 }}>
            Join the SafeRoute community network for verified safety
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              color: '#fca5a5',
              fontSize: '0.86rem',
              marginBottom: '18px',
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
              padding: '12px 14px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '10px',
              color: '#6ee7b7',
              fontSize: '0.86rem',
              marginBottom: '18px',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="reg-name"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#d4ceee',
                marginBottom: '6px',
              }}
            >
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder="Ayushi Sharma"
                value={form.name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  background: 'rgba(9, 10, 18, 0.7)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-email"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#d4ceee',
                marginBottom: '6px',
              }}
            >
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="citizen@saferoute.internal"
                value={form.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  background: 'rgba(9, 10, 18, 0.7)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-password"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#d4ceee',
                marginBottom: '6px',
              }}
            >
              Password (min. 6 characters) *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 42px 11px 42px',
                  background: 'rgba(9, 10, 18, 0.7)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#d4ceee',
                marginBottom: '6px',
              }}
            >
              Contact Phone (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Phone
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  pointerEvents: 'none',
                }}
              />
              <input
                id="reg-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 42px',
                  background: 'rgba(9, 10, 18, 0.7)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '13px',
              marginTop: '6px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.75 : 1,
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.35)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
          >
            <UserPlus size={18} />
            <span>{isSubmitting ? 'Creating Account...' : 'Register Account'}</span>
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div
          style={{
            marginTop: '22px',
            paddingTop: '18px',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
            fontSize: '0.86rem',
            color: 'var(--muted)',
          }}
        >
          <span>Already have a citizen account? </span>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            Sign In here
          </button>
        </div>

        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          <ShieldCheck size={14} style={{ color: '#10b981' }} />
          <span>Encrypted citizen session security</span>
        </div>
      </div>
    </div>
  );
}
