import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Database, Activity, RefreshCw, X, AlertTriangle, CheckCircle2, ChevronDown, HelpCircle, ExternalLink } from 'lucide-react'
import { useEnvironmentMode, pingBackendHealth, getApiBaseUrl, type EnvironmentMode } from '@/config/environmentMode'
import type { ApiErrorEvent } from '@/services/apiClient'
import { cn } from '@/utils'

export function EnvironmentSwitcher() {
  const [mode, setMode] = useEnvironmentMode()
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
    if (isOpen) {
      checkHealth()
    }
  }, [isOpen])

  const handleToggle = (newMode: EnvironmentMode) => {
    setMode(newMode)
    setIsOpen(false)
    window.location.reload()
  }

  const handleResetStorage = () => {
    localStorage.clear()
    setShowResetNotice(true)
    setTimeout(() => {
      window.location.reload()
    }, 800)
  }

  const isLive = mode === 'live'

  return (
    <>
      {/* ─── Floating Top-Right Pill Switcher ──────────────────────────────── */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'tap flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium tracking-tight shadow-sm border transition-all backdrop-blur-md',
            isLive
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/90 shadow-emerald-950/20'
              : 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/90 shadow-amber-950/20'
          )}
          title="Click to toggle between Live API and Sandbox Mock mode"
        >
          <span className="relative flex h-2 w-2">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                isLive ? 'bg-emerald-400' : 'bg-amber-400'
              )}
            />
          </span>
          <span>{isLive ? 'Live API' : 'Sandbox Mock'}</span>
          <ChevronDown size={12} className={cn('opacity-60 transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>

      {/* ─── Global Error Banner in Live Mode ─────────────────────────────── */}
      <AnimatePresence>
        {activeError && isLive && (
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
              <div className="mt-2 text-[10px] text-white/70">
                Tip: If Render server was idle, wait 30s for it to spin up, or switch to Sandbox Mode.
              </div>
            </div>
            <button
              onClick={() => setActiveError(null)}
              className="tap p-1 -mr-1 text-white/70 hover:text-white"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Flyout Settings Modal ────────────────────────────────────────── */}
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
                  <Activity size={16} className="text-iris" />
                  <span className="font-display text-sm tracking-tight font-semibold">Environment Mode</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="tap w-7 h-7 rounded-full bg-white/10 grid place-items-center text-white/60 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Mode Selection Cards */}
              <div className="mt-4 space-y-2">
                {/* Live Mode Card */}
                <button
                  onClick={() => handleToggle('live')}
                  className={cn(
                    'tap w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all',
                    isLive
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-200 shadow-sm'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className={cn('p-2 rounded-xl mt-0.5', isLive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50')}>
                    <Database size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px] text-white">Live Production Mode</span>
                      {isLive && <CheckCircle2 size={15} className="text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                      Connects directly to Render Rust API & Supabase PostgreSQL.
                    </p>
                  </div>
                </button>

                {/* Sandbox Mode Card */}
                <button
                  onClick={() => handleToggle('sandbox')}
                  className={cn(
                    'tap w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all',
                    !isLive
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 shadow-sm'
                      : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className={cn('p-2 rounded-xl mt-0.5', !isLive ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/50')}>
                    <Radio size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px] text-white">Sandbox / Demo Mode</span>
                      {!isLive && <CheckCircle2 size={15} className="text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-snug">
                      Instant in-memory store. 1-click test logins with zero network latency.
                    </p>
                  </div>
                </button>
              </div>

              {/* Backend Diagnostics */}
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/50 font-mono">Backend Health Check</span>
                  <button
                    onClick={checkHealth}
                    disabled={pingStatus.loading}
                    className="tap flex items-center gap-1 text-iris hover:underline font-mono text-[10px]"
                  >
                    <RefreshCw size={10} className={cn(pingStatus.loading && 'animate-spin')} />
                    {pingStatus.loading ? 'Pinging…' : 'Ping Again'}
                  </button>
                </div>

                <div className="bg-white/5 rounded-xl p-2.5 font-mono text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Render Web Service:</span>
                    {pingStatus.loading ? (
                      <span className="text-white/40 animate-pulse">Checking…</span>
                    ) : pingStatus.online ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        Online ({pingStatus.latencyMs}ms)
                      </span>
                    ) : (
                      <span className="text-danger font-semibold">
                        Unreachable
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] text-white/40 truncate" title={pingStatus.targetUrl || getApiBaseUrl()}>
                    Endpoint: {pingStatus.targetUrl || getApiBaseUrl()}
                  </div>
                  {pingStatus.error && !pingStatus.online && (
                    <div className="text-[10px] text-amber-300/90 pt-1 border-t border-white/5 font-sans leading-tight">
                      ℹ️ {pingStatus.error}. (Render Free instances sleep after 15m inactivity and take ~30s on first spin-up).
                    </div>
                  )}
                </div>

                {/* Reset Local Storage Explanation */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div className="group relative flex items-center gap-1">
                    <button
                      onClick={handleResetStorage}
                      className="tap text-[10px] text-white/50 hover:text-danger underline font-mono cursor-pointer"
                    >
                      {showResetNotice ? 'Cleared! Reloading…' : 'Reset Local Storage'}
                    </button>
                    <span className="text-[10px] text-white/30 cursor-help" title="Clears browser session, role cookies, and saved filters to simulate a fresh first-time visit.">
                      <HelpCircle size={11} />
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/30">FTC v1.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
