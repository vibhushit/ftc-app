import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ShieldCheck, Eye, EyeOff, Check, CheckCircle2, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useOtpSecurity } from '@/hooks/useOtpSecurity'
import { cn } from '@/utils'
import { supabaseAvailable, supabase } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

export function ResetPasswordScreen() {
  const dispatch = useAppStore(s => s.dispatch)

  const [email, setEmail]                     = useState('')
  const [editingEmail, setEditingEmail]       = useState(false)
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass]               = useState(false)

  const [loading, setLoading]                 = useState(false)
  const [success, setSuccess]                 = useState(false)
  const [error, setError]                     = useState('')

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
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    try {
      const savedEmail = localStorage.getItem('ftc_recovery_email')
      if (savedEmail) {
        setEmail(savedEmail)
        recordCodeSent()
      } else {
        setEditingEmail(true)
      }
    } catch {
      setEditingEmail(true)
    }
    otpInputs.current[0]?.focus()
  }, [recordCodeSent])

  const fullOtp = otp.join('')
  const isOtpComplete = fullOtp.length === 6
  const isMinLength = newPassword.length >= 6
  const hasSpecialOrNum = /[0-9!@#$%^&*]/.test(newPassword)
  const isMatching = newPassword === confirmPassword && confirmPassword.length > 0
  const canSubmit = isOtpComplete && isMinLength && isMatching && !loading && !isLocked

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
    } else if (next.join('').length === 6) {
      passwordInputRef.current?.focus()
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
      passwordInputRef.current?.focus()
    } else {
      otpInputs.current[pasted.length]?.focus()
    }
  }

  const handleResendRecoveryCode = async () => {
    if (!email || cooldown > 0 || loading) return
    setError('')
    setLoading(true)

    try {
      await authApi.sendPasswordRecoveryOtp(email.trim().toLowerCase())
      recordCodeSent()
      otpInputs.current[0]?.focus()
    } catch (e: any) {
      setError(e?.message || 'Failed to resend recovery code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!canSubmit) return
    setError('')
    setLoading(true)

    try {
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }

      const cleanEmail = email.trim().toLowerCase()

      // 1. Verify 6-digit recovery OTP
      const verifyRes = await authApi.verifyRecoveryOtp(cleanEmail, fullOtp)
      if (!verifyRes?.session && !verifyRes?.user) {
        throw new Error('Could not verify recovery code. Please request a new code.')
      }

      // 2. Set new password
      const updateRes = await supabase.auth.updateUser({ password: newPassword })
      if (updateRes.error) throw updateRes.error

      // 3. GLOBAL LOGOUT: Revoke all existing sessions across all devices in PostgreSQL
      try {
        await supabase.auth.signOut({ scope: 'global' })
      } catch (e) {
        console.warn('[FTC] Global session revocation warning:', e)
      }

      // 4. Authenticate current device with fresh credentials
      const signInRes = await authApi.signInWithPassword(cleanEmail, newPassword)
      const user = signInRes?.user

      try {
        localStorage.removeItem('ftc_recovery_email')
      } catch {}

      setSuccess(true)

      // 5. Navigate cleanly
      setTimeout(async () => {
        if (user) {
          try {
            const { data: userProfile } = await (supabase.from('users') as any)
              .select('name, role, city')
              .eq('id', user.id)
              .maybeSingle()

            const isCreator = userProfile?.role === 'creator'
            dispatch({
              type: 'COMPLETE_AUTH',
              isCreator,
              name: userProfile?.name || user.user_metadata?.name || 'User',
              city: userProfile?.city ?? undefined,
              email: user.email,
            })
            return
          } catch {}
        }
        dispatch({
          type: 'COMPLETE_AUTH',
          isCreator: false,
          name: 'User',
          email: cleanEmail,
        })
      }, 1200)
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
      <div className="px-5 py-4 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'BACK' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">
          Reset Password
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 max-w-md mx-auto w-full flex flex-col justify-between">
        <div>
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 grid place-items-center mb-4 mx-auto">
            <ShieldCheck size={28} className="text-emerald-600" />
          </div>

          <h1 className="font-display text-[26px] tracking-tight text-center leading-tight mb-1">
            Choose new password
          </h1>
          <p className="text-[13px] text-obsidian/60 text-center mb-5">
            Enter your 6-digit recovery code and new password. All other devices will be signed out.
          </p>

          <div className="space-y-4">
            {/* Email field / info */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-obsidian/60">Account Email</label>
                <button
                  type="button"
                  onClick={() => setEditingEmail(!editingEmail)}
                  className="text-[11px] text-iris hover:underline font-medium cursor-pointer"
                >
                  {editingEmail ? 'Done' : 'Change'}
                </button>
              </div>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-2.5 bg-bone/30 transition">
                <input
                  type="email"
                  value={email}
                  disabled={!editingEmail}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-[13.5px] placeholder:text-obsidian/40 disabled:opacity-75"
                />
              </div>
            </div>

            {/* 6-Digit Code Input */}
            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">6-Digit Recovery Code</label>
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
                    disabled={loading || success || isLocked}
                    className={cn(
                      'w-11 h-14 sm:w-12 sm:h-14 rounded-2xl border-2 bg-bone/40 text-center font-mono text-2xl font-bold outline-none transition disabled:opacity-40',
                      isLocked ? 'border-rose-300 bg-rose-50 text-rose-900 cursor-not-allowed' : 'border-obsidian/20 focus:border-obsidian focus:bg-paper'
                    )}
                  />
                ))}
              </div>

              {isExpired && !error && (
                <p className="text-[11.5px] text-danger text-center font-medium leading-snug pt-1 animate-fade-in">
                  This recovery code has expired (10-minute window). Please request a new code.
                </p>
              )}

              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-obsidian/50">Didn't receive code?</span>
                {cooldown > 0 ? (
                  <span className="text-obsidian/40 font-mono">Resend in {formatCooldown(cooldown)}</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendRecoveryCode}
                    disabled={loading || !email}
                    className="text-iris font-semibold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw size={11} /> Resend code
                  </button>
                )}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">New password</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition flex items-center gap-2">
                <input
                  ref={passwordInputRef}
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="tap text-obsidian/40 hover:text-obsidian transition cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Confirm new password</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition flex items-center gap-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                  placeholder="Repeat new password"
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                />
              </div>
            </div>

            {/* Validation Badges */}
            <div className="p-3 rounded-xl bg-bone border border-line space-y-1.5 text-[11px]">
              <div className={cn('flex items-center gap-2', isOtpComplete ? 'text-success font-medium' : 'text-obsidian/45')}>
                <Check size={13} className={cn(isOtpComplete ? 'text-success' : 'text-obsidian/30')} />
                <span>6-digit recovery code entered</span>
              </div>
              <div className={cn('flex items-center gap-2', isMinLength ? 'text-success font-medium' : 'text-obsidian/45')}>
                <Check size={13} className={cn(isMinLength ? 'text-success' : 'text-obsidian/30')} />
                <span>At least 6 characters</span>
              </div>
              <div className={cn('flex items-center gap-2', hasSpecialOrNum ? 'text-success font-medium' : 'text-obsidian/45')}>
                <Check size={13} className={cn(hasSpecialOrNum ? 'text-success' : 'text-obsidian/30')} />
                <span>Includes a number or symbol</span>
              </div>
              <div className={cn('flex items-center gap-2', isMatching ? 'text-success font-medium' : 'text-obsidian/45')}>
                <Check size={13} className={cn(isMatching ? 'text-success' : 'text-obsidian/30')} />
                <span>Passwords match</span>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-danger font-medium leading-snug animate-fade-in">{error}</p>
            )}

            {success && (
              <p className="text-[12.5px] text-success font-semibold flex items-center justify-center gap-1.5 bg-success/10 py-2.5 rounded-xl animate-fade-in">
                <CheckCircle2 size={16} /> Password updated & sessions revoked! Redirecting…
              </p>
            )}

            <button
              onClick={handleResetPassword}
              disabled={!canSubmit || success}
              className="tap w-full mt-2 py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-sm cursor-pointer"
            >
              {loading ? 'Securing account…' : success ? 'Password Updated ✓' : 'Update Password & Boot Other Devices'}
            </button>
          </div>
        </div>

        <div className="pt-4 text-center">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap text-[12.5px] text-obsidian/50 hover:text-obsidian cursor-pointer"
          >
            Cancel and return to sign in
          </button>
        </div>
      </div>
    </div>
  )
}
