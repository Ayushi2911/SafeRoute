import { useEffect, useRef, useState } from 'react'
import AdminDashboard from './components/admin/AdminDashboard'
import IncidentReport from './pages/IncidentReport'
import IncidentHistory from './pages/IncidentHistory'
import SafeRouteMap from './pages/SafeRouteMap'
import HomePage from './pages/HomePage'
import SafeRouteLogo from './components/SafeRouteLogo'
import './components/admin/admin.css'
import './App.css'

const navigationItems = [
  ['home', 'Home'],
  ['safe-route', 'Safe Route & Maps'],
  ['report', 'Report Incident'],
  ['history', 'History'],
  ['admin', 'Admin & Analytics'],
]

function App() {
  const [currentView, setCurrentView] = useState('home')
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
              className={`app-nav-link ${currentView === view ? 'is-active' : ''}`}
              key={view}
              onClick={() => setCurrentView(view)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="app-content">
        {currentView === 'home' && <HomePage onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'safe-route' && <SafeRouteMap />}
        {currentView === 'report' && <IncidentReport onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'history' && <IncidentHistory onNavigate={(view) => setCurrentView(view)} />}
        {currentView === 'admin' && <AdminDashboard />}
      </div>
    </div>
  )
}

export default App
