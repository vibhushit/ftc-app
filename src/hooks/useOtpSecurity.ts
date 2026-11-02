import { useState, useEffect, useCallback, useRef } from 'react'

const MAX_ATTEMPTS = 3
const EXPIRY_MS = 10 * 60 * 1000 // 10 minutes

export function useOtpSecurity(initialCooldown = 0) {
  const [otp, setOtp]                 = useState<string[]>(['', '', '', '', '', ''])
  const [failedAttempts, setAttempts] = useState(0)
  const [resendCount, setResendCount] = useState(0)
  const resendCountRef                = useRef(0)
  const [cooldown, setCooldown]       = useState(initialCooldown)
  const [otpSentAt, setOtpSentAt]     = useState<number | null>(null)
  const [isExpired, setIsExpired]     = useState(false)

  // Countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // 10-minute validity window checker
  useEffect(() => {
    if (!otpSentAt) return

    const checkExpiry = () => {
      const elapsed = Date.now() - otpSentAt
      if (elapsed > EXPIRY_MS) {
        setIsExpired(true)
      }
    }

    checkExpiry()
    const interval = setInterval(checkExpiry, 10000)
    return () => clearInterval(interval)
  }, [otpSentAt])

  /**
   * Called whenever a new OTP is successfully dispatched to the user.
   * Calculates exponential backoff based on previous resend requests.
   */
  const recordCodeSent = useCallback(() => {
    setAttempts(0)
    setIsExpired(false)
    setOtp(['', '', '', '', '', ''])
    setOtpSentAt(Date.now())

    // Backoff schedule:
    // 0 or 1 resend: 60s
    // 2 or 3 resends: 120s (2m)
    // 4+ resends: 300s (5m)
    const currentCount = resendCountRef.current
    let backoffSeconds = 60
    if (currentCount >= 3) {
      backoffSeconds = 300
    } else if (currentCount >= 1) {
      backoffSeconds = 120
    }

    const nextCount = currentCount + 1
    resendCountRef.current = nextCount
    setResendCount(nextCount)
    setCooldown(backoffSeconds)
  }, [])

  /**
   * Records a failed verification attempt.
   * Returns a clean, user-friendly security notice.
   */
  const recordFailedAttempt = useCallback((): { isLocked: boolean; errorNotice: string } => {
    const nextAttempts = failedAttempts + 1
    setAttempts(nextAttempts)
    setOtp(['', '', '', '', '', ''])

    if (nextAttempts >= MAX_ATTEMPTS) {
      return {
        isLocked: true,
        errorNotice: 'Too many incorrect attempts (3/3). For your security, this code has been invalidated. Please request a new code.',
      }
    }

    const remaining = MAX_ATTEMPTS - nextAttempts
    return {
      isLocked: false,
      errorNotice: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    }
  }, [failedAttempts])

  /**
   * Formats remaining cooldown seconds into human-readable text.
   * e.g. "45s" or "1m 30s" or "4m 50s".
   */
  const formatCooldown = useCallback((sec: number): string => {
    if (sec < 60) return `${sec}s`
    const mins = Math.floor(sec / 60)
    const rem = sec % 60
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`
  }, [])

  const isLocked = failedAttempts >= MAX_ATTEMPTS || isExpired

  return {
    otp,
    setOtp,
    failedAttempts,
    maxAttempts: MAX_ATTEMPTS,
    isLocked,
    isExpired,
    cooldown,
    resendCount,
    recordCodeSent,
    recordFailedAttempt,
    formatCooldown,
  }
}

