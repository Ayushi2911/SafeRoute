import { ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, onNavigate, message }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <p>Verifying citizen credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 160px)',
          padding: '24px 16px',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 20px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              border: '1px solid var(--line-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'var(--accent)',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: 'var(--text-heading)',
              margin: '0 0 10px',
            }}
          >
            Authentication Required
          </h2>

          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--muted)',
              lineHeight: 1.5,
              margin: '0 0 28px',
            }}
          >
            {message ||
              'Access to this feature requires an active SafeRoute citizen account. Please log in or register to continue.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
              }}
            >
              <LogIn size={18} />
              <span>Log In to SafeRoute</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('register')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'var(--surface-raised)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
            >
              <UserPlus size={18} />
              <span>Register New Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
