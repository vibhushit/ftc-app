import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrandIcon } from './BrandIcon'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { apiClient } from '@/services/apiClient'
import { useQueryClient } from '@tanstack/react-query'

// Global flag: once confirmed online in this browser session, never show the overlay again.
let hasBackendWarmedUp = false

const EXPECTED_COLD_START_MS = 35_000
const GRACE_PERIOD_MS = 1200

export function BackendWarmupOverlay() {
  const queryClient = useQueryClient()

  const [visible, setVisible]         = useState(false)
  const [status, setStatus]           = useState<'checking' | 'waking' | 'connected' | 'overtime'>('checking')
  const [progress, setProgress]       = useState(0)
  const [remainingSec, setRemaining]  = useState(35)
  const [retrying, setRetrying]       = useState(false)

  const isMountedRef                  = useRef(true)
  const startTimeRef                  = useRef<number | null>(null)
  const intervalRef                   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    if (hasBackendWarmedUp) return

    let pollTimer: ReturnType<typeof setTimeout> | null = null

    // Grace timer: only show overlay if the server doesn't respond within 1200ms
    const graceTimer = setTimeout(() => {
      if (!hasBackendWarmedUp && isMountedRef.current) {
        setVisible(true)
        setStatus('waking')
        startTimeRef.current = Date.now()
        startProgressBar()
      }
    }, GRACE_PERIOD_MS)

    const checkServer = async () => {
      try {
        const isOk = await apiClient.checkHealth()
        if (isOk) {
          handleSuccess()
          return
        }
      } catch {}

      // If not yet ok and still mounted, keep polling every 3 seconds
      if (!hasBackendWarmedUp && isMountedRef.current) {
        pollTimer = setTimeout(checkServer, 3000)
      }
    }

    const handleSuccess = () => {
      clearTimeout(graceTimer)
      if (pollTimer) clearTimeout(pollTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)

      hasBackendWarmedUp = true

      if (isMountedRef.current) {
        setProgress(100)
        setStatus('connected')
        // Invalidate active queries so Home and Discover screens immediately fetch live creators
        queryClient.invalidateQueries()

        // Smoothly dissolve after brief success confirmation
        setTimeout(() => {
          if (isMountedRef.current) {
            setVisible(false)
          }
        }, 550)
      }
    }

    const startProgressBar = () => {
      intervalRef.current = setInterval(() => {
        if (!startTimeRef.current || hasBackendWarmedUp || !isMountedRef.current) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          return
        }

        const elapsed = Date.now() - startTimeRef.current
        const leftSec = Math.max(0, Math.ceil((EXPECTED_COLD_START_MS - elapsed) / 1000))
        setRemaining(leftSec)

        if (elapsed > 45_000) {
          setStatus('overtime')
        }

        // Smooth ease up to 92% (holds at 92% until server genuinely returns 200)
        const calculatedProgress = Math.min(92, Math.round((elapsed / EXPECTED_COLD_START_MS) * 92))
        setProgress(calculatedProgress)
      }, 100)
    }

    // Initial ping
    checkServer()

    return () => {
      isMountedRef.current = false
      clearTimeout(graceTimer)
      if (pollTimer) clearTimeout(pollTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [queryClient])

  const handleManualRetry = async () => {
    if (retrying) return
    setRetrying(true)
    try {
      const isOk = await apiClient.checkHealth()
      if (isOk) {
        hasBackendWarmedUp = true
        setProgress(100)
        setStatus('connected')
        queryClient.invalidateQueries()
        setTimeout(() => setVisible(false), 550)
      }
    } finally {
      setRetrying(false)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-paper/65 backdrop-blur-md select-none"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -4 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="w-full max-w-[340px] bg-paper rounded-3xl border border-line p-6 shadow-2xl flex flex-col items-center text-center"
          >
            {/* Top Brand Mark with state indicator */}
            <div className="relative mb-4">
              <BrandIcon size={44} />
              {status === 'connected' ? (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 bg-paper rounded-full items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </span>
              ) : (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              )}
            </div>

            {/* Heading */}
            <h2 className="font-display text-[19px] tracking-tight text-obsidian mb-1">
              {status === 'connected'
                ? 'Connected!'
                : status === 'overtime'
                ? 'Taking a moment longer…'
                : 'Connecting to live server…'}
            </h2>

            {/* Subtext */}
            <p className="text-[12px] text-obsidian/60 leading-relaxed mb-5 max-w-[260px]">
              {status === 'connected'
                ? 'Backend is online. Loading marketplace…'
                : status === 'overtime'
                ? 'Render container is still spinning up. Thank you for your patience.'
                : 'Our cloud service is waking up from idle. This takes about 35 seconds.'}
            </p>

            {/* Progress Bar Container */}
            <div className="w-full bg-bone rounded-full h-2 overflow-hidden mb-2.5 border border-line/60">
              <motion.div
                className="h-full bg-obsidian rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

            {/* Labels below bar */}
            <div className="w-full flex items-center justify-between text-[11px] font-mono text-obsidian/45">
              <span>{status === 'connected' ? 'Ready' : 'Waking up container'}</span>
              <span>
                {status === 'connected'
                  ? '100%'
                  : remainingSec > 0
                  ? `~${remainingSec}s left`
                  : 'Almost ready…'}
              </span>
            </div>

            {/* Overtime manual retry */}
            {status === 'overtime' && (
              <button
                type="button"
                onClick={handleManualRetry}
                disabled={retrying}
                className="tap mt-4 px-4 py-2 rounded-xl bg-bone border border-line text-[11.5px] font-semibold text-obsidian hover:bg-bone/80 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={12} className={retrying ? 'animate-spin' : ''} />
                <span>{retrying ? 'Pinging server…' : 'Retry connection'}</span>
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

