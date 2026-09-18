import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import './InstallPrompt.css'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('saferoute_pwa_dismissed') === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) {
      return undefined
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault()
      // Stash event for manual trigger
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstallable(false)
      setDeferredPrompt(null)
      sessionStorage.removeItem('saferoute_pwa_dismissed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstallable(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('saferoute_pwa_dismissed', 'true')
  }

  if (!isInstallable) {
    return null
  }

  return (
    <>
      {/* Discreet button in header/nav */}
      <button
        className="pwa-nav-install-btn"
        onClick={handleInstallClick}
        title="Install SafeRoute as an app"
        type="button"
      >
        <Download size={14} className="pwa-install-icon" />
        <span>Install App</span>
      </button>

      {/* Floating subtle banner (if not dismissed) */}
      {!dismissed && (
        <aside className="pwa-install-banner" aria-label="App installation notice">
          <div className="pwa-banner-icon-wrap" aria-hidden="true">
            <Smartphone size={20} className="pwa-banner-icon" />
          </div>
          <div className="pwa-banner-info">
            <p className="pwa-banner-title">Install SafeRoute</p>
            <p className="pwa-banner-desc">Add to Home screen for quick emergency access and offline maps.</p>
          </div>
          <div className="pwa-banner-actions">
            <button
              className="pwa-banner-btn-install"
              onClick={handleInstallClick}
              type="button"
            >
              Install
            </button>
            <button
              className="pwa-banner-btn-dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss installation prompt"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        </aside>
      )}
    </>
  )
}
