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

  return (
    <div className="min-h-screen bg-[#050811] text-slate-200 flex flex-col font-mono">
      {/* Top Navigation Bar adhering to Global Theme */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[#0c1322] border-b border-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.8)] flex-wrap gap-3">
        {/* Left: Logo mark (blue glowing dot) + "SAFEROUTE // UNIFIED PLATFORM" */}
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-widest text-cyan-400 uppercase font-sans">
              SAFEROUTE
            </span>
            <span className="text-[10px] tracking-widest text-slate-500 uppercase">
              // UNIFIED PLATFORM
            </span>
          </div>
        </div>

        {/* Right: Tactile tab buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* HOME */}
          <button
            onClick={() => setCurrentView('home')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border ${
              currentView === 'home'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                : 'bg-[#141d30] text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-[#1a2640]'
            }`}
          >
            HOME
          </button>

          {/* ADMIN & ANALYTICS (Highlighted in Cyan) */}
          <button
            onClick={() => setCurrentView('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border ${
              currentView === 'admin'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                : 'bg-[#141d30] text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-[#1a2640]'
            }`}
          >
            ADMIN & ANALYTICS
          </button>

          {/* REPORT INCIDENT */}
          <button
            onClick={() => setCurrentView('report')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border ${
              currentView === 'report'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                : 'bg-[#141d30] text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-[#1a2640]'
            }`}
          >
            REPORT INCIDENT
          </button>

          {/* INCIDENT HISTORY */}
          <button
            onClick={() => setCurrentView('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border ${
              currentView === 'history'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                : 'bg-[#141d30] text-slate-400 border-slate-700/80 hover:text-slate-200 hover:bg-[#1a2640]'
            }`}
          >
            HISTORY
          </button>
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
                className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-cyan-400 hover:bg-slate-800 active:scale-95 transition-all shadow-md"
                onClick={() => setCount((c) => c + 1)}
              >
                Count is {count}
              </button>
            </section>

            <section id="next-steps" className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div id="docs" className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
                <h2 className="text-base font-bold text-white">Documentation</h2>
                <p className="text-xs text-slate-400">Tactile API specifications and contracts</p>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                  <li>
                    <a href="https://vite.dev/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      Explore Vite
                    </a>
                  </li>
                  <li>
                    <a href="https://react.dev/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      Learn React 19
                    </a>
                  </li>
                </ul>
              </div>

              <div id="social" className="bg-[#0c1322] border border-slate-800 rounded-xl p-5 shadow-lg space-y-2">
                <h2 className="text-base font-bold text-white">Repository</h2>
                <p className="text-xs text-slate-400">Join the SafeRoute Community</p>
                <ul className="text-xs text-slate-300 space-y-1.5 pt-2">
                  <li>
                    <a href="https://github.com/Ayushi2911/SafeRoute" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                      GitHub Repository (Ayushi2911/SafeRoute)
                    </a>
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
