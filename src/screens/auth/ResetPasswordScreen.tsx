import { useState } from 'react'
import { X, ShieldCheck, Eye, EyeOff, Check, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { supabaseAvailable, supabase } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'

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
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Your reset session has expired or was already used. Please request a new link.')
        }
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
      const msg = e?.message || ''
      if (msg.toLowerCase().includes('auth session missing') || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('jwt')) {
        setError('Your password link has expired or was already opened. Please request a new link.')
      } else {
        setError(msg || 'Failed to update password. Please try again.')
      }
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
          onClick={() => dispatch({ type: 'GO', screen: 'login' })}
          className="tap w-9 h-9 -ml-1.5 grid place-items-center rounded-full hover:bg-bone transition cursor-pointer"
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
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition flex items-center gap-2">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="tap text-obsidian/40 hover:text-obsidian transition"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-obsidian/60 block mb-1">Confirm new password</label>
              <div className="rounded-2xl border-2 border-obsidian/15 focus-within:border-obsidian px-4 py-3 bg-bone/30 transition flex items-center gap-2">
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

            {error && (
              <div className="space-y-2">
                <p className="text-[12px] text-danger font-medium">{error}</p>
                {error.includes('expired') && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'GO', screen: 'forgotPassword' })}
                    className="tap w-full py-2.5 rounded-xl bg-iris/10 text-iris text-[12.5px] font-semibold hover:bg-iris/20 transition flex items-center justify-center gap-1.5"
                  >
                    Request a new link →
                  </button>
                )}
              </div>
            )}
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
