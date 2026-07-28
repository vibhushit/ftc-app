import { Check, Lock, Share2 } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { inr } from '@/data/constants'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

export function ConfirmedScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const c = CREATORS.find(x => x.id === state.selectedCreatorId) ?? CREATORS[0]
  const lb = (state.lastBooking ?? {}) as Record<string, unknown>
  const dep = depositInfo((lb.total as number) || Math.round(c.startingAt * 2.5))
  const advAmt = (lb.advance as number) ?? dep.advance
  const dateLine = `${(lb.when as string) || 'Apr 27 · 1:00 PM'} · ${(lb.pkg as string) || 'Standard'}`

  return (
    <div className="flex-1 flex flex-col bg-obsidian text-paper relative overflow-hidden">
      <div className="absolute top-20 right-0 w-80 h-80 dots-acid opacity-20 pointer-events-none" style={{ transform: 'translateX(30%)' }} />
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-acid grid place-items-center mb-6">
          <Check size={40} className="text-obsidian" strokeWidth={3} />
        </div>
        <h1 className="font-display text-4xl tracking-tight leading-none">
          Booking<br /><span className="italic">confirmed</span>.
        </h1>
        <p className="mt-4 text-[14px] text-paper/70 max-w-xs">
          {dep.full
            ? `${inr(advAmt)} is held safely in FTC escrow and released to the creator once you approve the delivery.`
            : `${inr(advAmt)} (${dep.pct}%) collected and held in escrow. Balance due on delivery approval.`}
        </p>
        <div className="mt-10 p-5 rounded-2xl bg-paper/10 w-full max-w-sm">
          <div className="flex items-center gap-3">
            <img src={c.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div className="text-left flex-1">
              <div className="font-display text-lg leading-tight">{c.name}</div>
              <div className="text-[11px] text-paper/60">{dateLine}</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-paper/5 flex items-center gap-2 text-[11px] text-paper/70">
            <Lock size={12} className="text-acid" />
            <span>{inr(advAmt)} {dep.full ? 'in escrow' : `(${dep.pct}%) in escrow`} · Booking ID #{(lb.id as string) || 'FTC8472'}</span>
          </div>
        </div>
      </div>
      <div className="relative px-6 pb-10 pt-4 space-y-3">
        <button className="tap w-full py-4 rounded-2xl bg-paper/15 text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
          <Share2 size={15} /> Share to WhatsApp
        </button>
        <button onClick={() => dispatch({ type: 'GO_TAB', tab: 'home' })} className="tap w-full py-4 rounded-2xl bg-acid text-obsidian font-semibold text-[14px]">
          Back to home
        </button>
      </div>
    </div>
  )
}
