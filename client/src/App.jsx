import { useState } from 'react'
import AdminDashboard from './components/admin/AdminDashboard'
import IncidentReport from './pages/IncidentReport'
import IncidentHistory from './pages/IncidentHistory'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './components/admin/admin.css'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('admin') // 'home', 'report', 'history', 'admin'
  const [count, setCount] = useState(0)

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#16171d',
      color: '#f3f4f6'
    }}>
      {/* Platform Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 28px',
        background: 'linear-gradient(135deg, #182030 0%, #0d1320 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <div>
            <span style={{
              fontWeight: 800,
              fontSize: '16px',
              color: '#7df4ff',
              letterSpacing: '0.04em',
              fontFamily: 'Space Grotesk, system-ui, sans-serif'
            }}>
              SAFEROUTE
            </span>
            <span style={{
              fontSize: '10px',
              color: '#849495',
              marginLeft: '8px',
              fontFamily: 'ui-monospace, JetBrains Mono, monospace'
            }}>
              // UNIFIED PLATFORM
            </span>
          </div>
        </div>

        {/* Navigation Switcher */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '7px 14px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              background: currentView === 'home' ? 'linear-gradient(135deg, #00f0ff 0%, #008b94 100%)' : '#141c2c',
              color: currentView === 'home' ? '#002022' : '#849495',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: currentView === 'home' ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🏠 Home
          </button>

          <button
            onClick={() => setCurrentView('report')}
            style={{
              padding: '7px 14px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              background: currentView === 'report' ? 'linear-gradient(135deg, #00f0ff 0%, #008b94 100%)' : '#141c2c',
              color: currentView === 'report' ? '#002022' : '#849495',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: currentView === 'report' ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            ⚠️ Report Incident
          </button>

          <button
            onClick={() => setCurrentView('history')}
            style={{
              padding: '7px 14px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              background: currentView === 'history' ? 'linear-gradient(135deg, #00f0ff 0%, #008b94 100%)' : '#141c2c',
              color: currentView === 'history' ? '#002022' : '#849495',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: currentView === 'history' ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            📜 History
          </button>

          <button
            onClick={() => setCurrentView('admin')}
            style={{
              padding: '7px 14px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              background: currentView === 'admin' ? 'linear-gradient(135deg, #00f0ff 0%, #008b94 100%)' : '#141c2c',
              color: currentView === 'admin' ? '#002022' : '#849495',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              boxShadow: currentView === 'admin' ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            📊 Admin & Analytics
          </button>
        </div>
      </nav>

      {/* Main View Area */}
      <div style={{ flex: 1 }}>
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'report' && <IncidentReport />}
        {currentView === 'history' && <IncidentHistory />}
        {currentView === 'home' && (
          <main style={{ padding: '30px' }}>
            <section id="center">
              <div className="hero">
                <img src={heroImg} className="base" width="170" height="179" alt="" />
                <img src={reactLogo} className="framework" alt="React logo" />
                <img src={viteLogo} className="vite" alt="Vite logo" />
              </div>
              <div>
                <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }}>SafeRoute Platform</h1>
                <p>Smart Public Safety & Emergency Assistance Platform</p>
              </div>
              <button
                type="button"
                className="counter"
                onClick={() => setCount((c) => c + 1)}
              >
                Count is {count}
              </button>
            </section>

            <div className="ticks"></div>

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
