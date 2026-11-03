import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, CalendarCheck, RotateCcw } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { useOtpSecurity } from '@/hooks/useOtpSecurity'
import { supabaseAvailable, supabase } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { GoogleG } from './GoogleG'
import { cn } from '@/utils'

export function LoginScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const bookingDraft = useAppStore(s => s.bookingDraft)

  const [authMode, setAuthMode]         = useState<'password' | 'otp'>('password')
  const [otpStep, setOtpStep]           = useState<'input' | 'verify'>('input')

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const {
    otp,
    setOtp,
    isLocked,
    isExpired,
    cooldown,
    recordCodeSent,
    recordFailedAttempt,
    formatCooldown,
  } = useOtpSecurity()

  const otpInputs = useRef<(HTMLInputElement | null)[]>([])
  const isEmailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const isPasswordFormValid = isEmailValid && password.length >= 6

  useEffect(() => {
    if (authMode === 'otp' && otpStep === 'verify') {
      otpInputs.current[0]?.focus()
    }
  }, [authMode, otpStep])

  const handlePasswordLogin = async () => {
    if (!isPasswordFormValid || loading) return
    setError('')
    setLoading(true)

    // Clean address bar so leftover tokens don't interfere
    if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
      try {
        window.history.replaceState(null, '', window.location.pathname)
      } catch {}
    }

    try {
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }
      const authRes = await authApi.signInWithPassword(email.trim(), password)
      const user = authRes?.user

      if (user) {
        try {
          const { data: userProfile } = await (supabase.from('users') as any)
            .select('name, role, city, phone')
            .eq('id', user.id)
            .maybeSingle()

          const { data: creatorProfile } = await (supabase.from('creator_profiles') as any)
            .select('id, handle, discipline')
            .eq('id', user.id)
            .maybeSingle()

          const creatorHandle = creatorProfile?.handle ? creatorProfile.handle.replace(/^@+/, '') : undefined
          const hasValidCreatorProfile = Boolean(creatorProfile && creatorProfile.discipline)
          const hasCreatorCapability = userProfile?.role === 'creator' || userProfile?.role === 'both' || hasValidCreatorProfile

          const hasCompletedOnboarding = hasCreatorCapability
            ? hasValidCreatorProfile
            : (userProfile?.role === 'consumer' && Boolean(userProfile?.city))

          let activeViewMode = hasCreatorCapability
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`ftc_view_mode_${user.id}`)
            if (saved === 'client') activeViewMode = false
            else if (saved === 'creator' && hasCreatorCapability) activeViewMode = true
          }

          if (hasCompletedOnboarding) {
            dispatch({
              type: 'COMPLETE_AUTH',
              isCreator: activeViewMode,
              name: userProfile?.name || user.user_metadata?.name || 'User',
              city: userProfile?.city ?? undefined,
              phone: userProfile?.phone ?? user.phone ?? undefined,
              email: user.email,
              handle: creatorHandle,
            })
            return
          } else {
            // If user authenticated while checking out a booking, complete auth directly to booking
            const pendingBooking = typeof window !== 'undefined' ? localStorage.getItem('ftc_pending_booking_draft') : null
            const inMemoryDraft = useAppStore.getState().bookingDraft
            if (pendingBooking || inMemoryDraft) {
              dispatch({
                type: 'COMPLETE_AUTH',
                isCreator: false,
                name: userProfile?.name || user.user_metadata?.name || 'Client',
                email: user.email,
                phone: userProfile?.phone ?? user.phone ?? undefined,
                handle: creatorHandle,
              })
              return
            }

            // Check for user-scoped draft
            try {
              const draft = localStorage.getItem(`ftc_creator_draft_${user.id}`)
              if (draft) {
                const parsed = JSON.parse(draft)
                if (parsed && typeof parsed === 'object') {
                  dispatch({ type: 'SET_ONBOARD', patch: parsed })
                  dispatch({ type: 'GO', screen: 'creatorOnboard1' })
                  return
                }
              }
            } catch {}
            dispatch({ type: 'GO', screen: 'role' })
            return
          }
        } catch {
          dispatch({ type: 'COMPLETE_AUTH', isCreator: false, email: user.email })
          return
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid email or password. Please try again or use Forgot Password.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!isEmailValid || loading || cooldown > 0) return
    setError('')
    setLoading(true)

    try {
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }
      await authApi.sendEmailSignInOtp(email.trim())
      setOtpStep('verify')
      recordCodeSent()
    } catch (e: any) {
      setError(e?.message || 'Failed to send login code. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return
    setError('')
    setLoading(true)

    try {
      await authApi.sendEmailSignInOtp(email.trim())
      recordCodeSent()
      otpInputs.current[0]?.focus()
    } catch (e: any) {
      setError(e?.message || 'Failed to resend login code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i: number, val: string) => {
    if (isLocked) return
    const digits = val.replace(/\D/g, '')
    if (!digits) {
      const next = [...otp]
      next[i] = ''
      setOtp(next)
      return
    }

    const char = digits[digits.length - 1]
    const next = [...otp]
    next[i] = char
    setOtp(next)
    setError('')

    if (i < 5) {
      otpInputs.current[i + 1]?.focus()
    }

    const fullCode = next.join('')
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode)
    }
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[i] && i > 0) {
        otpInputs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      otpInputs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 5) {
      otpInputs.current[i + 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    if (isLocked) return
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i]
    }
    setOtp(next)
    setError('')

    if (pasted.length === 6) {
      otpInputs.current[5]?.focus()
      handleVerifyOtp(pasted)
    } else {
      otpInputs.current[pasted.length]?.focus()
    }
  }

  const handleVerifyOtp = async (codeStr: string) => {
    if (loading || isLocked || codeStr.length !== 6) return
    setLoading(true)
    setError('')

    try {
      const authRes = await authApi.verifyEmailOtp(email.trim(), codeStr)
      const user = authRes?.user

      if (user) {
        // Direct transition
        const pendingBooking = typeof window !== 'undefined' ? localStorage.getItem('ftc_pending_booking_draft') : null
        const inMemoryDraft = useAppStore.getState().bookingDraft

        if (pendingBooking || inMemoryDraft) {
          dispatch({
            type: 'COMPLETE_AUTH',
            isCreator: false,
            name: user.user_metadata?.name || 'Client',
            email: user.email,
          })
          return
        }

        try {
          const { data: userProfile } = await (supabase.from('users') as any)
            .select('name, role, city, phone')
            .eq('id', user.id)
            .maybeSingle()

          const { data: creatorProfile } = await (supabase.from('creator_profiles') as any)
            .select('id, handle, discipline')
            .eq('id', user.id)
            .maybeSingle()

          const creatorHandle = creatorProfile?.handle ? creatorProfile.handle.replace(/^@+/, '') : undefined
          const hasValidCreatorProfile = Boolean(creatorProfile && creatorProfile.discipline)
          const hasCreatorCapability = userProfile?.role === 'creator' || userProfile?.role === 'both' || hasValidCreatorProfile

          let activeViewMode = hasCreatorCapability
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`ftc_view_mode_${user.id}`)
            if (saved === 'client') activeViewMode = false
            else if (saved === 'creator' && hasCreatorCapability) activeViewMode = true
          }

          dispatch({
            type: 'COMPLETE_AUTH',
            isCreator: activeViewMode,
            name: userProfile?.name || user.user_metadata?.name || 'User',
            city: userProfile?.city ?? undefined,
            phone: userProfile?.phone ?? user.phone ?? undefined,
            email: user.email,
            handle: creatorHandle,
          })
        } catch {
          dispatch({ type: 'COMPLETE_AUTH', isCreator: false, email: user.email })
        }
      }
    } catch (e: any) {
      const { isLocked: locked, errorNotice } = recordFailedAttempt()
      setError(locked ? errorNotice : (e?.message || errorNotice))
      otpInputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Header */}
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => {
            if (authMode === 'otp' && otpStep === 'verify') {
              setOtpStep('input')
              setError('')
            } else {
              dispatch({ type: 'BACK' })
            }
          }}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">
          Sign In
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-4"><BrandIcon size={44} /></div>
        <h1 className="font-display text-[28px] tracking-tight text-center leading-tight mb-1">
          Welcome back
        </h1>
        <p className="text-[13px] text-obsidian/60 text-center mb-5">
          Sign in to your account with password or 6-digit code
        </p>

        {bookingDraft && (
          <div className="mb-5 p-3.5 rounded-2xl bg-iris/10 border border-iris/20 text-iris text-[12.5px] flex items-center gap-2.5 animate-fade-in">
            <CalendarCheck size={18} className="shrink-0 text-iris" />
            <span className="leading-snug">
              Sign in to confirm your booking with <strong className="font-semibold">{bookingDraft.creatorName}</strong>.
            </span>
          </div>
        )}

        {/* Tab Switcher: Password vs Email Code (OTP) */}
        <div className="flex p-1 bg-bone/70 rounded-2xl border border-line mb-5">
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(''); }}
            className={cn(
              'flex-1 py-2 rounded-xl text-[12.5px] font-semibold transition cursor-pointer',
              authMode === 'password' ? 'bg-paper text-obsidian shadow-xs' : 'text-obsidian/50 hover:text-obsidian'
            )}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(''); }}
            className={cn(
              'flex-1 py-2 rounded-xl text-[12.5px] font-semibold transition cursor-pointer',
              authMode === 'otp' ? 'bg-paper text-obsidian shadow-xs' : 'text-obsidian/50 hover:text-obsidian'
            )}
          >
            Email Code (OTP)
          </button>
        </div>

        {/* Mode 1: Password Login */}
        {authMode === 'password' && (
          <div className="space-y-3.5 animate-fade-in">
            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Email address</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-[14.5px] placeholder:text-obsidian/30"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-obsidian/60">Password</label>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'GO', screen: 'forgotPassword' })}
                  className="text-[11px] text-iris hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 flex items-center transition">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="At least 6 characters"
                  className="flex-1 bg-transparent outline-none text-[14.5px] placeholder:text-obsidian/30"
                  autoComplete="current-password"
                  onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="tap p-1 text-obsidian/40 hover:text-obsidian transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-danger font-medium px-1 leading-snug">{error}</p>
            )}

            <button
              type="button"
              onClick={handlePasswordLogin}
              disabled={!isPasswordFormValid || loading}
              className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none hover:bg-obsidian/90 transition shadow-sm mt-2 cursor-pointer"
            >
              <span>{loading ? 'Signing in…' : 'Sign in'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Mode 2: 6-Digit Email OTP Login */}
        {authMode === 'otp' && (
          <div className="space-y-4 animate-fade-in">
            {otpStep === 'input' ? (
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
                      autoComplete="email"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                  <p className="text-[11.5px] text-obsidian/50 mt-1.5 px-1 leading-normal">
                    We'll email you a 6-digit verification code to sign in instantly without a password.
                  </p>
                </div>

                {error && (
                  <p className="text-[12px] text-danger font-medium px-1 leading-snug">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!isEmailValid || loading || cooldown > 0}
                  className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none hover:bg-obsidian/90 transition shadow-sm cursor-pointer"
                >
                  <span>{loading ? 'Sending code…' : cooldown > 0 ? `Resend in ${formatCooldown(cooldown)}` : 'Send Login Code'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-[13px] text-obsidian/70">
                    Enter the 6-digit code sent to{' '}
                    <span className="font-semibold text-obsidian">{email}</span>
                    <button
                      type="button"
                      onClick={() => { setOtpStep('input'); setError('') }}
                      className="text-iris font-semibold hover:underline ml-1.5 text-[12px] inline cursor-pointer"
                    >
                      Edit
                    </button>
                  </p>
                </div>

                {/* 6-Digit Boxes */}
                <div className="flex gap-2 justify-center py-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpInputs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      disabled={loading || isLocked}
                      className={cn(
                        'w-11 h-14 sm:w-12 sm:h-14 rounded-2xl border-2 bg-bone/40 text-center font-mono text-2xl font-bold outline-none transition disabled:opacity-40',
                        isLocked ? 'border-rose-300 bg-rose-50 text-rose-900 cursor-not-allowed' : 'border-obsidian/20 focus:border-obsidian focus:bg-paper'
                      )}
                    />
                  ))}
                </div>

                {isExpired && !error && (
                  <p className="text-[12px] text-danger text-center font-medium leading-snug px-2 animate-fade-in">
                    This login code has expired (10-minute window). Please request a new code.
                  </p>
                )}

                {error && (
                  <p className="text-[12px] text-danger text-center font-medium leading-snug px-2 animate-fade-in">{error}</p>
                )}

                {loading && (
                  <p className="text-center text-[12.5px] text-iris font-medium animate-pulse">Verifying code…</p>
                )}

                <div className="pt-2 flex items-center justify-between text-[12px] border-t border-line">
                  <span className="text-obsidian/50">Didn't receive code?</span>
                  {cooldown > 0 ? (
                    <span className="text-obsidian/40 font-mono">Resend in {formatCooldown(cooldown)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-iris font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <RotateCcw size={12} /> Resend code
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
          className="w-full text-center text-[12.5px] text-obsidian/60 pt-4 cursor-pointer hover:text-obsidian transition"
        >
          Don’t have an account? <span className="text-iris font-semibold underline">Sign up</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-obsidian/10" />
          <span className="text-[11.5px] font-medium text-obsidian/40">or</span>
          <div className="flex-1 h-px bg-obsidian/10" />
        </div>

        {/* Google OAuth Button - Greyed out for now */}
        <button
          type="button"
          disabled
          className="w-full py-3.5 px-4 rounded-2xl border border-line/70 bg-bone/40 flex items-center justify-center gap-2.5 cursor-not-allowed select-none opacity-60 transition"
          title="Google Sign-In is coming soon"
        >
          <GoogleG size={17} className="grayscale opacity-50" />
          <span className="text-[13px] font-medium text-obsidian/50">Google Sign-In · Coming Soon</span>
        </button>
      </div>
    </div>
  )
}

// Alias for backward compatibility
export const PhoneScreen = LoginScreen
