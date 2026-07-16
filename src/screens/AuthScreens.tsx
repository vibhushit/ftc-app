import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight, X, Mail, RotateCcw } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { cn } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

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
    if (looksEmail && supabaseAvailable) {
      setLoading(true)
      try {
        await authApi.sendEmailOtp(val.trim())
        dispatch({ type: 'SET_PENDING_PHONE', phone: val.trim() })
        dispatch({ type: 'GO', screen: 'magicLinkSent' })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send email. Try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Phone: OTP bypassed until SMS provider is configured
      dispatch({ type: 'SET_PENDING_PHONE', phone: val.trim() })
      dispatch({ type: 'GO', screen: 'role' })
    }
  }

  const social = (who: string) => {
    if (who === 'google' && supabaseAvailable) {
      authApi.signInWithGoogle().catch(console.error)
    } else {
      dispatch({ type: 'GO', screen: 'role' })
    }
  }
  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-5 pt-1 pb-3 flex items-center border-b border-line">
        <button onClick={() => dispatch({ type: 'GO', screen: 'welcome' })} className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full">
          <X size={20} />
        </button>
        <span className="flex-1 text-center font-display text-[17px] tracking-tight -ml-9">Log in or sign up</span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6">
        <div className="flex justify-center mb-5"><BrandIcon size={48} /></div>
        <h1 className="font-display text-[26px] tracking-tight text-center leading-tight mb-7">Welcome to FTC</h1>
        <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 transition">
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && cont()}
            placeholder="Phone number or email"
            className="w-full bg-transparent outline-none text-[15px] placeholder:text-obsidian/40"
          />
        </div>
        {error && <p className="mt-2 text-[12.5px] text-danger font-medium">{error}</p>}
        <p className="mt-3 text-[12.5px] text-obsidian/55 leading-relaxed">
          We'll send a confirmation code by text or email. Message and data rates may apply.
        </p>
        <button className="tap mt-1 text-[12.5px] font-semibold text-obsidian underline">Privacy Policy</button>
        <button
          onClick={cont}
          disabled={!ok || loading}
          className="tap w-full mt-5 py-4 rounded-2xl text-paper font-semibold text-[15px] transition disabled:opacity-40"
          style={{ background: 'linear-gradient(90deg,#7D61F2,#9B7BFF)' }}
        >
          {loading ? 'Sending code…' : 'Continue'}
        </button>
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-obsidian/10" />
          <span className="text-[12px] font-medium text-obsidian/45">or</span>
          <div className="flex-1 h-px bg-obsidian/10" />
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => social('google')} className="tap w-20 h-16 rounded-2xl border-2 border-line bg-paper grid place-items-center active:bg-bone">
            <GoogleG size={24} />
          </button>
          <button onClick={() => social('apple')} className="tap w-20 h-16 rounded-2xl border-2 border-line bg-paper grid place-items-center active:bg-bone">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.49-.12-1.15.43-2.35 1.07-3.08.71-.84 1.99-1.46 3.09-1.49zM20.5 17.2c-.42.96-.62 1.39-1.16 2.24-.76 1.18-1.83 2.65-3.16 2.66-1.18.01-1.48-.77-3.08-.76-1.6.01-1.93.77-3.11.76-1.33-.01-2.34-1.34-3.1-2.52-2.13-3.3-2.36-7.17-1.04-9.23.94-1.47 2.42-2.33 3.81-2.33 1.42 0 2.31.78 3.48.78 1.14 0 1.83-.78 3.48-.78 1.24 0 2.55.67 3.49 1.83-3.07 1.68-2.57 6.06.39 7.35z"/></svg>
          </button>
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => dispatch({ type: 'GO', screen: 'role' })} className="tap text-[12.5px] text-obsidian/45">
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
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-iris/10 grid place-items-center mb-6">
          <Mail size={36} className="text-iris" />
        </div>
        <h1 className="font-display text-3xl tracking-tight leading-tight">
          Check your<br /><span className="italic">email.</span>
        </h1>
        <p className="mt-4 text-[14px] text-obsidian/60 leading-relaxed max-w-xs">
          We sent a sign-in link to <span className="font-semibold text-obsidian">{pendingPhone}</span>.<br />
          Open it on this device to continue.
        </p>
        <div className="mt-6 w-full max-w-xs p-4 rounded-2xl bg-bone border border-line text-left space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">What to do</div>
          {[
            'Open your email app',
            'Find the email from FTC',
            'Tap \u201cSign in to FTC\u201d',
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-[13px]">
              <div className="w-5 h-5 rounded-full bg-iris text-paper text-[10px] font-bold grid place-items-center shrink-0">{i + 1}</div>
              {s}
            </div>
          ))}
        </div>
        {resent && (
          <p className="mt-4 text-[12.5px] text-success font-medium">Email resent!</p>
        )}
        <button
          onClick={resend}
          disabled={resending}
          className="tap mt-5 flex items-center gap-2 text-[13px] font-medium text-iris disabled:opacity-50"
        >
          <RotateCcw size={14} />
          {resending ? 'Sending…' : 'Resend email'}
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
      if (supabaseAvailable && pendingPhone) {
        const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(pendingPhone)
        await authApi.verifyOtp(pendingPhone, otp.join(''), isEmail ? 'email' : 'sms')
        // AuthProvider will sync the user and navigate to role
        dispatch({ type: 'GO', screen: 'role' })
      } else {
        dispatch({ type: 'GO', screen: 'role' })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code. Please try again.')
      setLoading(false)
    }
  }
  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-obsidian/50">Step 2 of 2</span>
      </div>
      <div className="flex-1 px-6 pt-4">
        <h1 className="font-display text-4xl font-light tracking-tight leading-tight">
          Enter the<br /><span className="italic">code.</span>
        </h1>
        <p className="mt-3 text-obsidian/60 text-[14px]">
          {pendingPhone ? `Sent to ${pendingPhone}` : 'Sent via SMS.'}
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
            onClick={() => { if (pendingPhone && supabaseAvailable) authApi.sendOtp(pendingPhone) }}
            className="text-iris font-medium"
          >Resend code</button>
        </div>
      </div>
      <div className="px-6 pb-10">
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
  const choose = async (role: string) => {
    setSel(role)
    if (supabaseAvailable) {
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
    <div className="flex-1 flex flex-col bg-paper min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-10 pb-10">
        <BrandIcon size={36} />
        <h1 className="font-display text-4xl font-light tracking-tight leading-tight mt-8">
          How will you<br /><span className="italic">use FTC?</span>
        </h1>
        <p className="mt-3 text-obsidian/60 text-[14px]">Pick one — you can switch later.</p>
        <div className="space-y-4 mt-10">
          <button onClick={() => choose('client')} onMouseEnter={() => setHover('client')} onMouseLeave={() => setHover(null)} className={cardCls('client', 'dark')}>
            <div className={cn('absolute top-0 right-0 w-32 h-32 dots-acid pointer-events-none transition', isOn('client') ? 'opacity-20' : 'opacity-0')} />
            <div className={cn('text-5xl mb-4', isOn('client') ? 'opacity-100' : 'opacity-60')}>🎯</div>
            <div className="font-display text-2xl font-light">I want to hire</div>
            <div className={cn('text-[13px] mt-1 transition-colors', isOn('client') ? 'text-paper/70' : 'text-obsidian/60')}>
              Photographers, designers, tattoo artists — book them for projects and events.
            </div>
            <div className={cn('mt-5 flex items-center gap-1 text-[13px] font-medium transition-colors', isOn('client') ? 'text-acid' : 'text-iris')}>
              {sel === 'client' ? 'Setting you up…' : <><span>Continue as client</span> <ArrowRight size={14} /></>}
            </div>
          </button>
          <button onClick={() => choose('creator')} onMouseEnter={() => setHover('creator')} onMouseLeave={() => setHover(null)} className={cardCls('creator', 'iris')}>
            <div className={cn('absolute top-0 right-0 w-32 h-32 dots-acid pointer-events-none transition', isOn('creator') ? 'opacity-20' : 'opacity-0')} />
            <div className={cn('text-5xl mb-4', isOn('creator') ? 'opacity-100' : 'opacity-60')}>✨</div>
            <div className="font-display text-2xl font-light">I want to be hired</div>
            <div className={cn('text-[13px] mt-1 transition-colors', isOn('creator') ? 'text-paper/70' : 'text-obsidian/60')}>
              Showcase your work, get discovered by brands, take bookings with protected payments.
            </div>
            <div className={cn('mt-5 flex items-center gap-1 text-[13px] font-medium transition-colors', isOn('creator') ? 'text-acid' : 'text-iris')}>
              {sel === 'creator' ? "Let's build your profile…" : <><span>Apply as creator</span> <ArrowRight size={14} /></>}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
