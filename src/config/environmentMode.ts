import { useState, useEffect } from 'react'

export type EnvironmentMode = 'live' | 'sandbox'

const STORAGE_KEY = 'ftc_environment_mode'
const CHANGE_EVENT = 'ftc_env_mode_changed'

/**
 * Reads the current environment mode from localStorage.
 * Defaults to 'sandbox' in development/local unless explicitly set.
 */
export function getEnvironmentMode(): EnvironmentMode {
  if (typeof window === 'undefined') return 'sandbox'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'live' || saved === 'sandbox') return saved
  
  // Default to live on production domain, sandbox elsewhere
  if (window.location.hostname.includes('findtoconnect.com')) {
    return 'live'
  }
  return 'sandbox'
}

/**
 * Returns true if the platform is running in strict Live Mode.
 */
export function isLiveMode(): boolean {
  return getEnvironmentMode() === 'live'
}

/**
 * Updates the environment mode in localStorage and dispatches a global change event.
 */
export function setEnvironmentMode(mode: EnvironmentMode): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, mode)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: mode }))
}

/**
 * React Hook to subscribe to environment mode changes reactively.
 */
export function useEnvironmentMode(): [EnvironmentMode, (mode: EnvironmentMode) => void] {
  const [mode, setMode] = useState<EnvironmentMode>(getEnvironmentMode)

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setMode(getEnvironmentMode())
      }
    }
    const handleCustom = (e: Event) => {
      const custom = e as CustomEvent<EnvironmentMode>
      setMode(custom.detail || getEnvironmentMode())
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(CHANGE_EVENT, handleCustom)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(CHANGE_EVENT, handleCustom)
    }
  }, [])

  const updateMode = (newMode: EnvironmentMode) => {
    setEnvironmentMode(newMode)
    setMode(newMode)
  }

  return [mode, updateMode]
}

/**
 * Pings the backend health endpoint and returns latency in milliseconds.
 */
export async function pingBackendHealth(apiUrl?: string): Promise<{ online: boolean; latencyMs: number; error?: string }> {
  const base = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  // Strip trailing /api to reach root /health
  const healthUrl = base.replace(/\/api\/?$/, '') + '/health'

  const start = performance.now()
  try {
    const res = await fetch(healthUrl, { method: 'GET', cache: 'no-store' })
    const latency = Math.round(performance.now() - start)
    if (res.ok) {
      return { online: true, latencyMs: latency }
    }
    return { online: false, latencyMs: latency, error: `HTTP ${res.status}` }
  } catch (err: any) {
    const latency = Math.round(performance.now() - start)
    return { online: false, latencyMs: latency, error: err?.message || 'Network unreachable' }
  }
}
