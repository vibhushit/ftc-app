import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, CalendarCheck, RotateCcw } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { useOtpSecurity } from '@/hooks/useOtpSecurity'
import { cn } from '@/utils'
import { supabaseAvailable, supabase } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

export function SignUpScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const bookingDraft = useAppStore(s => s.bookingDraft)

  const [step, setStep]         = useState<'form' | 'otp'>('form')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

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

  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const isEmailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  useEffect(() => {
    if (step === 'otp') {
      inputs.current[0]?.focus()
    }
  }, [step])

  const handleSendOtp = async () => {
    if (!isEmailValid || loading || cooldown > 0) return
    setError('')
    setLoading(true)

    try {
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }
      await authApi.sendEmailSignUpOtp(email.trim(), name.trim())
      setStep('otp')
      recordCodeSent()
    } catch (e: any) {
      setError(e?.message || 'Failed to send verification code. Please check your email.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return
    setError('')
    setLoading(true)

    try {
      await authApi.sendEmailSignUpOtp(email.trim(), name.trim())
      recordCodeSent()
      inputs.current[0]?.focus()
    } catch (e: any) {
      setError(e?.message || 'Failed to resend verification code. Please try again.')
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
      inputs.current[i + 1]?.focus()
    }

    const fullCode = next.join('')
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode)
    }
  }

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[i] && i > 0) {
        inputs.current[i - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < 5) {
      inputs.current[i + 1]?.focus()
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
      inputs.current[5]?.focus()
      handleVerifyOtp(pasted)
    } else {
      inputs.current[pasted.length]?.focus()
    }
  }

  const handleVerifyOtp = async (codeStr: string) => {
    if (loading || isLocked || codeStr.length !== 6) return
    setLoading(true)
    setError('')

    try {
      const res = await authApi.verifyEmailOtp(email.trim(), codeStr)
      const user = res?.user

      if (user) {
        if (name.trim()) {
          try {
            await (supabase.from('users') as any)
              .update({ name: name.trim() })
              .eq('id', user.id)
          } catch {}
        }

        // Direct immediate transition to prevent passive listener delays
        dispatch({
          type: 'COMPLETE_AUTH',
          isCreator: false,
          hasCreatorProfile: false,
          name: name.trim() || 'User',
          email: user.email,
        })
      }
    } catch (e: any) {
      const { isLocked: locked, errorNotice } = recordFailedAttempt()
      setError(locked ? errorNotice : (e?.message || errorNotice))
      inputs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Clean Header */}
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          onClick={() => {
            if (step === 'otp') {
              setStep('form')
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
          {step === 'otp' ? 'Verification' : 'Create Account'}
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 max-w-md mx-auto w-full">
        <div className="flex justify-center mb-4"><BrandIcon size={44} /></div>

        {step === 'form' ? (
          <>
            <h1 className="font-display text-[28px] tracking-tight text-center leading-tight mb-1">
              Join FindToConnect
            </h1>
            <p className="text-[13px] text-obsidian/60 text-center mb-6">
              Connect with India’s top verified creative talent
            </p>

            {bookingDraft && (
              <div className="mb-5 p-3.5 rounded-2xl bg-iris/10 border border-iris/20 text-iris text-[12.5px] flex items-center gap-2.5 animate-fade-in">
                <CalendarCheck size={18} className="shrink-0 text-iris" />
                <span className="leading-snug">
                  Create an account to confirm your booking with <strong className="font-semibold">{bookingDraft.creatorName}</strong>.
                </span>
              </div>
            )}

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
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
              </div>

              {error && (
                <p className="text-[12px] text-danger font-medium px-1 leading-snug">{error}</p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={!isEmailValid || loading || cooldown > 0}
                className="tap w-full mt-2 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-sm cursor-pointer"
              >
                {loading ? 'Sending code…' : cooldown > 0 ? `Resend in ${formatCooldown(cooldown)}` : <><span>Continue</span> <ArrowRight size={16} /></>}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h1 className="font-display text-[26px] tracking-tight text-center leading-tight mb-1.5">
                Verify your email
              </h1>
              <p className="text-[13px] text-obsidian/65 text-center leading-relaxed">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-obsidian">{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setError('') }}
                  className="text-iris font-semibold hover:underline ml-1.5 text-[12px] inline cursor-pointer"
                >
                  Edit
                </button>
              </p>
            </div>

            {/* 6-Digit Code Input */}
            <div className="flex gap-2 justify-center py-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el }}
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
                This verification code has expired (10-minute window). Please request a new code.
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

        <div className="mt-8 text-center">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap text-[13px] text-obsidian/60 hover:text-obsidian font-medium cursor-pointer"
          >
            Already have an account? <span className="text-iris font-semibold underline">Sign In</span>
          </button>
        </div>
      </div>
    </div>
  )
}
