import { useState } from 'react'
import AdminDashboard from './components/admin/AdminDashboard'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('admin')
  const [count, setCount] = useState(0)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Platform Navigation Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#6366f1', letterSpacing: '-0.02em' }}>SafeRoute</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: currentView === 'home' ? '#6366f1' : '#1e293b',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            🏠 Home View
          </button>
          
          <button
            onClick={() => setCurrentView('admin')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: currentView === 'admin' ? '#6366f1' : '#1e293b',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            📊 Admin & Analytics
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        {currentView === 'admin' ? (
          <AdminDashboard />
        ) : (
          <main>
            <section id="center">
              <div className="hero">
                <img src={heroImg} className="base" width="170" height="179" alt="" />
                <img src={reactLogo} className="framework" alt="React logo" />
                <img src={viteLogo} className="vite" alt="Vite logo" />
              </div>
              <div>
                <h1>SafeRoute Platform</h1>
                <p>
                  Smart Public Safety & Emergency Assistance Platform
                </p>
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
                <p>Join the Vite community</p>
                <ul>
                  <li>
                    <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#github-icon"></use>
                      </svg>
                      GitHub
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
                  <li>
                    <a href="https://x.com/vite_js" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#x-icon"></use>
                      </svg>
                      X.com
                    </a>
                  </li>
                  <li>
                    <a href="https://bsky.app/profile/vite.dev" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href="/icons.svg#bluesky-icon"></use>
                      </svg>
                      Bluesky
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <div className="ticks"></div>
            <section id="spacer"></section>
          </main>
        )}
      </div>
    </div>
  )
}

export default App
