import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

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
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }
      await authApi.sendSignUpVerificationLink(email.trim(), name.trim())
      setSent(true)
      setCooldown(60)
    } catch (e: any) {
      const msg = e?.message?.toLowerCase() || ''
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
        setError('This email is already registered. Please sign in instead.')
      } else if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
        setError('Email sending limit reached. Please wait a few minutes before requesting another link.')
      } else {
        setError(e?.message || 'Failed to send verification link. Please check your email.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Clean Minimal Header */}
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          onClick={() => dispatch({ type: 'GO', screen: 'welcome' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">Create Account</span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-4"><BrandIcon size={44} /></div>
        <h1 className="font-display text-[28px] tracking-tight text-center leading-tight mb-1">
          Join FindToConnect
        </h1>
        <p className="text-[13px] text-obsidian/60 text-center mb-6">
          Connect with India’s top verified creative talent
        </p>

        <div className="space-y-4">
          {!sent ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Your Full Name</label>
                <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition">
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setError('') }}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-transparent outline-none text-[14.5px] placeholder:text-obsidian/30"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Email address</label>
                <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@example.com"
                    className="w-full bg-transparent outline-none text-[14.5px] placeholder:text-obsidian/30"
                    onKeyDown={e => e.key === 'Enter' && handleSignUp()}
                  />
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-danger font-medium px-1 leading-snug">{error}</p>
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
