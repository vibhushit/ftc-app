import { Check, Lock, Share2, Calendar, Download, Clock, ExternalLink } from 'lucide-react'
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
  const dateLine = `${(lb.when as string) || 'May 15 · 10:00 AM'} · ${(lb.pkg as string) || 'Standard'}`
  const isPending = (lb.status as string) === 'pending_approval'

  const titleText = encodeURIComponent(`FTC Shoot: ${c.name} (${(lb.pkg as string) || 'Session'})`)
  const detailsText = encodeURIComponent(`Creator: ${c.name}\nPackage: ${(lb.pkg as string) || 'Session'}\nShoot Timing: ${(lb.when as string) || ''}\nLocation: ${c.area || 'Studio'}\nBooking Code: ${(lb.id as string) || 'FTC8472'}\nStatus: ${isPending ? 'Pending Creator Acceptance (24h SLA)' : 'Confirmed'}`)
  const locationText = encodeURIComponent(c.area || 'Studio')
  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titleText}&details=${detailsText}&location=${locationText}`

  const downloadIcs = () => {
    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FTC Creator Marketplace//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${(lb.id as string) || 'FTC8472'}@ftc.co`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${nowStr}`,
      `SUMMARY:FTC Shoot: ${c.name} (${(lb.pkg as string) || 'Session'})`,
      `LOCATION:${c.area || 'Studio'}`,
      `DESCRIPTION:Shoot booking on FTC with ${c.name}. Booking ID: ${(lb.id as string) || 'FTC8472'}`,
      `STATUS:${isPending ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FTC-Shoot-${(lb.id as string) || '8472'}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 flex flex-col bg-obsidian text-paper relative overflow-hidden">
      <div className="absolute top-20 right-0 w-80 h-80 dots-acid opacity-20 pointer-events-none" style={{ transform: 'translateX(30%)' }} />
      <div className="app-scroll relative flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
        <div className="w-20 h-20 rounded-full bg-acid grid place-items-center mb-5">
          {isPending ? (
            <Clock size={38} className="text-obsidian" strokeWidth={2.5} />
          ) : (
            <Check size={40} className="text-obsidian" strokeWidth={3} />
          )}
        </div>

        <h1 className="font-display text-4xl tracking-tight leading-none">
          {isPending ? (
            <>Request<br /><span className="italic text-acid">submitted</span>.</>
          ) : (
            <>Booking<br /><span className="italic text-acid">confirmed</span>.</>
          )}
        </h1>

        {isPending && (
          <div className="mt-3 py-1.5 px-3.5 rounded-full bg-paper/10 text-acid font-mono text-[11px] flex items-center gap-1.5">
            <Clock size={13} />
            <span>24-Hour Creator Guarantee Active</span>
          </div>
        )}

        <p className="mt-3 text-[13.5px] text-paper/70 max-w-xs leading-relaxed">
          {isPending
            ? `${c.name} has 24 hours to accept your shoot request. Your ${inr(advAmt)} advance is safely authorized in FTC escrow.`
            : dep.full
            ? `${inr(advAmt)} is held safely in FTC escrow and released to the creator once you approve the delivery.`
            : `${inr(advAmt)} (${dep.pct}%) collected and held in escrow. Balance due on delivery approval.`}
        </p>

        <div className="mt-6 p-5 rounded-2xl bg-paper/10 w-full max-w-sm border border-paper/10">
          <div className="flex items-center gap-3">
            <img src={c.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-display text-lg leading-tight truncate">{c.name}</div>
              <div className="text-[11px] text-paper/60 truncate">{dateLine}</div>
            </div>
          </div>
          <div className="mt-3.5 p-3 rounded-xl bg-paper/5 flex items-center gap-2 text-[11px] text-paper/70">
            <Lock size={12} className="text-acid shrink-0" />
            <span className="truncate">{inr(advAmt)} {dep.full ? 'in escrow' : `(${dep.pct}%) in escrow`} · #{(lb.id as string) || 'FTC8472'}</span>
          </div>
        </div>

        {/* Add to Calendar Section */}
        <div className="mt-5 w-full max-w-sm space-y-2 text-left">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-paper/50 px-1">Save to Calendar</div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tap p-3 rounded-xl bg-paper/10 hover:bg-paper/15 text-paper text-[12px] font-medium flex items-center justify-center gap-1.5 transition border border-paper/10"
            >
              <Calendar size={14} className="text-acid" />
              <span>Google Cal</span>
              <ExternalLink size={11} className="opacity-50" />
            </a>
            <button
              onClick={downloadIcs}
              className="tap p-3 rounded-xl bg-paper/10 hover:bg-paper/15 text-paper text-[12px] font-medium flex items-center justify-center gap-1.5 transition border border-paper/10"
            >
              <Download size={14} className="text-acid" />
              <span>Apple / .ics</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative px-6 pb-8 pt-3 space-y-2.5 shrink-0 bg-obsidian border-t border-paper/10">
        <button
          onClick={() => dispatch({ type: 'GO_TAB', tab: 'home' })}
          className="tap w-full py-3.5 rounded-2xl bg-acid text-obsidian font-semibold text-[14px]"
        >
          Done · View My Pipeline
        </button>
      </div>
    </div>
  )
}
