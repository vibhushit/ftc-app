import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, KeyRound, CheckCircle2, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'

export function ForgotPasswordScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')
  const [cooldown, setCooldown] = useState(0)

  const isEmailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const sendReset = async () => {
    if (!isEmailValid || loading || cooldown > 0) return
    setError('')
    setLoading(true)

    try {
      if (supabaseAvailable && isLiveMode()) {
        const userExists = await authApi.checkEmailExists(email.trim())
        if (!userExists) {
          setError('No account found with this email. Please check your spelling or sign up.')
          setLoading(false)
          return
        }
        await authApi.resetPassword(email.trim())
      }
      setSent(true)
      setCooldown(60)
    } catch (e: any) {
      setError(e?.message || 'Failed to send password recovery link. Please verify your email.')
    } finally {
      setLoading(false)
    }
  }

  const simulateSandboxReset = () => {
    dispatch({ type: 'GO', screen: 'resetPassword' })
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'login' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">
          Reset Password
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-8 max-w-sm mx-auto w-full flex flex-col justify-between">
        <div>
          <div className="w-16 h-16 rounded-full bg-iris/10 grid place-items-center mb-5 mx-auto">
            <KeyRound size={30} className="text-iris" />
          </div>

          <h1 className="font-display text-3xl font-light tracking-tight text-center leading-tight mb-2">
            Forgot your<br /><span className="italic">password?</span>
          </h1>
          <p className="text-[13px] text-obsidian/60 text-center mb-6 leading-relaxed">
            Enter your registered email address and we’ll send you a link to securely reset your password.
          </p>

          {!sent ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Email address</label>
                <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 bg-bone/30 transition">
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendReset()}
                    placeholder="name@example.com"
                    className="w-full bg-transparent outline-none text-[14.5px] placeholder:text-obsidian/40"
                  />
                </div>
              </div>

              {error && (
                <div className="space-y-2">
                  <p className="text-[12px] text-danger font-medium">{error}</p>
                  {error.includes('No account found') && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
                      className="tap w-full py-2.5 rounded-xl bg-iris/10 text-iris text-[12.5px] font-semibold hover:bg-iris/20 transition flex items-center justify-center gap-1.5"
                    >
                      Create a new account →
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={sendReset}
                disabled={!isEmailValid || loading || cooldown > 0}
                className="tap w-full mt-3 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-sm"
              >
                {loading ? 'Sending link…' : cooldown > 0 ? `Resend in ${cooldown}s` : <><span>Send Recovery Link</span> <ArrowRight size={15} /></>}
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-bone border border-line text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-success/15 text-success grid place-items-center mx-auto">
                <CheckCircle2 size={22} />
              </div>
              <h3 className="font-display text-lg font-semibold">Check your inbox</h3>
              <p className="text-[12.5px] text-obsidian/65 leading-relaxed">
                We sent a password recovery link to <span className="font-semibold text-obsidian">{email}</span>. Click the link to set your new password, and then return to log in.
              </p>
              <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11.5px]">
                <span className="text-obsidian/50">Didn't receive it?</span>
                <button
                  onClick={sendReset}
                  disabled={cooldown > 0 || loading}
                  className="text-iris font-semibold hover:underline disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
                </button>
              </div>
            </div>
          )}

          {/* Sandbox mode instant test helper */}
          {!isLiveMode() && (
            <div className="mt-8 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-[10.5px] font-mono font-semibold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-amber-600" />
                <span>Sandbox Mode Shortcut</span>
              </div>
              <p className="text-[11px] text-amber-800/80 mb-2">Bypass email and jump straight to Set New Password screen:</p>
              <button
                onClick={simulateSandboxReset}
                className="tap w-full py-2 px-3 rounded-xl bg-paper border border-amber-500/40 text-[12px] font-semibold text-obsidian hover:bg-amber-50"
              >
                Simulate "Set New Password" →
              </button>
            </div>
          )}
        </div>

        <div className="pt-6 text-center">
          <button onClick={() => dispatch({ type: 'GO', screen: 'login' })} className="tap text-[12.5px] text-obsidian/60 hover:text-obsidian font-semibold">
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  )
}
