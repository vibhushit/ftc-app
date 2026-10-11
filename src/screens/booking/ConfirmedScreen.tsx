import { Check, Calendar, Download, Clock, ExternalLink } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { useCreator } from '@/hooks/useCreators'
import { inr } from '@/data/constants'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

export function ConfirmedScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { data: dbCreator } = useCreator(state.selectedCreatorId)
  const lb = (state.lastBooking ?? {}) as Record<string, unknown>

  if (!lb.id) {
    return (
      <div className="flex-1 flex flex-col bg-obsidian text-paper items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="font-display text-xl mb-1">No Booking Found</h2>
        <p className="text-[13px] text-paper/60 max-w-xs mb-6">
          Unable to display confirmation because no active booking request was recorded.
        </p>
        <button
          onClick={() => dispatch({ type: 'GO_TAB', tab: 'home' })}
          className="tap px-5 py-2.5 rounded-2xl bg-acid text-obsidian text-[13px] font-semibold"
        >
          Go to Home
        </button>
      </div>
    )
  }

  const bookingId = String(lb.id)
  const creatorName = (lb.creatorName as string) || dbCreator?.users?.name || 'Creator'
  const creatorAvatar = (lb.creatorAvatar as string) || dbCreator?.users?.avatar_url || ''
  const creatorArea = dbCreator?.area || 'Studio'
  const totalAmt = typeof lb.total === 'number' ? lb.total : (typeof lb.price === 'number' ? lb.price : 0)
  const dep = depositInfo(totalAmt)
  const advAmt = typeof lb.advance === 'number' ? lb.advance : (typeof lb.deposit_amount === 'number' ? lb.deposit_amount : dep.advance)
  const dateLine = `${(lb.when as string) || (lb.date_time as string) || 'Scheduled'} · ${(lb.pkg as string) || (lb.pkg_name as string) || 'Session'}`
  const isPending = (lb.status as string) === 'pending' || (lb.status as string) === 'pending_approval'

  const titleText = encodeURIComponent(`FTC Shoot: ${creatorName} (${(lb.pkg as string) || (lb.pkg_name as string) || 'Session'})`)
  const detailsText = encodeURIComponent(`Creator: ${creatorName}\nPackage: ${(lb.pkg as string) || (lb.pkg_name as string) || 'Session'}\nShoot Timing: ${(lb.when as string) || (lb.date_time as string) || ''}\nLocation: ${creatorArea}\nBooking Code: #${bookingId}`)
  const locationText = encodeURIComponent(creatorArea)
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
      `UID:${bookingId}@ftc.co`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${nowStr}`,
      `SUMMARY:FTC Shoot: ${creatorName} (${(lb.pkg as string) || (lb.pkg_name as string) || 'Session'})`,
      `LOCATION:${creatorArea}`,
      `DESCRIPTION:Shoot booking on FTC with ${creatorName}. Booking ID: ${bookingId}`,
      `STATUS:${isPending ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FTC-Shoot-${bookingId}.ics`
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

        <p className="mt-3 text-[13.5px] text-paper/70 max-w-xs leading-relaxed">
          {isPending
            ? `Your request has been sent to ${creatorName}. They have 24 hours to confirm your slot.`
            : `Your session booking with ${creatorName} has been confirmed.`}
        </p>

        {/* Creator & Booking Card */}
        <div className="mt-6 p-4 rounded-2xl bg-paper/10 w-full max-w-sm border border-paper/10 text-left">
          <div className="flex items-center gap-3">
            {creatorAvatar ? (
              <img src={creatorAvatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt="" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-paper/20 font-semibold text-paper grid place-items-center shrink-0">
                {creatorName.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg leading-tight truncate">{creatorName}</div>
              <div className="text-[11px] text-paper/60 truncate mt-0.5">{dateLine}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[13px] font-bold text-acid">{inr(advAmt)}</div>
              <div className="text-[10px] text-paper/50 font-mono">Advance</div>
            </div>
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

      {/* Clean Bottom Navigation Buttons */}
      <div className="relative px-6 pb-8 pt-3 space-y-2 shrink-0 bg-obsidian border-t border-paper/10 max-w-sm w-full mx-auto">
        <button
          onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: lb as any })}
          className="tap w-full py-3.5 rounded-2xl bg-acid text-obsidian font-semibold text-[14px] hover:opacity-90 transition shadow-xs"
        >
          View Booking Details
        </button>
        <button
          onClick={() => dispatch({ type: 'GO', screen: 'discover' })}
          className="tap w-full py-3 rounded-2xl bg-paper/10 text-paper font-semibold text-[13px] hover:bg-paper/15 transition border border-paper/10"
        >
          Explore More Creators
        </button>
      </div>
    </div>
  )
}
