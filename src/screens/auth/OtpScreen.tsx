import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { useOtpSecurity } from '@/hooks/useOtpSecurity'
import { cn } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

export function OtpScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const {
    otp: code,
    setOtp: setCode,
    isLocked,
    isExpired,
    cooldown,
    recordCodeSent,
    recordFailedAttempt,
    formatCooldown,
  } = useOtpSecurity(45)

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const handleChange = (i: number, val: string) => {
    if (isLocked) return
    const digits = val.replace(/\D/g, '')
    if (!digits) {
      const next = [...code]
      next[i] = ''
      setCode(next)
      return
    }

    const char = digits[digits.length - 1]
    const next = [...code]
    next[i] = char
    setCode(next)
    setError('')

    if (i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const handleResend = async () => {
    if (cooldown > 0 || loading) return
    setError('')
    recordCodeSent()
    inputs.current[0]?.focus()
  }

  const submitOtp = useCallback(async (otpCode: string) => {
    if (isLocked || loading) return
    setLoading(true)
    setError('')
    try {
      if (supabaseAvailable) {
        const isEmail = (pendingPhone || '').includes('@')
        await authApi.verifyOtp(pendingPhone || '', otpCode, isEmail ? 'email' : 'sms')
      }
      dispatch({ type: 'GO', screen: 'role' })
    } catch (e: any) {
      const { isLocked: locked, errorNotice } = recordFailedAttempt()
      setError(locked ? errorNotice : (e?.message || errorNotice))
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [pendingPhone, dispatch, isLocked, loading, recordFailedAttempt])

  useEffect(() => {
    const full = code.join('')
    if (full.length === 6 && !isLocked) submitOtp(full)
  }, [code, isLocked, submitOtp])

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      <div className="px-6 py-4 flex items-center">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="flex-1 px-8 pt-4 pb-8 flex flex-col justify-between max-w-sm mx-auto w-full">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight leading-tight">
            Enter the<br /><span className="italic">6-digit code</span>
          </h1>
          <p className="mt-3 text-[13px] text-obsidian/60">
            Sent to <span className="font-semibold text-obsidian">{pendingPhone || '+91 98765 43210'}</span>
          </p>

          <div className="flex gap-2.5 mt-8 justify-between">
            {code.map((c, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={c}
                disabled={loading || isLocked}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={cn(
                  'w-12 h-14 rounded-2xl border-2 bg-bone/30 text-center font-mono text-2xl outline-none transition disabled:opacity-40',
                  isLocked ? 'border-rose-300 bg-rose-50 text-rose-900 cursor-not-allowed' : 'border-obsidian/15 focus:border-obsidian'
                )}
              />
            ))}
          </div>

          {isExpired && !error && (
            <p className="mt-4 text-[12px] text-danger text-center font-medium animate-fade-in">
              This code has expired (10-minute window). Please request a new code.
            </p>
          )}

          {error && <p className="mt-4 text-[12px] text-danger text-center animate-fade-in">{error}</p>}

          <div className="mt-6 flex items-center justify-between text-[12px]">
            <span className="text-obsidian/50">Didn't receive it?</span>
            {cooldown > 0 ? (
              <span className="text-obsidian/40 font-mono">Resend in {formatCooldown(cooldown)}</span>
            ) : (
              <button onClick={handleResend} disabled={loading} className="text-iris font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40">
                <RotateCcw size={12} /> Resend code
              </button>
            )}
          </div>
        </div>

        {loading && <p className="text-center text-[12px] text-iris font-mono animate-pulse">Verifying code…</p>}
      </div>
    </div>
  )
}
