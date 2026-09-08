/**
 * FTC Platform Environment & API Configuration
 * 
 * Single source of truth for resolving API base URLs and backend health.
 * The platform operates strictly in Live Mode connecting to the Axum backend.
 */

export type EnvironmentMode = 'live'

export const DEFAULT_LIVE_API_URL = 'http://localhost:3000/api'

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
 * The platform operates exclusively in live database-backed mode.
 */
export function getEnvironmentMode(): EnvironmentMode {
  return 'live'
}

/**
 * Returns true. Platform runs in live mode without mock branching.
 */
export function isLiveMode(): boolean {
  return true
}

/**
 * Deprecated: Kept for temporary backward compatibility during screen refactoring.
 */
export function setEnvironmentMode(_mode: string): void {
  // No-op: Sandbox mode is removed; the backend is the single source of truth.
}

/**
 * Hook returning static live mode.
 */
export function useEnvironmentMode(): [EnvironmentMode, (mode: any) => void] {
  return ['live', () => {}]
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
      ? 'Timeout (>12s) — Server might be offline or starting up'
      : err?.message || 'Backend unreachable'
    return { online: false, latencyMs: latency, targetUrl: healthUrl, error: errorMsg }
  }
}
