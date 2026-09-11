import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react'
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
  const [_activeError, setActiveError] = useState<ApiErrorEvent | null>(null)

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

  const isOnline = pingStatus.online ?? true

  return (
    <>
      {/* ─── Minimal Bottom-Right Status Dot (Zero Clutter, No Header Overlap) ─── */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            if (!isOpen) checkHealth()
          }}
          className={cn(
            'tap w-8 h-8 rounded-full border shadow-md flex items-center justify-center transition-all backdrop-blur-md cursor-pointer hover:scale-110',
            isOnline
              ? 'bg-paper/90 border-emerald-500/30 shadow-emerald-500/10 hover:border-emerald-500/60'
              : 'bg-paper/90 border-red-500/30 shadow-red-500/10 hover:border-red-500/60'
          )}
          aria-label="Backend Status Indicator"
          title={isOnline ? `Backend Online (${pingStatus.latencyMs ?? 0}ms)` : 'Backend Offline'}
        >
          <span className="relative flex h-2.5 w-2.5">
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            )}
            <span
              className={cn(
                'relative inline-flex rounded-full h-2.5 w-2.5',
                isOnline ? 'bg-emerald-500' : 'bg-red-500'
              )}
            />
          </span>
        </button>
      </div>

      {/* ─── Compact Diagnostics Card ─────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed bottom-14 right-4 z-50 w-72 bg-paper text-obsidian rounded-2xl p-4 shadow-xl border border-line text-left"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-red-500')} />
                  <span className="text-[12px] font-semibold">Backend Status</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="tap p-1 rounded-lg text-obsidian/40 hover:text-obsidian hover:bg-bone transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              <div className="py-3 space-y-2 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-obsidian/60">Status:</span>
                  <span className={cn('font-semibold flex items-center gap-1', isOnline ? 'text-emerald-600' : 'text-danger')}>
                    {isOnline ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                    {isOnline ? `Online (${pingStatus.latencyMs ?? 0}ms)` : 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-obsidian/60">API URL:</span>
                  <span className="text-obsidian/80 text-[10px] truncate max-w-[140px]">{getApiBaseUrl()}</span>
                </div>
              </div>

              <button
                onClick={checkHealth}
                disabled={pingStatus.loading}
                className="tap w-full py-1.5 rounded-xl bg-obsidian text-paper text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-obsidian/90 transition shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={11} className={cn(pingStatus.loading && 'animate-spin')} />
                <span>{pingStatus.loading ? 'Pinging…' : 'Ping Backend'}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
