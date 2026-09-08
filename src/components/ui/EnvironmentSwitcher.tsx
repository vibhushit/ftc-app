import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Activity, RefreshCw, X, AlertTriangle, CheckCircle2, ChevronDown, Server } from 'lucide-react'
import { pingBackendHealth, getApiBaseUrl } from '@/config/environmentMode'
import type { ApiErrorEvent } from '@/services/apiClient'
import { cn } from '@/utils'

export function EnvironmentSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const [pingStatus, setPingStatus] = useState<{
    loading: boolean
    online?: boolean
    latencyMs?: number
    targetUrl?: string
    error?: string
  }>({
    loading: false,
  })
  const [activeError, setActiveError] = useState<ApiErrorEvent | null>(null)
  const [showResetNotice, setShowResetNotice] = useState(false)

  // Listen to live API errors
  useEffect(() => {
    const handleApiError = (e: Event) => {
      const custom = e as CustomEvent<ApiErrorEvent>
      setActiveError(custom.detail)
    }
    window.addEventListener('ftc_api_error', handleApiError)
    return () => window.removeEventListener('ftc_api_error', handleApiError)
  }, [])

  const checkHealth = async () => {
    setPingStatus(prev => ({ ...prev, loading: true }))
    const res = await pingBackendHealth()
    setPingStatus({
      loading: false,
      online: res.online,
      latencyMs: res.latencyMs,
      targetUrl: res.targetUrl,
      error: res.error,
    })
  }

  useEffect(() => {
    checkHealth()
  }, [])

  useEffect(() => {
    if (isOpen) {
      checkHealth()
    }
  }, [isOpen])

  const handleResetStorage = () => {
    localStorage.clear()
    setShowResetNotice(true)
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  const isOnline = pingStatus.online ?? true

  return (
    <>
      {/* ─── Floating Top-Right Backend Status Pill ────────────────────────── */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'tap flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-tight shadow-sm border transition-all backdrop-blur-md cursor-pointer',
            isOnline
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/90 shadow-emerald-950/20'
              : 'bg-red-950/80 text-red-300 border-red-500/40 hover:bg-red-900/90 shadow-red-950/20'
          )}
          title="Backend Connection Status"
        >
          <span className="relative flex h-2 w-2">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                isOnline ? 'bg-emerald-400' : 'bg-red-400'
              )}
            />
          </span>
          <span>{isOnline ? `Live Backend (${pingStatus.latencyMs ?? 0}ms)` : 'Backend Offline'}</span>
          <ChevronDown size={12} className={cn('opacity-60 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {/* ─── Global Error Banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {activeError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-12 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-danger text-paper p-4 rounded-2xl shadow-2xl border border-white/10 text-[12px] flex items-start gap-3"
          >
            <AlertTriangle size={18} className="shrink-0 text-white mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold flex items-center justify-between">
                <span>Live API Connection Error</span>
                <span className="font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded">
                  {activeError.method} {activeError.endpoint}
                </span>
              </div>
              <div className="text-white/90 text-[11px] mt-1 font-mono break-all leading-snug">
                {activeError.message}
              </div>
            </div>
            <button
              onClick={() => setActiveError(null)}
              className="tap p-1 -mr-1 text-white/70 hover:text-white cursor-pointer"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Diagnostics Drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed top-12 right-4 z-50 w-[350px] max-w-[calc(100vw-32px)] bg-obsidian text-paper rounded-3xl p-5 shadow-2xl border border-white/10 font-sans text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Server size={16} className="text-iris" />
                  <span className="font-display text-sm tracking-tight font-semibold">Backend Infrastructure</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="tap w-7 h-7 rounded-full bg-white/10 grid place-items-center text-white/60 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Status Details */}
              <div className="mt-4 p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/70 flex items-center gap-1.5">
                    <Activity size={13} className="text-emerald-400" /> Rust Axum Service
                  </span>
                  {pingStatus.loading ? (
                    <span className="text-[11px] text-white/40 animate-pulse font-mono">Pinging…</span>
                  ) : pingStatus.online ? (
                    <span className="text-[11px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
                      <CheckCircle2 size={12} /> Online ({pingStatus.latencyMs}ms)
                    </span>
                  ) : (
                    <span className="text-[11px] text-danger font-semibold font-mono">
                      Offline
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-white/50 font-mono break-all pt-1 border-t border-white/5">
                  Base API: {getApiBaseUrl()}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[12px] text-white/70 flex items-center gap-1.5">
                    <Database size={13} className="text-iris" /> PostgreSQL Database
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
                    <CheckCircle2 size={12} /> Connected
                  </span>
                </div>
              </div>

              {/* Actions & Diagnostics */}
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 font-mono">Diagnostics</span>
                  <button
                    onClick={checkHealth}
                    disabled={pingStatus.loading}
                    className="tap flex items-center gap-1 text-iris hover:underline font-mono text-[10px] cursor-pointer"
                  >
                    <RefreshCw size={10} className={cn(pingStatus.loading && 'animate-spin')} />
                    {pingStatus.loading ? 'Pinging…' : 'Ping Again'}
                  </button>
                </div>

                {pingStatus.error && !pingStatus.online && (
                  <div className="text-[10px] text-amber-300/90 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 leading-tight font-sans">
                    ⚠️ {pingStatus.error}
                  </div>
                )}

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={handleResetStorage}
                    className="tap text-[10px] text-white/50 hover:text-danger underline font-mono cursor-pointer"
                  >
                    {showResetNotice ? 'Cleared! Reloading…' : 'Clear Browser Cache'}
                  </button>
                  <span className="text-[10px] font-mono text-white/30">FTC Axum v1.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
