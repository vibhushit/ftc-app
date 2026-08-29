import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'

export function OtpScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(45)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputs.current[0]?.focus()
    const timer = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (i: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1]
    const next = [...code]
    next[i] = val
    setCode(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  const submitOtp = useCallback(async (otpCode: string) => {
    setLoading(true)
    setError('')
    try {
      if (supabaseAvailable && isLiveMode()) {
        const isEmail = (pendingPhone || '').includes('@')
        await authApi.verifyOtp(pendingPhone || '', otpCode, isEmail ? 'email' : 'sms')
      }
      dispatch({ type: 'GO', screen: 'role' })
    } catch (e: any) {
      setError(e?.message || 'Invalid code. Try again.')
      setCode(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [pendingPhone, dispatch])

  useEffect(() => {
    const full = code.join('')
    if (full.length === 6) submitOtp(full)
  }, [code, submitOtp])

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
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 rounded-2xl border-2 border-obsidian/15 bg-bone/30 text-center font-mono text-2xl focus:border-obsidian outline-none transition"
              />
            ))}
          </div>

          {error && <p className="mt-4 text-[12px] text-danger text-center">{error}</p>}

          <div className="mt-6 flex items-center justify-between text-[12px]">
            <span className="text-obsidian/50">Didn't receive it?</span>
            {cooldown > 0 ? (
              <span className="text-obsidian/40 font-mono">Resend in ${cooldown}s</span>
            ) : (
              <button onClick={() => setCooldown(45)} className="text-iris font-semibold flex items-center gap-1">
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
