import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { apiClient } from '@/services/apiClient'
import { isLiveMode } from '@/config/environmentMode'

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
    setTimeout(() => {
      if (role === 'client') {
        dispatch({ type: 'GO', screen: 'clientOnboard' })
      } else {
        dispatch({ type: 'START_CREATOR_ONBOARD', origin: 'role' })
      }
    }, 250)
  }

  const isOn = (key: string) => sel === key || (sel === null && hover === key)
  const cardCls = (key: string, accent: string) => cn(
    'tap w-full p-6 rounded-3xl text-left relative overflow-hidden border-2 transition-all duration-300',
    isOn(key)
      ? (accent === 'dark' ? 'bg-obsidian text-paper border-obsidian shadow-2xl' : 'bg-iris text-paper border-iris shadow-2xl')
      : 'bg-paper text-obsidian border-line hover:border-obsidian/30',
    sel === key && 'ring-2 ring-offset-2 ring-obsidian',
  )

  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      <div className="px-6 pt-5 pb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-obsidian/50">Your intent</span>
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
              <p className={cn('text-[13px] leading-relaxed', isOn('client') ? 'text-paper/80' : 'text-obsidian/60')}>
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
              <p className={cn('text-[13px] leading-relaxed', isOn('creator') ? 'text-paper/80' : 'text-obsidian/60')}>
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
