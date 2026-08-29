import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'

export function SignUpScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [name, setName]         = useState('')
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

  const handleSignUp = async () => {
    if (!isEmailValid || loading || cooldown > 0) return
    setError('')
    setLoading(true)

    try {
      if (supabaseAvailable && isLiveMode()) {
        const alreadyExists = await authApi.checkEmailExists(email.trim())
        if (alreadyExists) {
          setError('This email is already registered. Please sign in instead.')
          setLoading(false)
          return
        }
        await authApi.sendSignUpVerificationLink(email.trim(), name.trim())
      }
      setSent(true)
      setCooldown(60)
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('already registered') || e?.message?.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(e?.message || 'Failed to send verification link. Please check your email.')
      }
    } finally {
      setLoading(false)
    }
  }

  const simulateSandboxSetPass = () => {
    dispatch({ type: 'SET_PENDING_PHONE', phone: email.trim() || 'user@findtoconnect.com' })
    dispatch({ type: 'GO', screen: 'resetPassword' })
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Clean Minimal Header */}
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'welcome' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">
          Create Account
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 max-w-md mx-auto w-full flex flex-col justify-between">
        <div>
          <div className="flex justify-center mb-4"><BrandIcon size={44} /></div>
          <h1 className="font-display text-3xl font-light tracking-tight text-center leading-tight mb-2">
            Join the <span className="italic">FTC Network</span>
          </h1>
          <p className="text-[13px] text-obsidian/60 text-center mb-6 leading-relaxed">
            Enter your email to receive an account activation link and set your password.
          </p>

          {!sent ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Full Name</label>
                <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rhea Kapoor"
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Email Address</label>
                <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition">
                  <input
                    autoFocus
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                    placeholder="name@example.com"
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                  />
                </div>
              </div>

              {error && (
                <div className="space-y-2">
                  <p className="text-[12px] text-danger font-medium">{error}</p>
                  {error.includes('already registered') && (
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'GO', screen: 'login' })}
                      className="tap w-full py-2.5 rounded-xl bg-iris/10 text-iris text-[12.5px] font-semibold hover:bg-iris/20 transition flex items-center justify-center gap-1.5"
                    >
                      Sign in with {email} →
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleSignUp}
                disabled={!isEmailValid || loading || cooldown > 0}
                className="tap w-full mt-2 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-sm"
              >
                {loading ? 'Sending verification…' : cooldown > 0 ? `Resend in ${cooldown}s` : <><span>Continue</span> <ArrowRight size={16} /></>}
              </button>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-bone border border-line text-center space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-success/15 text-success grid place-items-center mx-auto">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="font-display text-xl font-semibold">Verification link sent!</h3>
              <p className="text-[13px] text-obsidian/70 leading-relaxed">
                We sent a link to <span className="font-semibold text-obsidian">{email}</span>. Click the link in your email to choose your password and activate your account.
              </p>
              <div className="pt-3 border-t border-line/60 flex items-center justify-between text-[11.5px]">
                <span className="text-obsidian/50">Didn't receive email?</span>
                <button
                  onClick={handleSignUp}
                  disabled={cooldown > 0 || loading}
                  className="text-iris font-semibold hover:underline disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
                </button>
              </div>
            </div>
          )}

          {/* Sandbox mode shortcut */}
          {!isLiveMode() && (
            <div className="mt-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-[10.5px] font-mono font-semibold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Sparkles size={12} className="text-amber-600" />
                <span>Sandbox Mode Shortcut</span>
              </div>
              <p className="text-[11px] text-amber-800/80 mb-2">Simulate opening the email verification link to set a password:</p>
              <button
                onClick={simulateSandboxSetPass}
                className="tap w-full py-2 px-3 rounded-xl bg-paper border border-amber-500/40 text-[12px] font-semibold text-obsidian hover:bg-amber-50"
              >
                Simulate "Set Password" →
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap text-[13px] text-obsidian/60 hover:text-obsidian font-medium"
          >
            Already have an account? <span className="text-iris font-semibold underline">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  )
}
