import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneMode() {
  const supportsMatchMedia = typeof window.matchMedia === 'function'
  return (
    (supportsMatchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function usePwaState() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode())
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleInstalled() {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      setUpdateReady(true)
    })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const outcome = await deferredPrompt.userChoice
    if (outcome.outcome === 'accepted') {
      setDeferredPrompt(null)
      return true
    }
    return false
  }

  return {
    isOnline,
    isInstalled,
    canInstall: Boolean(deferredPrompt) && !isInstalled,
    updateReady,
    promptInstall,
  }
}
