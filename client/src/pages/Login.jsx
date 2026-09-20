import { useState } from 'react';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import SafeRouteLogo from '../components/SafeRouteLogo';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBaseUrl = API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrorMessage(data.message || 'Login failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      if (data.token && data.user) {
        login(data.token, data.user);
        if (onNavigate) {
          onNavigate('home');
        }
      } else {
        setErrorMessage('Invalid response from authentication server.');
      }
    } catch {
      setErrorMessage('Unable to connect to authentication server. Please verify your network.');
    } finally {
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
          maxWidth: '440px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.45)',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
              marginBottom: '16px',
            }}
          >
            <SafeRouteLogo size={36} />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-heading)',
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
              color: 'var(--text-heading)',
              margin: '0 0 6px',
            }}
          >
            Citizen Sign In
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: 0 }}>
            Access verified safety routing and personal incident tracking
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: 'rgb(var(--color-accent-rgb) / 0.12)',
              border: '1px solid rgb(var(--color-accent-rgb) / 0.35)',
              borderRadius: '10px',
              color: 'var(--color-accent-soft)',
              fontSize: '0.86rem',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--text-subtle)',
                marginBottom: '7px',
              }}
            >
              Email Address
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
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="citizen@saferoute.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 160ms ease, box-shadow 160ms ease',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: 'var(--text-subtle)',
                }}
              >
                Password
              </label>
            </div>
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
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 42px 12px 42px',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--line)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  transition: 'border-color 160ms ease, box-shadow 160ms ease',
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
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary-light))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.75 : 1,
              boxShadow: '0 4px 20px rgb(var(--color-accent-rgb) / 0.35)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
            }}
          >
            <LogIn size={18} />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            {!isSubmitting && <ArrowRight size={16} />}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
            fontSize: '0.86rem',
            color: 'var(--muted)',
          }}
        >
          <span>Need a SafeRoute citizen account? </span>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('register')}
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
            Register here
          </button>
        </div>

        <div
          style={{
            marginTop: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.78rem',
            color: 'var(--muted)',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--color-teal-dark)' }} />
          <span>Encrypted citizen session security</span>
        </div>
      </div>
    </div>
  );
}
