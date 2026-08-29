import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, ArrowRight, X, Mail, RotateCcw, Sparkles, CheckCircle2, UserCheck, Palette, Lock, Eye, EyeOff, KeyRound, ShieldCheck, Check } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { cn } from '@/utils'
import { supabaseAvailable, supabase } from '@/lib/supabase'
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

/* ═══════════════════════════════════════════════════════════════════════════
   1. SIGN UP SCREEN (Get Started -> Enter Email -> Verify -> Set Password)
   ═══════════════════════════════════════════════════════════════════════════ */
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
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'welcome' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full z-10 hover:bg-bone transition cursor-pointer"
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
                {loading ? 'Sending verification…' : cooldown > 0 ? `Resend in ${cooldown}s` : <><span>Continue →</span></>}
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

/* ═══════════════════════════════════════════════════════════════════════════
   2. LOGIN SCREEN (Sign In with Email & Password)
   ═══════════════════════════════════════════════════════════════════════════ */
export function LoginScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const isEmailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const isFormValid = isEmailValid && password.length >= 6

  const handlePasswordLogin = async () => {
    if (!isFormValid || loading) return
    setError('')
    setLoading(true)

    try {
      if (supabaseAvailable && isLiveMode()) {
        await authApi.signInWithPassword(email.trim(), password)
      } else {
        // Sandbox mock login -> follow the real signup/login flow to Role selection
        const username = email.trim().split('@')[0] || 'User'
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1)
        dispatch({
          type: 'SYNC_AUTH_USER',
          userId: 'mock-user-id',
          name: formattedName,
          email: email.trim(),
          isCreator: false,
        })
        dispatch({ type: 'GO', screen: 'role' })
      }
    } catch (e: any) {
      setError(e?.message || 'Invalid email or password. Please try again or use Forgot Password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (supabaseAvailable && isLiveMode()) {
      try {
        await authApi.signInWithGoogle()
      } catch (err: any) {
        setError(err?.message || 'Google sign in failed.')
      }
    } else {
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
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'welcome' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full z-10 hover:bg-bone transition cursor-pointer"
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
        <h1 className="font-display text-[26px] tracking-tight text-center leading-tight mb-1">
          Welcome back
        </h1>
        <p className="text-[13px] text-obsidian/55 text-center mb-6">
          Enter your email and password to log in to your account
        </p>

        {/* Input Form */}
        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Email address</label>
            <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 bg-bone/30 transition">
              <input
                autoFocus
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="name@example.com"
                className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-obsidian/60">Password</label>
              <button
                onClick={() => dispatch({ type: 'GO', screen: 'forgotPassword' })}
                type="button"
                className="tap text-[11px] font-medium text-iris hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 bg-bone/30 transition flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="Enter your password"
                className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="tap text-obsidian/40 hover:text-obsidian shrink-0"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {error && <p className="mt-2.5 text-[12px] text-danger font-medium">{error}</p>}

        {/* Primary Login Button */}
        <button
          onClick={handlePasswordLogin}
          disabled={!isFormValid || loading}
          className="tap w-full mt-5 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] transition disabled:opacity-40 shadow-sm"
        >
          {loading ? 'Signing in…' : 'Sign in with Password'}
        </button>

        {/* Sign Up Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
            className="tap text-[12.5px] text-obsidian/65 hover:text-obsidian"
          >
            Don’t have an account? <span className="text-iris font-semibold underline">Sign up</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-obsidian/10" />
          <span className="text-[11.5px] font-medium text-obsidian/45">or</span>
          <div className="flex-1 h-px bg-obsidian/10" />
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleAuth}
          className="tap w-full py-3.5 px-4 rounded-2xl border-2 border-line bg-paper flex items-center justify-center gap-3 active:bg-bone hover:border-obsidian/30 transition-all shadow-xs"
        >
          <GoogleG size={18} />
          <span className="text-[13.5px] font-medium text-obsidian">Continue with Google</span>
        </button>

        {/* Sandbox Quick Test Presets */}
        {!isLiveMode() && (
          <div className="mt-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono font-semibold text-amber-900 uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-amber-600" />
              <span>Sandbox 1-Click Test</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('client')}
                className="tap py-2 px-2.5 rounded-xl bg-paper border border-amber-500/40 text-[11.5px] font-medium text-obsidian hover:bg-amber-50 text-left flex items-center gap-1.5"
              >
                <UserCheck size={13} className="text-iris shrink-0" />
                <span className="truncate">Client: Rhea</span>
              </button>
              <button
                onClick={() => quickLogin('creator')}
                className="tap py-2 px-2.5 rounded-xl bg-paper border border-amber-500/40 text-[11.5px] font-medium text-obsidian hover:bg-amber-50 text-left flex items-center gap-1.5"
              >
                <Palette size={13} className="text-iris shrink-0" />
                <span className="truncate">Creator: Arjun</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Alias for backward compatibility
export const PhoneScreen = LoginScreen

/* ═══════════════════════════════════════════════════════════════════════════
   3. FORGOT PASSWORD SCREEN (Request Recovery Link -> In-Place Confirmation)
   ═══════════════════════════════════════════════════════════════════════════ */
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
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-5 py-4 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'login' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full z-10 hover:bg-bone transition cursor-pointer"
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

              {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

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

/* ═══════════════════════════════════════════════════════════════════════════
   4. SET / RESET PASSWORD SCREEN (Enter New Password -> Redirect to Login)
   ═══════════════════════════════════════════════════════════════════════════ */
export function ResetPasswordScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [newPassword, setNewPassword]         = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass]               = useState(false)
  const [loading, setLoading]                 = useState(false)
  const [success, setSuccess]                 = useState(false)
  const [error, setError]                     = useState('')

  const isMinLength = newPassword.length >= 6
  const hasSpecialOrNum = /[0-9!@#$%^&*]/.test(newPassword)
  const isMatching = newPassword === confirmPassword && confirmPassword.length > 0
  const canSubmit = isMinLength && isMatching && !loading

  const handleUpdatePassword = async () => {
    if (!canSubmit) return
    setError('')
    setLoading(true)

    try {
      if (supabaseAvailable && isLiveMode()) {
        await authApi.updateUserPassword(newPassword)
        // Cleanly sign out temporary recovery token so user logs in cleanly
        await supabase.auth.signOut()
      }
      setSuccess(true)
      setTimeout(() => {
        dispatch({ type: 'RESET' })
        dispatch({ type: 'GO', screen: 'login' })
      }, 1600)
    } catch (e: any) {
      setError(e?.message || 'Failed to update password. Please try again or request a new reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-5 py-4 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'login' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full z-10 hover:bg-bone transition cursor-pointer"
        >
          <X size={20} />
        </button>
        <span className="font-display text-[17px] tracking-tight">
          Create New Password
        </span>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-8 max-w-sm mx-auto w-full flex flex-col justify-between">
        <div>
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 grid place-items-center mb-5 mx-auto">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>

          <h1 className="font-display text-3xl font-light tracking-tight text-center leading-tight mb-2">
            Set your new<br /><span className="italic">password.</span>
          </h1>
          <p className="text-[13px] text-obsidian/60 text-center mb-6">
            Choose a secure password with at least 6 characters.
          </p>

          <div className="space-y-3.5">
            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">New password</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 bg-bone/30 transition flex items-center gap-2">
                <input
                  autoFocus
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="tap text-obsidian/40 hover:text-obsidian shrink-0"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Confirm new password</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3.5 bg-bone/30 transition flex items-center gap-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdatePassword()}
                  placeholder="Confirm new password"
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                />
              </div>
            </div>

            {/* Password Validation Badges */}
            <div className="p-3 rounded-xl bg-bone border border-line space-y-1.5 text-[11px]">
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

            {error && <p className="text-[12px] text-danger font-medium">{error}</p>}
            {success && (
              <p className="text-[12.5px] text-success font-semibold flex items-center justify-center gap-1.5 bg-success/10 py-2.5 rounded-xl">
                <CheckCircle2 size={16} /> Password saved! Redirecting to login…
              </p>
            )}

            <button
              onClick={handleUpdatePassword}
              disabled={!canSubmit || success}
              className="tap w-full mt-2 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-sm"
            >
              {loading ? 'Saving password…' : success ? 'Saved ✓' : 'Save New Password & Continue'}
            </button>
          </div>
        </div>

        <div className="pt-4 text-center">
          <button onClick={() => dispatch({ type: 'GO', screen: 'login' })} className="tap text-[12px] text-obsidian/50 hover:text-obsidian">
            Cancel and return to sign in
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. MAGIC LINK SENT & OTP SCREENS (Kept as graceful helpers)
   ═══════════════════════════════════════════════════════════════════════════ */
export function MagicLinkSentScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  return (
    <div className="flex-1 flex flex-col bg-paper">
      <div className="px-6 py-4 flex items-center">
        <button onClick={() => dispatch({ type: 'GO', screen: 'login' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
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
          We sent a sign-in link to <span className="font-semibold text-obsidian">{pendingPhone}</span>.
        </p>
        <button
          onClick={() => dispatch({ type: 'GO', screen: 'login' })}
          className="tap mt-6 px-6 py-3 rounded-2xl bg-obsidian text-paper font-semibold text-[13px]"
        >
          Return to Sign In
        </button>
      </div>
    </div>
  )
}

export function OtpScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  return (
    <div className="flex-1 flex flex-col bg-paper items-center justify-center p-6 text-center">
      <h2 className="font-display text-2xl mb-2">Verification Code</h2>
      <p className="text-[13px] text-obsidian/60 mb-6">Sent to {pendingPhone}</p>
      <button onClick={() => dispatch({ type: 'GO', screen: 'login' })} className="tap px-5 py-2.5 rounded-xl bg-obsidian text-paper text-[13px]">
        Back to Login
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. ROLE SELECTION SCREEN (Setup Flow: Client vs Creator)
   ═══════════════════════════════════════════════════════════════════════════ */
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
            Select your primary intent. You can hire creators or offer creative services anytime.
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
