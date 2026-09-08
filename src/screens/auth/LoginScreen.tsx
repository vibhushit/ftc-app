import { useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { GoogleG } from './GoogleG'

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
      if (!supabaseAvailable) {
        throw new Error('Supabase client is not configured.')
      }
      await authApi.signInWithPassword(email.trim(), password)
    } catch (e: any) {
      setError(e?.message || 'Invalid email or password. Please try again or use Forgot Password.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    if (!supabaseAvailable) {
      setError('Google authentication requires active Supabase configuration.')
      return
    }
    try {
      await authApi.signInWithGoogle()
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed.')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      {/* Header */}
      <div className="px-5 pt-3 pb-3 flex items-center justify-between border-b border-line">
        <button
          type="button"
          onClick={() => dispatch({ type: 'GO', screen: 'welcome' })}
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
        <p className="text-[13px] text-obsidian/60 text-center mb-6">
          Enter your email and password to access your account
        </p>

        {/* Input Form */}
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
                className="tap p-1 text-obsidian/40 hover:text-obsidian transition"
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
            disabled={!isFormValid || loading}
            className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none hover:bg-obsidian/90 transition shadow-sm mt-2 cursor-pointer"
          >
            <span>{loading ? 'Signing in…' : 'Sign in'}</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
            className="w-full text-center text-[12.5px] text-obsidian/60 pt-2 cursor-pointer hover:text-obsidian transition"
          >
            Don’t have an account? <span className="text-iris font-semibold underline">Sign up</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-obsidian/10" />
          <span className="text-[11.5px] font-medium text-obsidian/40">or</span>
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
      </div>
    </div>
  )
}

// Alias for backward compatibility
export const PhoneScreen = LoginScreen
