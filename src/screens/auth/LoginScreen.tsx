import { useState } from 'react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Sparkles, UserCheck, Palette } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'
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
                autoFocus
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-obsidian/60">Password</label>
              <button
                type="button"
                onClick={() => dispatch({ type: 'GO', screen: 'forgotPassword' })}
                className="text-[11.5px] text-iris hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="tap text-obsidian/40 hover:text-obsidian transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-danger font-medium">{error}</p>
          )}

          <button
            onClick={handlePasswordLogin}
            disabled={!isFormValid || loading}
            className="tap w-full mt-2 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] flex items-center justify-center gap-2 transition disabled:opacity-40 shadow-sm"
          >
            {loading ? 'Signing in…' : <><span>Sign In</span> <ArrowRight size={16} /></>}
          </button>
        </div>

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
