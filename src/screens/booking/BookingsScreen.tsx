import { useState, useMemo } from 'react'
import {
  ArrowLeft, Calendar, Loader2,
  CheckCircle2, Clock, AlertCircle, X
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { useMyBookings } from '@/hooks/useBookings'
import { inr } from '@/data/constants'
import { cn, formatIsoSlot12h, formatFallbackSession12h } from '@/utils'

type BookingFilterTab = 'all' | 'active' | 'completed' | 'cancelled'

const FILTER_TABS: { key: BookingFilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active & Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

function formatBookingDate(isoString?: string | null): string | null {
  if (!isoString) return null
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function formatBookingSlot(startIso?: string | null, endIso?: string | null): string | null {
  return formatIsoSlot12h(startIso, endIso)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Confirmed',
        cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        Icon: CheckCircle2,
      }
    case 'pending':
    case 'pending_approval':
      return {
        label: 'Awaiting Creator',
        cls: 'bg-amber-50 text-amber-800 border border-amber-200/80',
        Icon: Clock,
      }
    case 'completed':
      return {
        label: 'Completed',
        cls: 'bg-bone text-obsidian/75 border border-line',
        Icon: CheckCircle2,
      }
    case 'cancelled':
    case 'declined':
      return {
        label: 'Cancelled',
        cls: 'bg-rose-50 text-rose-700 border border-rose-200/80',
        Icon: X,
      }
    default:
      return {
        label: status,
        cls: 'bg-bone text-obsidian/60 border border-line',
        Icon: Clock,
      }
  }
}

export function BookingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { data: dbBookings, isLoading, error } = useMyBookings()
  const [filterTab, setFilterTab] = useState<BookingFilterTab>('all')

  const bookings: any[] = dbBookings && dbBookings.length > 0
    ? dbBookings
    : (state.lastBooking ? [state.lastBooking] : [])

  const counts = useMemo(() => ({
    all: bookings.length,
    active: bookings.filter((b: any) =>
      b.status === 'confirmed' || b.status === 'pending' || b.status === 'pending_approval' || b.status === 'in_progress'
    ).length,
    completed: bookings.filter((b: any) => b.status === 'completed').length,
    cancelled: bookings.filter((b: any) => b.status === 'cancelled' || b.status === 'declined').length,
  }), [bookings])

  const filteredBookings = useMemo(() => {
    if (filterTab === 'active') {
      return bookings.filter((b: any) =>
        b.status === 'confirmed' || b.status === 'pending' || b.status === 'pending_approval' || b.status === 'in_progress'
      )
    }
    if (filterTab === 'completed') {
      return bookings.filter((b: any) => b.status === 'completed')
    }
    if (filterTab === 'cancelled') {
      return bookings.filter((b: any) => b.status === 'cancelled' || b.status === 'declined')
    }
    return bookings
  }, [bookings, filterTab])

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden min-h-0">
      {/* Clean Simplified Header matching FTC semantics */}
      <div className="bg-paper border-b border-line shrink-0">
        <div className="max-w-5xl mx-auto w-full px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch({ type: 'BACK' })}
              className="tap -ml-2 p-2 rounded-xl text-obsidian/70 hover:text-obsidian transition"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-display text-2xl tracking-tight leading-none">My Bookings</h1>
          </div>
        </div>

        {/* Clean Underline Tabs matching Creator Pipeline and FTC standard */}
        {bookings.length > 0 && (
          <div className="max-w-5xl mx-auto w-full px-5 flex gap-5 overflow-x-auto no-scrollbar shrink-0">
            {FILTER_TABS.map(t => {
              const active = filterTab === t.key
              const count = counts[t.key]
              return (
                <button
                  key={t.key}
                  onClick={() => setFilterTab(t.key)}
                  className={cn(
                    'tap py-2.5 text-[13px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 -mb-px transition-colors',
                    active ? 'border-obsidian text-obsidian font-semibold' : 'border-transparent text-obsidian/45 hover:text-obsidian/70'
                  )}
                >
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-bone text-obsidian/70">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <Loader2 size={24} className="animate-spin text-iris mb-2" />
          <p className="text-[12px] text-obsidian/50 font-mono">Loading your bookings…</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <AlertCircle size={32} className="text-obsidian/30 mb-3" />
          <h2 className="font-display text-lg mb-1">Failed to load bookings</h2>
          <p className="text-[12px] text-obsidian/60 max-w-xs mb-4">
            Could not retrieve your bookings from the server. Please check your connection.
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
          <div className="w-16 h-16 rounded-full bg-bone grid place-items-center mb-4 text-obsidian/40 border border-line">
            <Calendar size={28} />
          </div>
          <h2 className="font-display text-xl mb-1">No bookings yet</h2>
          <p className="text-[13px] text-obsidian/60 max-w-xs mb-6">
            When you book sessions or request quotes from creators, they will appear here.
          </p>
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'discover' })}
            className="tap px-5 py-2.5 rounded-2xl bg-obsidian text-paper text-[13px] font-semibold hover:bg-obsidian/90 transition shadow-xs"
          >
            Explore Creators
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <div className="w-14 h-14 rounded-full bg-bone grid place-items-center mb-3 text-obsidian/30 border border-line">
            <Calendar size={22} />
          </div>
          <h3 className="font-display text-base text-obsidian/70">No bookings under this filter</h3>
          <p className="text-[12px] text-obsidian/45 max-w-xs mt-1 mb-4">
            You don't have any sessions matching the selected lifecycle state.
          </p>
          <button
            onClick={() => setFilterTab('all')}
            className="tap px-4 py-1.5 rounded-xl border border-line text-[12px] font-mono text-obsidian hover:bg-bone transition"
          >
            View All Bookings
          </button>
        </div>
      ) : (
        <div className="app-scroll flex-1 min-h-0 bg-paper">
          <div className="max-w-5xl mx-auto w-full px-5 pt-4 pb-12">
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
              {filteredBookings.map((b: any) => {
                const isCompleted = b.status === 'completed'
                const isPending = b.status === 'pending' || b.status === 'pending_approval'
                const isCancelled = b.status === 'cancelled' || b.status === 'declined'

                const creatorName = b.creator?.name || b.creatorName || 'Creator'
                const rawAvatar = b.creator?.avatar_url || b.creatorAvatar || ''
                const avatar = (rawAvatar.includes('picsum.photos') || rawAvatar.includes('photo-1534528741775')) ? '' : rawAvatar

                const price = typeof b.total_price === 'number' ? b.total_price : (typeof b.price === 'number' ? b.price : (typeof b.total === 'number' ? b.total : 0))
                const completedAtFormatted = formatBookingDate(b.completed_at || b.updated_at)
                const slotFormatted = formatBookingSlot(b.start_time, b.end_time)
                const rawWhen = slotFormatted || formatFallbackSession12h(b.session_date, b.session_time) || (b.when || b.date || b.date_time)
                const displayDate = isCompleted
                  ? (completedAtFormatted || slotFormatted || formatBookingDate(b.session_date || b.created_at))
                  : (rawWhen || 'Date to be confirmed')

                return (
                  <div
                    key={b.id}
                    onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b, prevScreen: 'bookings' })}
                    className={cn(
                      'tap w-full p-4 rounded-2xl border text-left cursor-pointer transition-all',
                      isPending
                        ? 'bg-paper border-iris/40 shadow-xs'
                        : 'bg-paper border-line'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {avatar ? (
                        <img src={avatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-obsidian text-paper font-semibold grid place-items-center text-sm shrink-0">
                          {creatorName.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-[14px] truncate">{creatorName}</div>
                          <div className="font-mono text-[13px] font-bold text-obsidian">{inr(price)}</div>
                        </div>
                        {displayDate && (
                          <div className="text-[12px] text-obsidian/55 mt-1 font-mono truncate">
                            {displayDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
