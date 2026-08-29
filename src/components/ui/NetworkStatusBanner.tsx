import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi } from 'lucide-react'

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      setShowRestored(true)
      const timer = setTimeout(() => setShowRestored(false), 2800)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowRestored(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-obsidian text-paper text-[12px] font-medium shadow-2xl flex items-center gap-2 border border-line pointer-events-none"
        >
          <WifiOff size={14} className="text-danger animate-pulse" />
          <span>You're offline — showing cached data</span>
        </motion.div>
      )}

      {isOnline && showRestored && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-success text-paper text-[12px] font-semibold shadow-2xl flex items-center gap-2 pointer-events-none"
        >
          <Wifi size={14} />
          <span>Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
