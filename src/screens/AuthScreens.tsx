import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight, X, Mail, RotateCcw, Sparkles, CheckCircle2, UserCheck, Palette } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { cn } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { apiClient } from '@/services/apiClient'
import { isLiveMode } from '@/config/environmentMode'

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 40.4 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  )
}

export function PhoneScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [val, setVal]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const looksPhone = /^[+0-9][0-9\s\-]{5,}$/.test(val.trim())
  const looksEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val.trim())
  const ok = looksPhone || looksEmail

  const cont = async () => {
    if (!ok || loading) return
    setError('')
    setLoading(true)
    try {
      if (looksEmail && supabaseAvailable && isLiveMode()) {
        await authApi.sendEmailOtp(val.trim())
        dispatch({ type: 'SET_PENDING_PHONE', phone: val.trim() })
        dispatch({ type: 'GO', screen: 'magicLinkSent' })
      } else if (looksPhone && isLiveMode()) {
        await apiClient.sendPhoneOtp(val.trim())
        dispatch({ type: 'SET_PENDING_PHONE', phone: val.trim() })
        dispatch({ type: 'GO', screen: 'otp' })
      } else {
        // Sandbox mode or offline demo
        dispatch({ type: 'SET_PENDING_PHONE', phone: val.trim() || 'demo@findtoconnect.com' })
        dispatch({ type: 'GO', screen: 'role' })
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to send verification. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const social = async (provider: 'google' | 'apple') => {
    if (provider === 'google' && supabaseAvailable && isLiveMode()) {
      try {
        await authApi.signInWithGoogle()
      } catch (err: any) {
        setError(err?.message || 'Google sign in failed')
      }
    } else {
      // Sandbox one-click simulated login
      dispatch({
        type: 'COMPLETE_AUTH',
        isCreator: false,
        name: 'Google User',
        email: 'user@gmail.com',
      })
      dispatch({ type: 'GO', screen: 'role' })
    }
  }

  const quickLogin = (role: 'client' | 'creator') => {
    if (role === 'client') {
      dispatch({
        type: 'COMPLETE_AUTH',
        isCreator: false,
        name: 'Rhea Kapoor',
        email: 'rhea@findtoconnect.com',
        city: 'Delhi',
      })
      dispatch({ type: 'GO_TAB', tab: 'home' })
    } else {
      dispatch({
        type: 'COMPLETE_AUTH',
        isCreator: true,
        name: 'Arjun Verma',
        email: 'arjun@findtoconnect.com',
        city: 'Mumbai',
      })
      dispatch({ type: 'GO_TAB', tab: 'home' })
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-5 pt-3 pb-3 flex items-center border-b border-line">
        <button onClick={() => dispatch({ type: 'GO', screen: 'welcome' })} className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full">
          <X size={20} />
        </button>
        <span className="flex-1 text-center font-display text-[17px] tracking-tight -ml-9">Log in or sign up</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-5"><BrandIcon size={48} /></div>
        <h1 className="font-display text-[26px] tracking-tight text-center leading-tight mb-2">Welcome to FTC</h1>
        <p className="text-[13px] text-obsidian/55 text-center mb-7">Enter your email or phone to receive a login code</p>

        {/* Input field */}
        <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 transition bg-bone/30">
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cont()}
            placeholder="name@example.com or +91 98765 43210"
            className="w-full bg-transparent outline-none text-[15px] placeholder:text-obsidian/40"
          />
        </div>
        {error && <p className="mt-2 text-[12.5px] text-danger font-medium">{error}</p>}

        <button
          onClick={cont}
          disabled={!ok || loading}
          className="tap w-full mt-4 py-4 rounded-2xl text-paper font-semibold text-[15px] transition disabled:opacity-40 shadow-sm"
          style={{ background: 'linear-gradient(90deg,#7D61F2,#9B7BFF)' }}
        >
          {loading ? 'Sending code…' : 'Continue with Email / Phone'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-obsidian/10" />
          <span className="text-[12px] font-medium text-obsidian/45">or continue with</span>
          <div className="flex-1 h-px bg-obsidian/10" />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={() => social('google')}
          className="tap w-full py-3.5 px-4 rounded-2xl border-2 border-line bg-paper flex items-center justify-center gap-3 active:bg-bone hover:border-obsidian/30 transition-all shadow-xs"
        >
          <GoogleG size={20} />
          <span className="text-[14px] font-medium text-obsidian">Continue with Google</span>
        </button>

        {/* Sandbox Quick Test Presets */}
        {!isLiveMode() && (
          <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-amber-900 uppercase tracking-wider mb-2.5">
              <Sparkles size={13} className="text-amber-600" />
              <span>Sandbox 1-Click Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('client')}
                className="tap py-2.5 px-3 rounded-xl bg-paper border border-amber-500/40 text-[12px] font-medium text-obsidian hover:bg-amber-50 text-left flex items-center gap-2"
              >
                <UserCheck size={14} className="text-iris shrink-0" />
                <span className="truncate">Client: Rhea</span>
              </button>
              <button
                onClick={() => quickLogin('creator')}
                className="tap py-2.5 px-3 rounded-xl bg-paper border border-amber-500/40 text-[12px] font-medium text-obsidian hover:bg-amber-50 text-left flex items-center gap-2"
              >
                <Palette size={14} className="text-iris shrink-0" />
                <span className="truncate">Creator: Arjun</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={() => dispatch({ type: 'GO', screen: 'role' })} className="tap text-[12.5px] text-obsidian/45 hover:text-obsidian transition">
            Continue as guest →
          </button>
        </div>
      </div>
    </div>
  )
}

export function MagicLinkSentScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)

  const resend = useCallback(async () => {
    if (!pendingPhone || resending) return
    setResending(true)
    try {
      await authApi.sendEmailOtp(pendingPhone)
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    } catch {}
    finally { setResending(false) }
  }, [pendingPhone, resending])

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-6 py-4 flex items-center">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-sm mx-auto w-full">
        <div className="w-20 h-20 rounded-full bg-iris/10 grid place-items-center mb-6">
          <Mail size={36} className="text-iris" />
        </div>
        <h1 className="font-display text-3xl tracking-tight leading-tight">
          Check your<br /><span className="italic">email inbox.</span>
        </h1>
        <p className="mt-4 text-[14px] text-obsidian/60 leading-relaxed">
          We sent a sign-in magic link to <span className="font-semibold text-obsidian">{pendingPhone}</span>.
        </p>

        <div className="mt-6 w-full p-4 rounded-2xl bg-bone border border-line text-left space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">Next steps</div>
          {[
            'Open your email inbox',
            'Find the email from FTC (FindToConnect)',
            'Tap “Sign in to FTC” to automatically log in',
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-[13px]">
              <div className="w-5 h-5 rounded-full bg-iris text-paper text-[10px] font-bold grid place-items-center shrink-0">{i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {resent && (
          <p className="mt-4 text-[12.5px] text-success font-medium flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Magic link resent!
          </p>
        )}

        <button
          onClick={resend}
          disabled={resending}
          className="tap mt-5 flex items-center gap-2 text-[13px] font-medium text-iris disabled:opacity-50"
        >
          <RotateCcw size={14} className={cn(resending && 'animate-spin')} />
          {resending ? 'Sending…' : 'Resend email link'}
        </button>
      </div>
    </div>
  )
}

export function OtpScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  const [otp, setOtp]       = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { inputs.current[0]?.focus() }, [])

  const handle = (i: number, v: string) => {
    v = v.replace(/\D/g, '').slice(0, 1)
    const next = [...otp]; next[i] = v; setOtp(next)
    if (v && i < 5) inputs.current[i + 1]?.focus()
    if (!v && i > 0) inputs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (digits.length < 4) return
    e.preventDefault()
    const next = digits.split('').concat(['','','','','','']).slice(0, 6)
    setOtp(next)
    inputs.current[Math.min(digits.length, 5)]?.focus()
  }
  const allFilled = otp.every(x => x)

  const verify = async () => {
    if (!allFilled || loading) return
    setError('')
    setLoading(true)
    try {
      if (supabaseAvailable && pendingPhone && isLiveMode()) {
        const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(pendingPhone)
        await authApi.verifyOtp(pendingPhone, otp.join(''), isEmail ? 'email' : 'sms')
      } else {
        dispatch({ type: 'COMPLETE_AUTH', isCreator: false })
        dispatch({ type: 'GO', screen: 'role' })
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">Verification</span>
      </div>

      <div className="flex-1 px-6 pt-4 max-w-sm mx-auto w-full">
        <h1 className="font-display text-4xl font-light tracking-tight leading-tight">
          Enter 6-digit<br /><span className="italic">code.</span>
        </h1>
        <p className="mt-3 text-obsidian/60 text-[14px]">
          {pendingPhone ? `Sent to ${pendingPhone}` : 'Sent to your device.'}
        </p>

        <div className="mt-10 flex gap-2 justify-between">
          {otp.map((v, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              value={v}
              onChange={e => handle(i, e.target.value)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={cn('w-12 h-14 rounded-xl text-center font-display text-2xl tnum outline-none border-2', v ? 'border-obsidian bg-paper' : 'border-line bg-bone/50', 'focus:border-iris')}
              inputMode="numeric"
              maxLength={1}
            />
          ))}
        </div>
        {error && <p className="mt-3 text-[12.5px] text-danger font-medium">{error}</p>}

        <div className="mt-4 flex items-center justify-between text-[12px]">
          <span className="text-obsidian/50">Didn't receive?</span>
          <button
            onClick={() => { if (pendingPhone && supabaseAvailable) authApi.sendEmailOtp(pendingPhone) }}
            className="text-iris font-medium hover:underline"
          >Resend code</button>
        </div>
      </div>

      <div className="px-6 pb-10 max-w-sm mx-auto w-full">
        <button
          disabled={!allFilled || loading}
          onClick={verify}
          className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-30"
        >
          {loading ? 'Verifying…' : <><span>Verify & continue</span> <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}

export function RoleScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [hover, setHover] = useState<string | null>(null)
  const [sel, setSel] = useState<string | null>(null)

  const choose = async (role: 'client' | 'creator') => {
    setSel(role)
    try {
      await apiClient.selectRole(role)
    } catch (e) {
      console.warn('[FTC] selectRole API failed:', e)
    }
    if (supabaseAvailable && isLiveMode()) {
      try {
        await authApi.setUserRole(role === 'creator' ? 'creator' : 'consumer')
      } catch (e) {
        console.error('[FTC] setUserRole failed:', e)
      }
    }
    setTimeout(() => role === 'client'
      ? dispatch({ type: 'COMPLETE_AUTH', isCreator: false })
      : dispatch({ type: 'GO', screen: 'creatorOnboard1' }), 350)
  }

  const isOn = (key: string) => sel === key || (sel === null && hover === key)
  const cardCls = (key: string, accent: string) => cn(
    'tap w-full p-6 rounded-3xl text-left relative overflow-hidden border-2 transition-all duration-500',
    isOn(key) ? (accent === 'dark' ? 'bg-obsidian text-paper border-obsidian shadow-2xl' : 'bg-iris text-paper border-iris shadow-2xl') : 'bg-paper text-obsidian border-line',
    sel === key && 'ring-2 ring-offset-2 ring-obsidian',
  )

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-6 pt-4 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">Your intent</span>
      </div>
      <div className="flex-1 px-6 pt-2 pb-6 flex flex-col justify-between max-w-md mx-auto w-full">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight leading-tight">
            How will you<br />use <span className="italic">FTC?</span>
          </h1>
          <p className="mt-3 text-[14px] text-obsidian/60">
            Select your primary role. You can switch between hiring and offering services anytime.
          </p>

          <div className="mt-8 space-y-4">
            <button
              onMouseEnter={() => setHover('client')}
              onMouseLeave={() => setHover(null)}
              onClick={() => choose('client')}
              className={cardCls('client', 'dark')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-2xl font-light tracking-tight">I want to hire creators</span>
                <span className="text-xl">💼</span>
              </div>
              <p className={cn('text-[13px] leading-relaxed', isOn('client') ? 'text-paper/70' : 'text-obsidian/60')}>
                Discover verified photographers, videographers, editors, and stylists with escrow protection.
              </p>
            </button>

            <button
              onMouseEnter={() => setHover('creator')}
              onMouseLeave={() => setHover(null)}
              onClick={() => choose('creator')}
              className={cardCls('creator', 'iris')}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-2xl font-light tracking-tight">I am a creator</span>
                <span className="text-xl">🎨</span>
              </div>
              <p className={cn('text-[13px] leading-relaxed', isOn('creator') ? 'text-paper/70' : 'text-obsidian/60')}>
                Showcase your portfolio, receive client bookings, send custom quotes, and get paid with 0% platform fee.
              </p>
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-obsidian/40 font-mono">
          FindToConnect · Creative Services Network
        </p>
      </div>
    </div>
  )
}
