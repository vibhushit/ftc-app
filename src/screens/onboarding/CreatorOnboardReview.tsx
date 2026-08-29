import { useState } from 'react'
import { Clock, Check } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'

export function CreatorOnboardReview() {
  const dispatch = useAppStore(s => s.dispatch)
  const [finishing, setFinishing] = useState(false)

  const handleFinish = async () => {
    setFinishing(true)
    try {
      if (supabaseAvailable && isLiveMode()) {
        await authApi.setUserRole('creator')
      }
    } catch (e) {
      console.warn('[FTC] setUserRole creator failed:', e)
    }
    dispatch({ type: 'MARK_CREATOR' })
    dispatch({ type: 'GO_TAB', tab: 'me' })
  }

  return (
    <div className="flex-1 flex flex-col bg-obsidian text-paper relative overflow-hidden">
      <div className="absolute top-20 -right-20 w-80 h-80 dots-acid opacity-20 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 dots-acid opacity-15 pointer-events-none" />
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-iris grid place-items-center mb-6">
          <Clock size={36} className="text-paper" />
        </div>
        <h1 className="font-display text-4xl tracking-tight leading-none">
          You're<br /><span className="italic">in review</span>.
        </h1>
        <p className="mt-4 text-[14px] text-paper/70 max-w-xs leading-relaxed">
          Our team manually vets every new creator. Expect an answer within 48 hours on WhatsApp.
        </p>
        <div className="mt-8 p-4 rounded-2xl bg-paper/10 w-full max-w-sm text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-acid mb-2">While you wait</div>
          <div className="space-y-2 text-[12px] text-paper/80">
            {[
              'Complete your profile for +10 trust',
              'Share your FTC link on Instagram — earn early bookings',
              'Join your city\'s creator community',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check size={13} className="text-acid mt-0.5 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative px-6 pb-10 pt-4">
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="tap w-full py-4 rounded-2xl bg-acid text-obsidian font-semibold text-[14px]"
        >
          {finishing ? 'Finalizing profile…' : 'Back to app'}
        </button>
      </div>
    </div>
  )
}
