import { useEffect, useRef, useState } from 'react'
import { LogIn, UserPlus, User, LogOut, AlertOctagon } from 'lucide-react'
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
import { AuthProvider, useAuth } from './context/AuthContext'
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

  const handleLogout = () => {
    logout()
    setCurrentView('home')
  }

  return (
    <div className="app-shell">
      <div className="cursor-glow" ref={cursorGlowRef} aria-hidden="true" />
      <nav className="app-nav">
        <button className="app-brand" type="button" onClick={() => setCurrentView('home')}>
          <SafeRouteLogo size={32} className="app-brand-logo" />
          <span className="app-brand-copy">
            <strong>SAFEROUTE</strong>
            <small>Smart Public Safety Platform</small>
          </span>
        </button>

        <div className="app-nav-links" aria-label="Primary navigation">
          {navigationItems.map(([view, label]) => (
            <button
              className={`app-nav-link ${view === 'sos' ? 'app-nav-link-sos' : ''} ${currentView === view ? 'is-active' : ''}`}
              key={view}
              onClick={() => setCurrentView(view)}
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
                onClick={() => setCurrentView('profile')}
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
                onClick={() => setCurrentView('login')}
                type="button"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </button>

              <button
                className={`app-nav-link app-nav-auth-register ${currentView === 'register' ? 'is-active' : ''}`}
                onClick={() => setCurrentView('register')}
                type="button"
              >
                <UserPlus size={14} />
                <span>Register</span>
              </button>
            </>
          )}

          <InstallPrompt />
        </div>
      </nav>

      <div className="app-content">
        {currentView === 'home' && <HomePage onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'safe-route' && <SafeRouteMap />}
        {currentView === 'report' && <IncidentReport onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'history' && <IncidentHistory onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'sos' && <SOS onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'login' && <Login onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'register' && <Register onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'profile' && (
          <ProtectedRoute onNavigate={(view) => setCurrentView(view)}>
            <Profile onNavigate={(view) => setCurrentView(view)} />
          </ProtectedRoute>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
