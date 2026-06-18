import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** iOS (iPhone/iPad) — including iPadOS 13+ which reports as macOS but has touch. */
function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return true
  return /macintosh/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document
}

/** Already running as an installed PWA (so no install affordance is needed). */
function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const displayMode = window.matchMedia?.('(display-mode: standalone)').matches
  // iOS Safari exposes navigator.standalone when launched from the home screen.
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true
  return Boolean(displayMode) || iosStandalone
}

/**
 * Captures the browser's install prompt (Chrome/Edge/Android). iOS Safari has
 * no such event — there `isIOS` is true and the UI shows manual
 * "Share → Add to Home Screen" instructions instead.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIOS] = useState(detectIOS)
  const [isStandalone] = useState(detectStandalone)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  return {
    /** Android/Chromium: a native install prompt is ready. */
    canInstall: Boolean(deferred) && !installed,
    promptInstall,
    /** Whether the device is iOS (needs manual Add to Home Screen). */
    isIOS,
    /** Already installed / launched from the home screen. */
    isStandalone,
    /** Show the iOS manual-install affordance. */
    showIOSInstall: isIOS && !isStandalone && !installed,
  }
}
