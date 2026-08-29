import { useState, useEffect } from 'react'

export type EnvironmentMode = 'live' | 'sandbox'

const STORAGE_KEY = 'ftc_environment_mode'
const CHANGE_EVENT = 'ftc_env_mode_changed'

export const DEFAULT_LIVE_API_URL = 'https://ftc-app-9n1s.onrender.com/api'

/**
 * Returns the effective API Base URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('ftc_custom_api_url')
    if (custom && custom.trim()) return custom.trim()
  }
  return import.meta.env.VITE_API_URL || DEFAULT_LIVE_API_URL
}

/**
 * Reads the current environment mode from localStorage.
 * Defaults to 'live' across all environments.
 */
export function getEnvironmentMode(): EnvironmentMode {
  if (typeof window === 'undefined') return 'live'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'live' || saved === 'sandbox') return saved
  return 'live'
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
 * Pings the backend health endpoint with timeout and detailed error reporting.
 */
export async function pingBackendHealth(apiUrl?: string): Promise<{
  online: boolean
  latencyMs: number
  targetUrl: string
  error?: string
}> {
  const base = apiUrl || getApiBaseUrl()
  const healthUrl = base.replace(/\/api\/?$/, '') + '/health'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12000)

  const start = performance.now()
  try {
    const res = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    const latency = Math.round(performance.now() - start)
    if (res.ok) {
      return { online: true, latencyMs: latency, targetUrl: healthUrl }
    }
    return { online: false, latencyMs: latency, targetUrl: healthUrl, error: `HTTP ${res.status}: ${res.statusText}` }
  } catch (err: any) {
    clearTimeout(timeoutId)
    const latency = Math.round(performance.now() - start)
    const isTimeout = err?.name === 'AbortError'
    const errorMsg = isTimeout
      ? 'Timeout (>12s) — Server might be in cold start spin-up'
      : err?.message || 'Network unreachable'
    return { online: false, latencyMs: latency, targetUrl: healthUrl, error: errorMsg }
  }
}
