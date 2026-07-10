import { useState, useEffect } from 'react'
import { cn, formatTime } from '@/utils'

interface StatusBarProps {
  dark?: boolean
}

export function StatusBar({ dark = false }: StatusBarProps) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className={cn('status-bar', dark ? 'text-paper' : 'text-obsidian')}>
      <span>{formatTime(time)}</span>
      <div className="flex items-center gap-1">
        {/* Signal bars */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
          <path d="M1 10 L1 8 M5 10 L5 6 M9 10 L9 4 M13 10 L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* Wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path d="M7.5 2.5 A 4 4 0 0 1 11.5 6.5 M7.5 5 A 2 2 0 0 1 9.5 7 M7.5 7.5 A 0.5 0.5 0 0 1 8 8 A 0.5 0.5 0 0 1 7.5 8.5 A 0.5 0.5 0 0 1 7 8 A 0.5 0.5 0 0 1 7.5 7.5 Z M7.5 5 A 2 2 0 0 0 5.5 7 M7.5 2.5 A 4 4 0 0 0 3.5 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="currentColor" />
        </svg>
        {/* Battery */}
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="1" y="1" width="20" height="9" rx="2.5" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1" fill="none" />
          <rect x="2.5" y="2.5" width="16" height="6" rx="1.5" fill="currentColor" />
          <rect x="22" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  )
}
