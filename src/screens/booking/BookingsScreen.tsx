import { ArrowLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { useMyBookings } from '@/hooks/useBookings'
import { inr } from '@/data/constants'
import { cn } from '@/utils'

export function BookingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { data: dbBookings, isLoading, error } = useMyBookings()

  const bookings = dbBookings && dbBookings.length > 0
    ? dbBookings
    : (state.lastBooking ? [state.lastBooking] : [])

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between bg-paper border-b border-line shrink-0">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 p-2"><ArrowLeft size={20} /></button>
        <div className="font-display text-lg">My bookings</div>
        <div className="w-8" />
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <Loader2 size={24} className="animate-spin text-iris mb-2" />
          <p className="text-[12px] text-obsidian/50 font-mono">Loading your bookings…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <div className="text-3xl mb-2">⚠️</div>
          <h2 className="font-display text-lg mb-1">Failed to load bookings</h2>
          <p className="text-[12px] text-obsidian/60 max-w-xs mb-4">
            Could not retrieve your bookings from the server. Please check connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="tap px-4 py-2 rounded-xl bg-obsidian text-paper text-[12px] font-semibold"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <div className="w-16 h-16 rounded-full bg-bone grid place-items-center mb-4 text-obsidian/40">
            <Calendar size={28} />
          </div>
          <h2 className="font-display text-xl mb-1">No bookings yet</h2>
          <p className="text-[13px] text-obsidian/60 max-w-xs mb-6">
            When you book sessions or request quotes from creators, they will appear here.
          </p>
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'discover' })}
            className="tap px-5 py-2.5 rounded-2xl bg-obsidian text-paper text-[13px] font-semibold hover:bg-obsidian/90 transition"
          >
            Explore Creators
          </button>
        </div>
      ) : (
        <div className="app-scroll flex-1 min-h-0 px-5 pt-4 pb-8 space-y-3.5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 items-stretch">
          {bookings.map((b: any) => {
            const badge = b.status === 'confirmed'
              ? { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80', t: 'Confirmed' }
              : b.status === 'pending_approval' || b.status === 'pending'
                ? { cls: 'bg-amber-50 text-amber-800 border border-amber-200/80', t: 'Awaiting creator' }
                : b.status === 'cancelled'
                  ? { cls: 'bg-rose-50 border border-rose-200 text-rose-700', t: 'Cancelled' }
                  : { cls: 'bg-bone border border-line text-obsidian/70', t: 'Completed' }
            const name = b.creator?.name || b.creatorName || b.clientName || 'Creator'
            const rawAvatar = b.creator?.avatar_url || b.creatorAvatar || b.clientAvatar || ''
            const avatar = (rawAvatar.includes('picsum.photos') || rawAvatar.includes('photo-1534528741775')) ? '' : rawAvatar
            const when = b.session_date ? `${b.session_date}${b.session_time ? ` · ${b.session_time}` : ''}` : (b.when || b.date || b.date_time || 'Upcoming')
            const pkgTitle = b.service?.name || b.pkg_name || b.pkg || 'Session Booking'
            const price = typeof b.total_price === 'number' ? b.total_price : (typeof b.price === 'number' ? b.price : (typeof b.total === 'number' ? b.total : 0))
            const advance = typeof b.advance_amount === 'number' ? b.advance_amount : (typeof b.deposit_amount === 'number' ? b.deposit_amount : (typeof b.advance === 'number' ? b.advance : 0))
            const refCode = b.booking_ref ? `#${b.booking_ref}` : b.booking_code ? `#${b.booking_code}` : (b.id ? `#FTC-${String(b.id).slice(0, 8).toUpperCase()}` : '')

            return (
              <button
                key={b.id}
                onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b, prevScreen: 'bookings' })}
                className="tap w-full text-left p-4.5 rounded-2xl bg-paper border border-line hover:border-obsidian/30 active:scale-[0.99] transition-all shadow-xs flex flex-col justify-between group md:h-full"
              >
                <div>
                  {/* Top: Creator & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {avatar ? (
                        <img src={avatar} className="w-11 h-11 rounded-full object-cover shrink-0 border border-line" alt="" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-obsidian text-paper font-semibold grid place-items-center text-sm shrink-0">
                          {name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[14px] font-semibold text-obsidian truncate group-hover:text-iris transition-colors">{name}</div>
                        {refCode && <div className="font-mono text-[11px] text-obsidian/45 truncate mt-0.5">{refCode}</div>}
                      </div>
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0', badge.cls)}>
                      {badge.t}
                    </span>
                  </div>

                  {/* Middle: Package & Slot */}
                  <div className="mt-3.5 pt-3 border-t border-line/60 space-y-1.5">
                    <div className="text-[13.5px] font-semibold text-obsidian line-clamp-1">
                      {pkgTitle}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-obsidian/60">
                      <Calendar size={13} className="text-iris shrink-0" />
                      <span className="truncate">{when}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Price & View CTA */}
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                  <div>
                    <div className="text-[13.5px] font-bold text-obsidian font-mono">
                      {price > 0 ? inr(price) : 'Custom Session'}
                    </div>
                    {advance > 0 && advance < price && (
                      <div className="text-[10.5px] text-obsidian/50 font-mono mt-0.5">
                        {inr(advance)} advance paid
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11.5px] font-semibold text-iris group-hover:translate-x-0.5 transition-transform">
                    <span>View details</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
