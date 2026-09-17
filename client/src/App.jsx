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
  const [currentView, setCurrentView] = useState('admin') // 'admin', 'report', 'history', 'home'
  const [count, setCount] = useState(0)

  const navItems = [
    { id: 'admin', label: '📊 Neomorphic Admin', badge: 'Khushi' },
    { id: 'report', label: '🚨 Report Incident', badge: 'Rekha' },
    { id: 'history', label: '📜 Incident History', badge: 'Rekha' },
    { id: 'home', label: '🏠 Platform Portal', badge: 'Overview' },
  ]

  return (
    <div className="min-h-screen bg-[#0e131f] text-slate-200 flex flex-col font-mono">
      {/* Universal Neomorphic Nav Header */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[#121827] border-b border-slate-800/60 shadow-[0_8px_20px_rgba(3,6,12,0.8)] flex-wrap gap-3">
        {/* Left: Logo mark with glowing cyan beacon */}
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.9)] animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-widest text-cyan-400 uppercase font-sans">
              SAFEROUTE
            </span>
            <span className="text-[10px] tracking-widest text-slate-500 uppercase">
              // NEOMORPHIC PLATFORM
            </span>
          </div>
        </div>

        {/* Right: Neomorphic Tab Buttons */}
        <div className="neo-box-inset p-1.5 rounded-2xl flex items-center gap-2 flex-wrap">
          {navItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isActive
                    ? 'neo-button-cyan-active'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-slate-950/40 text-slate-950 font-black' : 'bg-slate-800/80 text-cyan-400'
                }`}>
                  {item.badge}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main Viewport */}
      <main className="flex-1">
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'report' && <IncidentReport />}
        {currentView === 'history' && <IncidentHistory />}
        {currentView === 'home' && (
          <div className="p-8 max-w-4xl mx-auto space-y-8">
            <section id="center" className="text-center space-y-4 py-8">
              <div className="hero inline-flex items-center justify-center gap-4">
                <img src={heroImg} className="base" width="140" height="150" alt="" />
                <img src={reactLogo} className="framework" alt="React logo" width="60" />
                <img src={viteLogo} className="vite" alt="Vite logo" width="60" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white font-sans">SafeRoute Platform</h1>
                <p className="text-sm text-slate-400 mt-1">Smart Public Safety & Emergency Assistance Platform</p>
              </div>
              <button
                type="button"
                className="neo-button px-5 py-2.5 rounded-2xl text-xs font-bold text-cyan-400 active:scale-95 transition-all"
                onClick={() => setCount((c) => c + 1)}
              >
                Count is {count}
              </button>
            </section>

            <section id="next-steps" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="docs" className="neo-box-convex rounded-3xl p-6 space-y-2">
                <h2 className="text-base font-bold text-white font-sans">Documentation</h2>
                <p className="text-xs text-slate-400">Neomorphic API specifications and contracts</p>
                <ul className="text-xs text-slate-300 space-y-2 pt-2">
                  <li>
                    <a href="https://vite.dev/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      Explore Vite & React 19
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/Ayushi2911/SafeRoute" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      GitHub Repository (Ayushi2911/SafeRoute)
                    </a>
                  </li>
                </ul>
              </div>

              <div id="social" className="neo-box-convex rounded-3xl p-6 space-y-2">
                <h2 className="text-base font-bold text-white font-sans">Tactile Safety Matrix</h2>
                <p className="text-xs text-slate-400">Real-time threat triage and emergency routing</p>
                <ul className="text-xs text-slate-300 space-y-2 pt-2">
                  <li className="text-emerald-400">
                    ✓ Multi-Factor Haversine Safety Algorithm Active
                  </li>
                  <li className="text-cyan-400">
                    ✓ 24-Hour Velocity Curve Integrated with MySQL
                  </li>
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
