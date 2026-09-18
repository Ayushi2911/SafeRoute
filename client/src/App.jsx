import { useState } from 'react'
import AdminDashboard from './components/admin/AdminDashboard'
import IncidentReport from './pages/IncidentReport'
import IncidentHistory from './pages/IncidentHistory'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './components/admin/admin.css'
import './App.css'

const navigationItems = [
  ['home', 'Home'],
  ['report', 'Report Incident'],
  ['history', 'History'],
  ['admin', 'Admin & Analytics'],
]

function App() {
  const [currentView, setCurrentView] = useState('admin')
  const [count, setCount] = useState(0)

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <button className="app-brand" type="button" onClick={() => setCurrentView('home')}>
          <span className="app-brand-mark" aria-hidden="true">S</span>
          <span className="app-brand-copy">
            <strong>SAFEROUTE</strong>
            <small>Public safety platform</small>
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
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'report' && <IncidentReport />}
        {currentView === 'history' && <IncidentHistory />}
        {currentView === 'home' && (
          <main className="home-page">
            <section className="home-hero" id="center">
              <div className="hero">
                <img src={heroImg} className="base" width="170" height="179" alt="" />
                <img src={reactLogo} className="framework" alt="React logo" />
                <img src={viteLogo} className="vite" alt="Vite logo" />
              </div>
              <div className="home-copy">
                <p className="home-eyebrow">COMMUNITY SAFETY, MADE CLEAR</p>
                <h1>SafeRoute Platform</h1>
                <p>Report concerns, follow updates, and help keep your community informed.</p>
              </div>
              <button
                type="button"
                className="counter"
                onClick={() => setCount((value) => value + 1)}
              >
                Count is {count}
              </button>
            </section>

            <div className="ticks" />

            <section id="next-steps">
              <div id="docs">
                <svg className="icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#documentation-icon"></use>
                </svg>
                <h2>Documentation</h2>
                <p>Your questions, answered</p>
                <ul>
                  <li>
                    <a href="https://vite.dev/" target="_blank" rel="noreferrer">
                      <img className="logo" src={viteLogo} alt="" />
                      Explore Vite
                    </a>
                  </li>
                  <li>
                    <a href="https://react.dev/" target="_blank" rel="noreferrer">
                      <img className="button-icon" src={reactLogo} alt="" />
                      Learn more
                    </a>
                  </li>
                </ul>
              </div>
              <div id="social">
                <svg className="icon" role="presentation" aria-hidden="true">
                  <use href="/icons.svg#social-icon"></use>
                </svg>
                <h2>Connect with us</h2>
                <p>Join the SafeRoute Community</p>
                <ul>
                  <li>
                    <a href="https://github.com/Ayushi2911/SafeRoute" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#github-icon"></use>
                      </svg>
                      GitHub Repo
                    </a>
                  </li>
                  <li>
                    <a href="https://chat.vite.dev/" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#discord-icon"></use>
                      </svg>
                      Discord
                    </a>
                  </li>
                </ul>
              </div>
            </section>
          </main>
        )}
      </div>
    </div>
  )
}

export default App
