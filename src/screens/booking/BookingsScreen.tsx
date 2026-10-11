import { useState, useMemo } from 'react'
import {
  ArrowLeft, ChevronRight, Calendar, Loader2,
  CheckCircle2, Clock, AlertCircle, X
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { useMyBookings } from '@/hooks/useBookings'
import { inr } from '@/data/constants'
import { cn } from '@/utils'

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
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      {/* Editorial Header */}
      <div className="bg-paper border-b border-line shrink-0">
        <div className="max-w-5xl mx-auto w-full px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch({ type: 'BACK' })}
                className="tap p-2 -ml-2 rounded-xl text-obsidian/60 hover:text-obsidian hover:bg-bone transition"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-iris font-semibold">
                  Orders & Escrow
                </div>
                <h1 className="font-display text-2xl md:text-3xl tracking-tight leading-none mt-0.5">
                  My Bookings
                </h1>
              </div>
            </div>

            {bookings.length > 0 && (
              <div className="hidden sm:flex items-center">
                <span className="font-mono text-[11px] text-obsidian/50 bg-bone px-3 py-1 rounded-full border border-line">
                  {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total
                </span>
              </div>
            )}
          </div>

          {/* Filter Segmented Tabs */}
          {bookings.length > 0 && (
            <div className="flex gap-2 mt-4 pt-1 overflow-x-auto no-scrollbar">
              {FILTER_TABS.map(t => {
                const active = filterTab === t.key
                const count = counts[t.key]
                return (
                  <button
                    key={t.key}
                    onClick={() => setFilterTab(t.key)}
                    className={cn(
                      'tap px-3.5 py-1.5 rounded-xl text-[12px] font-mono font-medium transition flex items-center gap-1.5 shrink-0',
                      active
                        ? 'bg-obsidian text-paper font-semibold shadow-xs'
                        : 'bg-bone text-obsidian/60 hover:text-obsidian border border-line'
                    )}
                  >
                    <span>{t.label}</span>
                    {count > 0 && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.2 rounded-full font-bold',
                        active ? 'bg-paper/20 text-paper' : 'bg-line text-obsidian/70'
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
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
        <div className="app-scroll flex-1 min-h-0">
          <div className="max-w-5xl mx-auto w-full px-5 pt-5 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {filteredBookings.map((b: any) => {
                const badge = getStatusBadge(b.status)
                const isCompleted = b.status === 'completed'
                const isPending = b.status === 'pending' || b.status === 'pending_approval'

                const creatorName = b.creator?.name || b.creatorName || 'Creator'
                const rawAvatar = b.creator?.avatar_url || b.creatorAvatar || ''
                const avatar = (rawAvatar.includes('picsum.photos') || rawAvatar.includes('photo-1534528741775')) ? '' : rawAvatar
                const creatorArea = b.creator?.area || b.creator?.city || ''

                const pkgTitle = b.service?.name || b.pkg_name || b.pkg || b.occasion || 'Session Booking'
                const price = typeof b.total_price === 'number' ? b.total_price : (typeof b.price === 'number' ? b.price : (typeof b.total === 'number' ? b.total : 0))
                const advance = typeof b.advance_amount === 'number' ? b.advance_amount : (typeof b.deposit_amount === 'number' ? b.deposit_amount : (typeof b.advance === 'number' ? b.advance : 0))
                const refCode = b.booking_ref ? `#${b.booking_ref}` : b.booking_code ? `#${b.booking_code}` : (b.id ? `#FTC-${String(b.id).slice(0, 8).toUpperCase()}` : '')

                const completedAtFormatted = formatBookingDate(b.completed_at || b.updated_at)
                const rawWhen = b.session_date ? `${b.session_date}${b.session_time ? ` · ${b.session_time}` : ''}` : (b.when || b.date || b.date_time)
                const whenLabel = rawWhen || 'Slot to be confirmed'

                return (
                  <div
                    key={b.id}
                    onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b, prevScreen: 'bookings' })}
                    className="tap w-full text-left p-4.5 rounded-2xl bg-paper border border-line hover:border-obsidian/30 active:scale-[0.99] transition-all shadow-xs flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Top: Creator & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {avatar ? (
                            <img src={avatar} className="w-11 h-11 rounded-full object-cover shrink-0 border border-line" alt="" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-obsidian text-paper font-semibold grid place-items-center text-sm shrink-0">
                              {creatorName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-obsidian truncate group-hover:text-iris transition-colors">
                              {creatorName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {refCode && (
                                <span className="font-mono text-[10.5px] text-obsidian/45 truncate">
                                  {refCode}
                                </span>
                              )}
                              {creatorArea && (
                                <span className="text-[11px] text-obsidian/50 truncate border-l border-line pl-2">
                                  {creatorArea}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1', badge.cls)}>
                          <badge.Icon size={10} className="shrink-0" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      {/* Middle: Package & Date/Status Line */}
                      <div className="mt-3.5 pt-3 border-t border-line/60 space-y-1">
                        <div className="text-[13.5px] font-semibold text-obsidian line-clamp-1">
                          {pkgTitle}
                        </div>

                        {isCompleted ? (
                          <div className="flex items-center gap-1.5 text-[12px] text-emerald-700 font-mono">
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                            <span>Session completed{completedAtFormatted ? ` · ${completedAtFormatted}` : ''}</span>
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center gap-1.5 text-[12px] text-amber-800 font-mono">
                            <Clock size={12} className="text-amber-700 shrink-0" />
                            <span>Awaiting confirmation (24h SLA)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[12px] text-obsidian/60">
                            <Calendar size={12} className="text-iris shrink-0" />
                            <span className="truncate">{whenLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Price & Details Action */}
                    <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                      <div>
                        <div className="text-[13.5px] font-bold text-obsidian font-mono">
                          {price > 0 ? inr(price) : 'Custom Session'}
                        </div>
                        <div className="text-[10.5px] font-mono mt-0.5">
                          {isCompleted ? (
                            <span className="text-emerald-700 font-medium">Payment settled in full</span>
                          ) : advance > 0 && advance < price ? (
                            <span className="text-obsidian/50">{inr(advance)} in Escrow</span>
                          ) : (
                            <span className="text-obsidian/50">Protected by FTC Escrow</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11.5px] font-semibold text-iris group-hover:translate-x-0.5 transition-transform">
                        <span>{isCompleted ? 'View receipt' : isPending ? 'View status' : 'View details'}</span>
                        <ChevronRight size={13} />
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
