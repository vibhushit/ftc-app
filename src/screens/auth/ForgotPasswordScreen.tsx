import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, KeyRound } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

export function ForgotPasswordScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [cooldown, setCooldown] = useState(0)

  const isEmailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  useEffect(() => {
    // Pre-fill email if previously entered
    try {
      const saved = localStorage.getItem('ftc_recovery_email')
      if (saved) setEmail(saved)
    } catch {}
  }, [])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSendRecoveryCode = async () => {
    if (!isEmailValid || loading || cooldown > 0) return
    setError('')
    setLoading(true)

    try {
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }

      const cleanEmail = email.trim().toLowerCase()
      await authApi.sendPasswordRecoveryOtp(cleanEmail)

      try {
        localStorage.setItem('ftc_recovery_email', cleanEmail)
      } catch {}

      // Transition to code entry & password creation screen
      dispatch({ type: 'GO', screen: 'resetPassword' })
    } catch (e: any) {
      const msg = e?.message?.toLowerCase() || ''
      if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
        setError('Too many requests. Please wait a few minutes before requesting another code.')
      } else {
        setError(e?.message || 'Failed to send recovery code. Please check your email address.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'BACK' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">Forgot Password</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="w-12 h-12 rounded-2xl bg-iris/10 text-iris grid place-items-center mx-auto mb-4">
          <KeyRound size={24} />
        </div>
        <h1 className="font-display text-[26px] tracking-tight text-center leading-tight mb-1">
          Reset your password
        </h1>
        <p className="text-[13px] text-obsidian/60 text-center mb-6">
          Enter your registered email and we’ll send you a 6-digit recovery code
        </p>

        <div className="space-y-4">
          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Email address</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-[14.5px] placeholder:text-obsidian/30"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSendRecoveryCode()}
                />
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-danger font-medium px-1 leading-snug">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSendRecoveryCode}
              disabled={!isEmailValid || loading || cooldown > 0}
              className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none hover:bg-obsidian/90 transition shadow-sm cursor-pointer mt-2"
            >
              <span>{loading ? 'Sending code…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send 6-digit code'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap text-[13px] text-obsidian/60 hover:text-obsidian font-medium cursor-pointer"
          >
            Remember your password? <span className="text-iris font-semibold underline">Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  )
}
