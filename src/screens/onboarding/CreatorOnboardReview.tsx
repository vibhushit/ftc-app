import { useState } from 'react'
import { Check, Sparkles, Copy, ArrowRight } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

export function CreatorOnboardReview() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [finishing, setFinishing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handle = state.onboard.handle || state.onboard.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'creator'
  const cleanHandle = handle.replace(/^@+/, '')
  const publicUrl = `findtoconnect.com/@${cleanHandle}`

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(`https://${publicUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleFinish = async () => {
    setFinishing(true)
    try {
      if (supabaseAvailable) {
        await authApi.setUserRole('creator')
      }
    } catch (e) {
      console.warn('[FTC] setUserRole creator failed:', e)
    }
    // Clean up draft storage
    try {
      localStorage.removeItem('ftc_saved_session')
    } catch {}

    dispatch({ type: 'SET_ROLE', isCreator: true })
    dispatch({ type: 'MARK_CREATOR' })
    dispatch({ type: 'GO_TAB', tab: 'me' })
  }

  return (
    <div className="flex-1 flex flex-col bg-obsidian text-paper relative overflow-hidden min-h-screen">
      <div className="absolute top-16 -right-20 w-80 h-80 dots-acid opacity-20 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 dots-acid opacity-15 pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-10 text-center max-w-md mx-auto w-full">
        {/* Animated Celebration Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success grid place-items-center">
            <Check size={38} className="text-success stroke-[2.5]" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-acid text-obsidian grid place-items-center shadow-lg">
            <Sparkles size={16} />
          </div>
        </div>

        <span className="text-[11px] font-mono uppercase tracking-widest text-acid font-semibold mb-2">
          Profile Published
        </span>

        <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-none">
          You're live<br /><span className="italic text-acid">on FTC!</span>
        </h1>

        <p className="mt-3.5 text-[14px] text-paper/70 leading-relaxed max-w-xs">
          Your profile, packages, and calendar are ready. Share your link to start receiving client bookings.
        </p>

        {/* Public Link Card */}
        <div className="mt-7 w-full p-4 rounded-2xl bg-paper/10 border border-paper/15 text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-paper/50 mb-1.5 flex items-center justify-between">
            <span>Your Personal Booking Link</span>
            <span className="text-success flex items-center gap-1 font-medium">● Active</span>
          </div>

          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-obsidian/70 border border-paper/10 mt-1">
            <span className="font-mono text-[13px] text-paper/90 truncate select-all">
              {publicUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="tap shrink-0 px-3 py-1.5 rounded-lg bg-paper/15 hover:bg-paper/25 text-paper text-[12px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-success" />
                  <span className="text-success">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Next Steps List */}
        <div className="mt-5 w-full p-4 rounded-2xl bg-paper/5 border border-paper/10 text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-acid mb-2.5 font-semibold">
            Next steps for growth
          </div>
          <div className="space-y-2 text-[12px] text-paper/80">
            {[
              'Add your FTC link to your Instagram bio for 1-tap bookings',
              'Set your calendar availability to receive immediate booking requests',
              'Share your packages with existing clients to handle billing via escrow',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 leading-snug">
                <span className="w-4 h-4 rounded-full bg-paper/10 text-acid font-mono text-[10px] grid place-items-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="relative px-6 pb-10 pt-2 max-w-md mx-auto w-full">
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="tap w-full py-4 rounded-2xl bg-acid text-obsidian font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-acid/90 transition shadow-lg cursor-pointer"
        >
          {finishing ? (
            'Opening dashboard…'
          ) : (
            <>
              <span>Open Creator Dashboard</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
