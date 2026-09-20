import { useEffect, useRef, useState } from 'react'
import { LogIn, UserPlus, User, LogOut, AlertOctagon, Menu, X } from 'lucide-react'
import AdminDashboard from './components/admin/AdminDashboard'
import IncidentReport from './pages/IncidentReport'
import IncidentHistory from './pages/IncidentHistory'
import SafeRouteMap from './pages/SafeRouteMap'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import SOS from './pages/SOS'
import ProtectedRoute from './components/ProtectedRoute'
import SafeRouteLogo from './components/SafeRouteLogo'
import InstallPrompt from './components/InstallPrompt'
import ThemeToggle from './components/ThemeToggle'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './components/admin/admin.css'
import './App.css'

const navigationItems = [
  ['home', 'Home'],
  ['safe-route', 'Safe Route & Maps'],
  ['report', 'Report Incident'],
  ['history', 'History'],
  ['sos', 'SOS Emergency'],
  ['admin', 'Admin & Analytics'],
]

function AppContent() {
  const [currentView, setCurrentView] = useState('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const cursorGlowRef = useRef(null)

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches
    if (isTouchDevice) {
      return undefined
    }

    cursorGlowRef.current?.classList.add('is-visible')

    let frameId = 0
    let nextPosition = { x: -100, y: -100 }

    const updateGlow = () => {
      frameId = 0
      if (cursorGlowRef.current) {
        cursorGlowRef.current.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`
      }
    }

    const handlePointerMove = (event) => {
      nextPosition = { x: event.clientX, y: event.clientY }
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateGlow)
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileMenuOpen])

  // Close mobile menu when resized past mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleNavigate = (view) => {
    setCurrentView(view)
    setMobileMenuOpen(false)
  }

  const handleLogout = () => {
    logout()
    setCurrentView('home')
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <div className="cursor-glow" ref={cursorGlowRef} aria-hidden="true" />
      <nav className="app-nav">
        {/* Mobile Hamburger Toggle Button (Left on Mobile) */}
        <button
          className="app-nav-hamburger-btn"
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-drawer"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <button className="app-brand" type="button" onClick={() => handleNavigate('home')}>
          <SafeRouteLogo size={32} className="app-brand-logo" />
          <span className="app-brand-copy">
            <strong>SAFEROUTE</strong>
            <small>Smart Public Safety Platform</small>
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <div className="app-nav-desktop-links" aria-label="Primary navigation">
          {navigationItems.map(([view, label]) => (
            <button
              className={`app-nav-link ${view === 'sos' ? 'app-nav-link-sos' : ''} ${currentView === view ? 'is-active' : ''}`}
              key={view}
              onClick={() => handleNavigate(view)}
              type="button"
            >
              {view === 'sos' && <AlertOctagon size={13} style={{ marginRight: 4 }} />}
              {label}
            </button>
          ))}

          {isAuthenticated && user ? (
            <>
              <button
                className={`app-nav-link app-nav-auth-profile ${currentView === 'profile' ? 'is-active' : ''}`}
                onClick={() => handleNavigate('profile')}
                type="button"
                title={`Signed in as ${user.name}`}
              >
                <User size={14} />
                <span>{user.name.split(' ')[0] || 'Profile'}</span>
              </button>

              <button
                className="app-nav-link app-nav-auth-logout"
                onClick={handleLogout}
                type="button"
                title="Sign out of SafeRoute"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                className={`app-nav-link app-nav-auth-btn ${currentView === 'login' ? 'is-active' : ''}`}
                onClick={() => handleNavigate('login')}
                type="button"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                className={`app-nav-link app-nav-auth-register ${currentView === 'register' ? 'is-active' : ''}`}
                onClick={() => handleNavigate('register')}
                type="button"
              >
                <UserPlus size={14} />
                <span>Register</span>
              </button>
            </>
          )}

          <InstallPrompt renderBanner={true} />
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          className="app-nav-mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-nav-drawer"
        className={`app-nav-mobile-drawer ${mobileMenuOpen ? 'is-open' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="app-nav-mobile-scroll">
          <div className="app-nav-mobile-section">
            <span className="app-nav-mobile-heading">Navigation</span>
            {navigationItems.map(([view, label]) => (
              <button
                className={`app-nav-mobile-link ${view === 'sos' ? 'app-nav-mobile-link-sos' : ''} ${currentView === view ? 'is-active' : ''}`}
                key={view}
                onClick={() => handleNavigate(view)}
                type="button"
              >
                {view === 'sos' && <AlertOctagon size={16} style={{ marginRight: 8 }} />}
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="app-nav-mobile-divider" />

          <div className="app-nav-mobile-section">
            <span className="app-nav-mobile-heading">Account &amp; Settings</span>

            {isAuthenticated && user ? (
              <>
                <button
                  className={`app-nav-mobile-link ${currentView === 'profile' ? 'is-active' : ''}`}
                  onClick={() => handleNavigate('profile')}
                  type="button"
                >
                  <User size={16} />
                  <span>Profile ({user.name.split(' ')[0] || user.name})</span>
                </button>

                <button
                  className="app-nav-mobile-link app-nav-mobile-logout"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <button
                  className={`app-nav-mobile-link ${currentView === 'login' ? 'is-active' : ''}`}
                  onClick={() => handleNavigate('login')}
                  type="button"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>

                <button
                  className={`app-nav-mobile-link app-nav-mobile-register ${currentView === 'register' ? 'is-active' : ''}`}
                  onClick={() => handleNavigate('register')}
                  type="button"
                >
                  <UserPlus size={16} />
                  <span>Register</span>
                </button>
              </>
            )}

            <ThemeToggle showLabel={true} />

            <div className="app-nav-mobile-install">
              <InstallPrompt renderBanner={false} />
            </div>
          </div>
        </div>
      </div>

      <div className="app-content">
        {currentView === 'home' && <HomePage onNavigate={(view) => handleNavigate(view)} />}
        {currentView === 'safe-route' && <SafeRouteMap />}
        {currentView === 'report' && <IncidentReport onNavigate={(view) => handleNavigate(view)} />}
        {currentView === 'history' && <IncidentHistory onNavigate={(view) => handleNavigate(view)} />}
        {currentView === 'sos' && <SOS onNavigate={(view) => handleNavigate(view)} />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'login' && <Login onNavigate={(view) => handleNavigate(view)} />}
        {currentView === 'register' && <Register onNavigate={(view) => handleNavigate(view)} />}
        {currentView === 'profile' && (
          <ProtectedRoute onNavigate={(view) => handleNavigate(view)}>
            <Profile onNavigate={(view) => handleNavigate(view)} />
          </ProtectedRoute>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
