import { ArrowLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { useMyBookings } from '@/hooks/useBookings'
import { cn } from '@/utils'

export function BookingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { data: dbBookings, isLoading, error } = useMyBookings()

  const bookings = dbBookings && dbBookings.length > 0
    ? dbBookings
    : (state.lastBooking ? [state.lastBooking] : [])

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between bg-paper border-b border-line">
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
        <div className="flex-1 overflow-y-auto min-h-0 px-5 pt-4 pb-6 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {bookings.map((b: any) => {
            const badge = b.status === 'confirmed'
              ? { cls: 'bg-iris text-paper', t: 'Confirmed' }
              : b.status === 'pending_approval' || b.status === 'pending'
                ? { cls: 'bg-acid text-obsidian', t: 'Awaiting creator' }
                : b.status === 'cancelled'
                  ? { cls: 'bg-rose-50 border border-rose-200 text-rose-700', t: 'Cancelled' }
                  : { cls: 'bg-bone border border-line text-obsidian/70', t: 'Completed' }
            const name = b.creator?.name || b.creatorName || b.clientName || 'Creator'
            const avatar = b.creator?.avatar_url || b.creatorAvatar || b.clientAvatar || ''
            const when = b.session_date ? `${b.session_date}${b.session_time ? ` · ${b.session_time}` : ''}` : (b.when || b.date || 'Upcoming')

            return (
              <button key={b.id} onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b })} className="tap w-full text-left p-4 rounded-2xl bg-paper border border-line active:bg-bone md:h-full">
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img src={avatar} className="w-11 h-11 rounded-full object-cover shrink-0" alt="" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-obsidian text-paper font-semibold grid place-items-center text-sm shrink-0">
                      {name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold">{name}</div>
                    <div className="text-[11px] text-obsidian/60">{when}</div>
                  </div>
                  <span className={cn('px-2 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider', badge.cls)}>{badge.t}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                  <div className="text-[11px] text-obsidian/50 font-mono">#{b.id}</div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-iris">View details <ChevronRight size={13} /></div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
