import { useState } from 'react'
import {
  Clock, Bell, Check, X,
  AlertCircle, KeyRound, ShieldAlert, LifeBuoy, Loader2,
  CheckCircle2, Calendar
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { CRM_TABS, CRM_EMPTY } from '@/data/constants'
import { cn, formatIsoSlot12h, formatFallbackSession12h } from '@/utils'
import { apiClient } from '@/services/apiClient'
import { useToast } from '@/components/ui/ToastNotification'
import { useMyJobs } from '@/hooks/useBookings'

function formatCardDate(isoString?: string | null): string | null {
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

function getTimeRemaining(expiresAt?: string): string {
  if (!expiresAt) return '24h SLA active'
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m left to respond`
}

export function CreatorPipelineHome() {
  const qc = useQueryClient()
  const crmTab = useAppStore(s => s.crmTab)
  const creatorBookings = useAppStore(s => s.creatorBookings)
  const dispatch = useAppStore(s => s.dispatch)
  const { showSuccess, showError } = useToast()

  const { data: dbJobs, isLoading } = useMyJobs()

  const tab = crmTab || 'requested'
  const [processingId, setProcessingId] = useState<string | null>(null)

  // ─── OTP Verification Modal State ────────────────────────────────────────
  const [activeVerifyBooking, setActiveVerifyBooking] = useState<any | null>(null)
  const [otpInput, setOtpInput] = useState<string>('')
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false)

  // Live Supabase jobs merged with fallback
  const allJobs: any[] = (dbJobs && dbJobs.length > 0) ? dbJobs : creatorBookings

  const pendingRequests = allJobs.filter((b: any) => b.status === 'requested' || b.status === 'pending_approval' || b.status === 'pending')
  const confirmedJobs = allJobs.filter((b: any) => b.status === 'confirmed' || b.status === 'upcoming' || b.status === 'in_progress')
  const completedJobs = allJobs.filter((b: any) => b.status === 'completed')
  const cancelledJobs = allJobs.filter((b: any) => b.status === 'cancelled' || b.status === 'declined')

  const jobs = tab === 'requested' || tab === 'pending_approval'
    ? pendingRequests
    : tab === 'confirmed' || tab === 'upcoming'
      ? confirmedJobs
      : tab === 'cancelled'
        ? cancelledJobs
        : completedJobs


  const handleAccept = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation()
    setProcessingId(bookingId)
    try {
      await apiClient.acceptBooking(bookingId)
      qc.invalidateQueries({ queryKey: ['bookings'] })
      dispatch({ type: 'UPDATE_CREATOR_BOOKING', id: bookingId, patch: { status: 'upcoming' } })
      showSuccess('Booking accepted! Calendar slot locked and advance held in escrow.')
    } catch (err: any) {
      showError(err?.message || 'Failed to accept booking. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation()
    setProcessingId(bookingId)
    try {
      await apiClient.declineBooking(bookingId, 'Creator unavailable')
      qc.invalidateQueries({ queryKey: ['bookings'] })
      dispatch({ type: 'UPDATE_CREATOR_BOOKING', id: bookingId, patch: { status: 'declined', cancellationReason: 'Creator unavailable' } })
      showSuccess('Booking declined. Advance deposit released back to client.')
    } catch (err: any) {
      showError(err?.message || 'Failed to decline booking. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeVerifyBooking || otpInput.trim().length !== 4) return

    setVerifyingOtp(true)
    setVerifyError(null)

    try {
      await apiClient.verifyCompletionOtp(activeVerifyBooking.id, otpInput.trim())
      qc.invalidateQueries({ queryKey: ['bookings'] })
      showSuccess('Completion code verified! Session completed and funds released.')
      dispatch({
        type: 'UPDATE_CREATOR_BOOKING',
        id: activeVerifyBooking.id,
        patch: { status: 'completed' }
      })
      setActiveVerifyBooking(null)
      setOtpInput('')
    } catch (err: any) {
      const msg = err?.message || 'Incorrect completion code'
      setVerifyError(msg)
      if (msg.toLowerCase().includes('locked')) {
        setIsLockedOut(true)
      }
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden relative">
      <div className="px-5 pt-4 pb-3 max-w-5xl mx-auto w-full">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-iris font-semibold">Creator pipeline</div>
            <div className="font-display text-3xl tracking-tight leading-none mt-1">Your jobs</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => dispatch({ type: 'GO', screen: 'notifications' })} className="tap w-9 h-9 rounded-full bg-bone border border-line grid place-items-center relative">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-iris" />
              <Bell size={17} className="text-obsidian/75" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-line">
        <div className="max-w-5xl mx-auto w-full px-5 flex gap-4 overflow-x-auto no-scrollbar shrink-0">
        {CRM_TABS.map(t => {
          const count = (t.key === 'requested' || t.key === 'pending_approval')
            ? pendingRequests.length
            : (t.key === 'confirmed' || t.key === 'upcoming')
              ? confirmedJobs.length
              : t.key === 'cancelled'
                ? cancelledJobs.length
                : completedJobs.length

          const active = tab === t.key || (tab === 'pending_approval' && t.key === 'requested')
          return (
            <button
              key={t.key}
              onClick={() => dispatch({ type: 'SET_CRM_TAB', tab: t.key })}
              className={cn(
                'tap py-3 text-[13px] font-medium whitespace-nowrap flex items-center gap-1.5 border-b-2 -mb-px transition-colors',
                active ? 'border-obsidian text-obsidian font-semibold' : 'border-transparent text-obsidian/45'
              )}
            >
              <span>{t.label}</span>
              {count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                  t.key === 'requested' ? 'bg-acid text-obsidian font-bold' : 'bg-bone text-obsidian/70'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-12">
        <div className="max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 size={24} className="animate-spin text-iris mx-auto mb-2" />
            <div className="text-[12px] text-obsidian/50 font-mono">Loading your pipeline…</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-bone grid place-items-center mx-auto mb-3 text-obsidian/30">
              <Clock size={20} />
            </div>
            <div className="font-display text-base text-obsidian/70">{CRM_EMPTY[tab]?.[0] || 'No jobs here'}</div>
            <p className="text-[12px] text-obsidian/45 mt-1 max-w-xs mx-auto">
              {CRM_EMPTY[tab]?.[1] || 'Jobs matching this lifecycle state will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-3">
            {jobs.map(b => {
              const isPending = b.status === 'pending_approval' || b.status === 'pending'
              const isConfirmedOrActive = b.status === 'confirmed' || b.status === 'upcoming' || b.status === 'in_progress'
              const isCompleted = b.status === 'completed'
              const isCancelled = b.status === 'cancelled' || b.status === 'declined'

              const clientName = b.consumer?.name || b.clientName || 'Client'
              const clientAvatar = b.consumer?.avatar_url || b.clientAvatar || ''
              const price = typeof b.total_price === 'number' ? b.total_price : (typeof b.price === 'number' ? b.price : 0)
              const pkgName = b.service?.name || b.pkg_name || b.packageName || b.projectType || b.occasion || 'Session Booking'

              const completedAtStr = b.completed_at || b.completedAt || b.updated_at
              const completedDateFormatted = formatCardDate(completedAtStr)

              const slotFormatted = formatIsoSlot12h(b.start_time, b.end_time)
              const rawDateSlot = slotFormatted || formatFallbackSession12h(b.session_date, b.session_time) || (b.date || b.when)
              const dateSlot = rawDateSlot || 'Date to be confirmed'
              const displayDate = isCompleted
                ? (completedDateFormatted || slotFormatted || formatCardDate(b.session_date || b.created_at))
                : dateSlot
              const clientNotes = b.notes || b.clientNotes || ''
              const requestExpiresAt = b.request_expires_at || b.requestExpiresAt
              const advance = typeof b.advance_amount === 'number' ? b.advance_amount : (typeof b.advancePaid === 'number' ? b.advancePaid : Math.round(price * 0.3))

              return (
                <div
                  key={b.id}
                  onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b })}
                  className={cn(
                    'tap w-full p-4 rounded-2xl border text-left cursor-pointer transition-all',
                    isPending
                      ? 'bg-paper border-iris/40 shadow-xs'
                      : isCancelled
                        ? 'bg-bone/40 border-line hover:border-obsidian/30 opacity-90'
                        : 'bg-paper border-line'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {clientAvatar ? (
                      <img src={clientAvatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-obsidian text-paper font-semibold grid place-items-center text-sm shrink-0">
                        {clientName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-[14px] truncate">{clientName}</div>
                        <div className="font-mono text-[13px] font-bold text-obsidian">{inr(price)}</div>
                      </div>
                      {displayDate && (
                        <div className="text-[12px] text-obsidian/60 mt-1 font-medium tnum truncate">
                          {displayDate}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Notes & SLA Urgency for Pending Requests */}
                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-line space-y-2.5">
                      {clientNotes && (
                        <div className="p-2.5 rounded-xl bg-bone border border-line text-[11.5px] text-obsidian/75 italic line-clamp-2 break-words">
                          "{clientNotes}"
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <AlertCircle size={12} className="text-rose-600" />
                          <span>{getTimeRemaining(requestExpiresAt)}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                          {inr(advance)} in Escrow
                        </div>
                      </div>

                      {/* Quick Accept / Decline Action Bar */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          disabled={processingId === b.id}
                          onClick={e => handleDecline(e, b.id)}
                          className="tap py-2 rounded-xl border border-line bg-bone hover:bg-obsidian/10 text-obsidian/80 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                        >
                          <X size={14} className="text-obsidian/60" />
                          <span>Decline</span>
                        </button>
                        <button
                          disabled={processingId === b.id}
                          onClick={e => handleAccept(e, b.id)}
                          className="tap py-2 rounded-xl bg-obsidian text-paper hover:bg-obsidian/90 text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                        >
                          <Check size={14} className="text-acid" />
                          <span>Accept Request</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active / Confirmed Job: Verify Completion Code CTA */}
                  {isConfirmedOrActive && (
                    <div className="mt-3 pt-3 border-t border-line">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setActiveVerifyBooking(b)
                          setOtpInput('')
                          setVerifyError(null)
                          setIsLockedOut(false)
                        }}
                        className="tap w-full py-2.5 rounded-xl bg-iris text-paper text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-iris/90 transition shadow-xs"
                      >
                        <KeyRound size={14} />
                        <span>Complete Session & Verify OTP</span>
                      </button>
                    </div>
                  )}

                  {/* Cancelled / Declined Job: Status badge & reason */}
                  {isCancelled && (
                    <div className="mt-3 pt-3 border-t border-line flex items-center justify-between gap-2">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold',
                        b.status === 'declined' || (b.cancellation_reason || b.cancellationReason || '').toLowerCase().includes('creator')
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : (b.cancellation_reason || b.cancellationReason || '').toLowerCase().includes('sla')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-bone text-obsidian/60 border border-line'
                      )}>
                        {b.status === 'declined' || (b.cancellation_reason || b.cancellationReason || '').toLowerCase().includes('creator')
                          ? 'Declined by you'
                          : (b.cancellation_reason || b.cancellationReason || '').toLowerCase().includes('sla')
                            ? 'Expired (24h SLA)'
                            : 'Cancelled by client'}
                      </span>
                      {(b.cancellation_reason || b.cancellationReason) && (
                        <span className="text-[11px] text-obsidian/50 font-mono italic truncate max-w-[200px]">
                          {b.cancellation_reason || b.cancellationReason}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>

      {/* MODAL: Creator Enter Completion OTP */}
      {activeVerifyBooking && (
        <div className="fixed inset-0 z-50 bg-obsidian/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper rounded-2xl border border-line p-5 w-full max-w-md shadow-2xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-lg leading-tight">Verify Session Completion</h3>
                <p className="text-[12px] text-obsidian/60 mt-0.5">
                  Ask {activeVerifyBooking.consumer?.name || activeVerifyBooking.clientName || 'Client'} for their 4-digit code.
                </p>
              </div>
              <button
                onClick={() => setActiveVerifyBooking(null)}
                className="tap p-1.5 text-obsidian/40 hover:text-obsidian -mr-2 -mt-2"
              >
                <X size={18} />
              </button>
            </div>

            {verifyError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-start gap-2">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{verifyError}</span>
              </div>
            )}

            {isLockedOut ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 grid place-items-center mx-auto mb-2">
                  <ShieldAlert size={24} />
                </div>
                <h4 className="font-display text-base text-rose-700">Verification Locked</h4>
                <p className="text-[12px] text-obsidian/65 max-w-xs mx-auto mt-1 mb-4">
                  Too many incorrect attempts were entered. For security, OTP verification is locked for 1 hour.
                </p>
                <button
                  onClick={() => {
                    setActiveVerifyBooking(null)
                    dispatch({ type: 'GO', screen: 'safety' })
                  }}
                  className="tap w-full py-2.5 rounded-xl bg-obsidian text-paper text-[13px] font-semibold flex items-center justify-center gap-1.5"
                >
                  <LifeBuoy size={14} /> Contact Support
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtpSubmit}>
                <div className="py-2">
                  <label className="block text-[11px] font-mono uppercase tracking-[0.12em] text-obsidian/50 mb-2 text-center">
                    Client 4-Digit Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    autoFocus
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full py-3.5 text-center font-mono text-3xl tracking-[0.5em] bg-bone border border-line rounded-2xl outline-none focus:border-iris focus:ring-2 focus:ring-iris/20"
                  />
                  <div className="text-center text-[11px] text-obsidian/45 font-mono mt-2">
                    5 attempts allowed per hour
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveVerifyBooking(null)}
                    className="tap flex-1 py-2.5 rounded-xl border border-line text-[13px] font-semibold hover:bg-bone transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyingOtp || otpInput.trim().length !== 4}
                    className="tap flex-1 py-2.5 rounded-xl bg-obsidian text-paper text-[13px] font-semibold hover:bg-obsidian/90 transition disabled:opacity-40"
                  >
                    {verifyingOtp ? 'Verifying…' : 'Verify & Complete'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
