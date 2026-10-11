import React, { useState, useEffect } from 'react'
import {
  Check, Lock, MessageCircle, X,
  KeyRound, Clock, XCircle, AlertCircle, RefreshCw,
  ShieldAlert, Loader2, Calendar
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'
import { useToast } from '@/components/ui/ToastNotification'
import { useBooking, useRealtimeBooking } from '@/hooks/useBookings'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

function calcRemainingSla(createdAtStr?: string, expiresAtStr?: string) {
  let expiryMs: number | null = null
  if (expiresAtStr) {
    const t = new Date(expiresAtStr).getTime()
    if (!isNaN(t)) expiryMs = t
  }
  if (!expiryMs && createdAtStr) {
    const t = new Date(createdAtStr).getTime()
    if (!isNaN(t)) expiryMs = t + 24 * 60 * 60 * 1000
  }
  if (!expiryMs) {
    expiryMs = Date.now() + 24 * 60 * 60 * 1000
  }

  const diffMs = expiryMs - Date.now()
  if (diffMs <= 0) {
    return { expired: true, hours: 0, minutes: 0 }
  }
  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { expired: false, hours, minutes }
}

function formatDateTime(isoString?: string | null) {
  if (!isoString) return null
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return null
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return null
  }
}

const BOOKING_STAGES = [
  'Requested', 'Confirmed', 'In Progress', 'Completed'
]

export function BookingDetailScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { showSuccess, showError } = useToast()
  const qc = useQueryClient()
  const initialBooking = ((state.viewBooking ?? state.lastBooking) as unknown as Record<string, unknown> | null)
  const bookingId = initialBooking?.id ? String(initialBooking.id) : ''

  // Live single-booking query with active polling when confirmed / in-progress
  const { data: liveBooking } = useBooking(bookingId || null, {
    refetchInterval: (query) => {
      const s = (query.state.data as any)?.status
      return (s === 'confirmed' || s === 'in_progress') ? 5000 : false
    }
  })

  // Merge live database row with initial state snapshot
  const b = (liveBooking ? { ...initialBooking, ...liveBooking } : initialBooking) as Record<string, unknown> | null

  // Realtime Supabase logical replication channel
  useRealtimeBooking(bookingId || null, (updatedRow) => {
    if (updatedRow.status === 'completed' && b?.status !== 'completed') {
      showSuccess('Session marked complete by creator! Escrow payment released.')
    }
    dispatch({
      type: 'OPEN_BOOKING',
      booking: { ...initialBooking, ...updatedRow } as any,
    })
  })

  // ─── OTP Generator State (Client-Side) ───────────────────────────────────
  const [activeOtp, setActiveOtp] = useState<string | null>(null)
  const [_otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [cooldownSecs, setCooldownSecs] = useState<number>(0)
  const [generationCount, setGenerationCount] = useState<number>(0)
  const [generatingOtp, setGeneratingOtp] = useState(false)

  // ─── OTP Verification State (Creator-Side) ───────────────────────────────
  const [otpInput, setOtpInput] = useState<string>('')
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false)

  // ─── Cancel Booking Modal State ──────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [cancelling, setCancelling] = useState(false)

  // ─── 24h SLA Countdown State ─────────────────────────────────────────────
  const bStatus = (b?.status as string) || 'pending'
  const isPending = bStatus === 'pending' || bStatus === 'pending_approval'
  const createdAtStr = (b?.created_at as string) || (b?.createdAt as string) || ''
  const expiresAtStr = (b?.request_expires_at as string) || (b?.requestExpiresAt as string) || ''

  const [remaining, setRemaining] = useState<{ expired: boolean; hours: number; minutes: number } | null>(() => {
    return isPending ? calcRemainingSla(createdAtStr, expiresAtStr) : null
  })

  // Live countdown ticker for cooldown
  useEffect(() => {
    if (cooldownSecs <= 0) return
    const timer = setInterval(() => {
      setCooldownSecs(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSecs])

  // Live countdown ticker for 24h confirmation SLA
  useEffect(() => {
    if (!isPending) {
      setRemaining(null)
      return
    }
    setRemaining(calcRemainingSla(createdAtStr, expiresAtStr))
    const timer = setInterval(() => {
      setRemaining(calcRemainingSla(createdAtStr, expiresAtStr))
    }, 30000)
    return () => clearInterval(timer)
  }, [createdAtStr, expiresAtStr, isPending])

  if (!b) {
    return (
      <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0 h-full">
        <SimpleHeader title="Booking details" onBack={() => dispatch({ type: 'BACK' })} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <div className="w-16 h-16 rounded-full bg-bone grid place-items-center mb-3 text-obsidian/30 border border-line">
            <Calendar size={28} />
          </div>
          <h2 className="font-display text-xl mb-1">No booking selected</h2>
          <p className="text-[13px] text-obsidian/60 max-w-xs mb-6">
            Select an active or past booking to view its details.
          </p>
          <button
            onClick={() => dispatch({ type: 'BACK' })}
            className="tap px-5 py-2.5 rounded-2xl bg-obsidian text-paper text-[13px] font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const isCreatorViewing = Boolean(state.isCreator || (state.supabaseUserId && state.supabaseUserId === b.creator_id))

  const creatorName = (b.creator as any)?.name || (b.creatorName as string) || (b.creator_name as string) || 'Creator'
  const rawCreatorAvatar = (b.creator as any)?.avatar_url || (b.creatorAvatar as string) || (b.creator_avatar as string) || ''
  const creatorAvatar = (rawCreatorAvatar.includes('picsum.photos') || rawCreatorAvatar.includes('photo-1534528741775')) ? '' : rawCreatorAvatar

  const clientName = (b.consumer as any)?.name || (b.clientName as string) || (b.client_name as string) || 'Client'
  const rawClientAvatar = (b.consumer as any)?.avatar_url || (b.clientAvatar as string) || (b.client_avatar as string) || ''
  const clientAvatar = (rawClientAvatar.includes('picsum.photos') || rawClientAvatar.includes('photo-1534528741775')) ? '' : rawClientAvatar

  const partyName = isCreatorViewing ? clientName : creatorName
  const partyAvatar = isCreatorViewing ? clientAvatar : creatorAvatar

  // Real database columns vs fallback calculations
  const total = typeof b.total_price === 'number'
    ? b.total_price
    : (typeof b.total === 'number' ? b.total : (typeof b.price === 'number' ? b.price : 0))

  const platform = typeof b.platform_fee === 'number'
    ? b.platform_fee
    : (typeof b.base_price === 'number' ? total - b.base_price : Math.max(99, Math.round(total * 0.05 / 1.05)))

  const base = typeof b.base_price === 'number'
    ? b.base_price
    : (total - platform)

  const advance = typeof b.advance_amount === 'number'
    ? b.advance_amount
    : (typeof b.advance === 'number' ? b.advance : Math.round(total * 0.3))

  const balance = typeof b.balance_amount === 'number'
    ? b.balance_amount
    : (typeof b.balance === 'number' ? b.balance : (total - advance))

  const advancePct = total > 0 ? Math.round((advance / total) * 100) : 30
  const status = (b.status as string) || 'pending'
  const curStage = status === 'completed' ? 3 : status === 'in_progress' ? 2 : status === 'confirmed' ? 1 : 0
  const locLabel = b.locType === 'studio' || b.location_type === 'studio' ? "Creator's Studio" : 'At client location'
  const currentNotes = (b.notes as string) || (b.client_notes as string) || (b.clientNotes as string) || ''
  const venueAddress = (b.venue as string) || (b.location_address as string) || (currentNotes?.startsWith('Venue:') ? currentNotes.replace('Venue:', '').trim() : null)
  const createdRaw = (b.created_at as string) || (b.createdAt as string) || ''
  const confirmedRaw = (b.confirmed_at as string) || (b.confirmedAt as string) || ''
  const createdFormatted = formatDateTime(createdRaw)
  const confirmedFormatted = formatDateTime(confirmedRaw)

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleGenerateOtp = async () => {
    setGeneratingOtp(true)
    try {
      const res = await apiClient.requestCompletionOtp(bookingId)
      setActiveOtp(res.otp)
      setOtpExpiresAt(res.expires_at)
      setGenerationCount(res.generation_count)
      setCooldownSecs(res.cooldown_seconds || 120)
      showSuccess('Completion code generated! Share this only after session wrap-up.')
    } catch (err: any) {
      showError(err?.message || 'Failed to generate completion code')
    } finally {
      setGeneratingOtp(false)
    }
  }

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpInput.trim().length !== 4) return

    setVerifyingOtp(true)
    setVerifyError(null)

    try {
      await apiClient.verifyCompletionOtp(bookingId, otpInput.trim())
      qc.invalidateQueries({ queryKey: ['bookings'] })
      showSuccess('Completion code verified! Session marked completed and funds released.')
      dispatch({
        type: 'OPEN_BOOKING',
        booking: {
          ...b,
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any,
      })
      dispatch({
        type: 'UPDATE_CREATOR_BOOKING',
        id: bookingId,
        patch: { status: 'completed' },
      })
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

  const handleCancelBooking = async () => {
    setCancelling(true)
    try {
      await apiClient.cancelBooking(bookingId, cancelReason || 'Cancelled by client')
      showSuccess('Booking request cancelled. Advance held in escrow released.')
      setShowCancelModal(false)
      dispatch({
        type: 'OPEN_BOOKING',
        booking: { ...b, status: 'cancelled', cancellation_reason: cancelReason } as any
      })
    } catch (err: any) {
      showError(err?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const [processingAction, setProcessingAction] = useState(false)

  const handleAcceptRequest = async () => {
    setProcessingAction(true)
    try {
      await apiClient.acceptBooking(bookingId)
      qc.invalidateQueries({ queryKey: ['bookings'] })
      showSuccess('Booking request accepted! Calendar slot locked and advance held in escrow.')
      dispatch({
        type: 'OPEN_BOOKING',
        booking: { ...b, status: 'confirmed' } as any,
      })
    } catch (err: any) {
      showError(err?.message || 'Failed to accept booking request.')
    } finally {
      setProcessingAction(false)
    }
  }

  const handleDeclineRequest = async () => {
    setProcessingAction(true)
    try {
      await apiClient.declineBooking(bookingId, 'Creator unavailable')
      qc.invalidateQueries({ queryKey: ['bookings'] })
      showSuccess('Booking declined. Advance deposit released back to client.')
      dispatch({
        type: 'OPEN_BOOKING',
        booking: { ...b, status: 'declined' } as any,
      })
    } catch (err: any) {
      showError(err?.message || 'Failed to decline booking.')
    } finally {
      setProcessingAction(false)
    }
  }

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4 rounded-2xl bg-paper border border-line overflow-hidden shadow-xs">
      <div className="px-5 pt-4 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">{title}</div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  )

  const KV = ({ k, v }: { k: string; v?: string | null }) => v ? (
    <div className="flex items-start justify-between gap-4 py-1.5 text-[13px]">
      <span className="text-obsidian/55 shrink-0">{k}</span>
      <span className="font-semibold text-obsidian text-right break-words max-w-[260px]">{v}</span>
    </div>
  ) : null

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0 h-full">
      <SimpleHeader title="Booking details" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll py-4 md:py-6 px-5 md:px-8">
        <div className="max-w-5xl mx-auto w-full md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start">

          {/* Left Column: Hero, Timeline & Details */}
          <div className="md:min-w-0">
            <div className="mb-4 p-5 rounded-2xl bg-obsidian text-paper flex items-center gap-4 shadow-md">
              {partyAvatar ? (
                <img src={partyAvatar} className="w-14 h-14 rounded-full object-cover border-2 border-paper/20 shrink-0" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-paper/20 font-semibold text-paper grid place-items-center shrink-0 border-2 border-paper/20 text-lg">
                  {partyName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl leading-tight truncate">{partyName}</div>
                <div className="text-[12px] text-paper/60 font-mono mt-0.5">
                  {b.booking_ref ? `#${b.booking_ref}` : `#${bookingId.slice(0, 8)}`} · {(b.pkg as string) || (b.pkg_name as string) || (b.service as any)?.name || 'Session'}
                </div>
              </div>
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold shrink-0',
                status === 'completed' && 'bg-paper/15 text-paper',
                status === 'confirmed' && 'bg-acid text-obsidian',
                status === 'cancelled' && 'bg-rose-500 text-paper',
                (status === 'pending' || status === 'pending_approval') && (isCreatorViewing ? 'bg-amber-400 text-obsidian' : 'bg-acid text-obsidian')
              )}>
                {status === 'completed'
                  ? 'Completed'
                  : status === 'confirmed'
                    ? 'Confirmed'
                    : status === 'cancelled'
                      ? 'Cancelled'
                      : isCreatorViewing
                        ? 'Pending Request'
                        : 'Awaiting Confirmation'}
              </span>
            </div>

            {/* 24-Hour Confirmation SLA Countdown Banner */}
            {isPending && remaining && (
              <div className={cn(
                "mb-4 p-4 rounded-2xl border flex items-start gap-3.5 shadow-xs transition-all",
                remaining.expired
                  ? "bg-rose-50 border-rose-200 text-rose-950"
                  : "bg-amber-50/90 border-amber-200 text-amber-950"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-xl grid place-items-center shrink-0 mt-0.5",
                  remaining.expired ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                )}>
                  <Clock size={18} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-[13.5px] tracking-tight">
                      {remaining.expired ? 'Confirmation window expired' : isCreatorViewing ? 'Action Required: Confirm Request' : 'Awaiting Creator Confirmation'}
                    </span>
                    <span className={cn(
                      "font-mono text-[11.5px] font-bold px-2.5 py-0.5 rounded-full",
                      remaining.expired
                        ? "bg-rose-200 text-rose-800"
                        : "bg-amber-200 text-amber-900"
                    )}>
                      {remaining.expired ? 'Window Expired' : `${remaining.hours}h ${remaining.minutes}m remaining`}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-amber-900/80 leading-relaxed">
                    {remaining.expired
                      ? isCreatorViewing
                        ? 'The 24-hour response window has ended. Please respond or reach out to support.'
                        : `The 24-hour response window for ${creatorName} has ended. You can cancel this request below to release your escrow advance.`
                      : isCreatorViewing
                        ? 'You have 24 hours from booking to accept or decline this request in your pipeline.'
                        : `${creatorName} has 24 hours to confirm your booking. If unconfirmed within this window, your advance is automatically refunded.`}
                  </p>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <Card title="Status timeline">
              <div className="pt-2">
                {BOOKING_STAGES.map((stg, i) => {
                  const done = i < curStage
                  const cur = i === curStage
                  return (
                    <div key={stg} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className={cn('w-5 h-5 rounded-full grid place-items-center shrink-0 transition-all', done ? 'bg-success' : cur ? 'bg-iris' : 'bg-bone border border-line')}>
                          {(done || cur) && <Check size={11} className="text-paper" strokeWidth={3} />}
                        </div>
                        {i < BOOKING_STAGES.length - 1 && <div className={cn('w-0.5 h-5', done ? 'bg-success' : 'bg-line')} />}
                      </div>
                      <div className={cn('text-[13px] -mt-3', done ? 'text-obsidian/70' : cur ? 'font-semibold text-obsidian' : 'text-obsidian/35')}>{stg}</div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Completed Session Confirmation Banner */}
            {status === 'completed' && (
              <Card title="Session completion">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0">
                    <Check size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] text-emerald-950">
                      Session Completed & Verified
                    </div>
                    <p className="text-[12px] text-emerald-900/80 mt-0.5 leading-relaxed">
                      {isCreatorViewing
                        ? 'The 4-digit wrap-up code was successfully verified. Session payout has been unlocked and credited to your payouts.'
                        : `Your 4-digit completion code was verified by ${creatorName}. Full session funds held in escrow have been released to the creator.`}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* On-Demand Session Completion OTP Card (Active when Confirmed / In-Progress) */}
            {(status === 'confirmed' || status === 'in_progress') && (
              <Card title="Session completion code">
                {isCreatorViewing ? (
                  <div className="space-y-3.5 pt-1">
                    <div className="p-3.5 rounded-xl bg-bone border border-line text-center space-y-1">
                      <div className="text-[13px] font-semibold text-obsidian">Client Wrap-Up Code</div>
                      <p className="text-[12px] text-obsidian/60 max-w-xs mx-auto">
                        Ask {clientName} for their 4-digit completion code to complete this session and release payment.
                      </p>
                    </div>

                    {verifyError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] flex items-start gap-2">
                        <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                        <span className="leading-snug">{verifyError}</span>
                      </div>
                    )}

                    {isLockedOut ? (
                      <div className="text-center py-3 bg-rose-50 border border-rose-200 rounded-xl p-3">
                        <ShieldAlert size={20} className="text-rose-600 mx-auto mb-1" />
                        <div className="text-[12.5px] font-semibold text-rose-800">Verification Locked</div>
                        <p className="text-[11.5px] text-rose-700/80 mt-0.5">
                          Too many incorrect attempts entered. Locked for security.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyOtpSubmit} className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-mono uppercase tracking-[0.1em] text-obsidian/50 mb-1.5 text-center">
                            Enter 4-digit code
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={otpInput}
                            onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="····"
                            className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-2.5 px-4 rounded-xl border border-line bg-paper text-obsidian focus:outline-none focus:border-iris transition placeholder:tracking-[0.2em] placeholder:text-obsidian/25"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={verifyingOtp || otpInput.trim().length !== 4}
                          className="tap w-full py-3 px-4 rounded-xl bg-obsidian text-paper text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-obsidian/90 transition disabled:opacity-40 shadow-xs"
                        >
                          {verifyingOtp ? (
                            <>
                              <Loader2 size={15} className="animate-spin text-iris" />
                              <span>Verifying code…</span>
                            </>
                          ) : (
                            <>
                              <Check size={15} className="text-acid" />
                              <span>Verify & Complete Session</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                ) : !activeOtp ? (
                  <div className="space-y-3">
                    <p className="text-[12px] text-obsidian/60">
                      Generate your 4-digit code once your session wraps up to release completion.
                    </p>
                    <button
                      disabled={generatingOtp}
                      onClick={handleGenerateOtp}
                      className="tap w-full py-3 px-4 rounded-xl bg-obsidian text-paper text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-obsidian/90 transition disabled:opacity-50"
                    >
                      <KeyRound size={15} />
                      {generatingOtp ? 'Generating Code…' : 'Generate Completion Code'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="p-4 rounded-2xl bg-bone border border-line text-center">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">Your 4-digit code</div>
                      <div className="font-mono text-3xl font-bold tracking-widest text-iris py-1">
                        {activeOtp.split('').join(' ')}
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-obsidian/60 font-mono">
                        <Clock size={12} className="text-iris" />
                        <span>Valid for 30 minutes</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11.5px] flex items-center gap-2">
                      <AlertCircle size={13} className="text-amber-700 shrink-0" />
                      <span>Share with {creatorName} only after session completion.</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-obsidian/50 font-mono">Attempt {generationCount} of 5</span>
                      <button
                        disabled={cooldownSecs > 0 || generatingOtp || generationCount >= 5}
                        onClick={handleGenerateOtp}
                        className="tap font-semibold text-iris underline flex items-center gap-1 disabled:opacity-40"
                      >
                        <RefreshCw size={11} />
                        {cooldownSecs > 0 ? `Resend in ${cooldownSecs}s` : 'Resend Code'}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Session Details */}
            <Card title="Session Details">
              <KV k={isCreatorViewing ? "Client" : "Creator"} v={partyName} />
              <KV k="Package" v={(b.pkg as string) || (b.pkg_name as string) || (b.service as any)?.name || 'Standard Session'} />
              <KV k="Shoot slot" v={(b.when as string) || (b.date as string) || (b.date_time as string) || 'Scheduled'} />
              <KV k="Location" v={locLabel} />
              {venueAddress && <KV k="Venue / Address" v={venueAddress} />}
              <KV k="Booking ID" v={b.booking_ref ? `#${b.booking_ref}` : `#${bookingId.slice(0, 8)}`} />
              {createdFormatted && <KV k="Requested on" v={createdFormatted} />}
              {confirmedFormatted && <KV k="Confirmed on" v={confirmedFormatted} />}
              {currentNotes && !currentNotes.startsWith('Venue:') && <KV k="Notes" v={currentNotes} />}
            </Card>
          </div>

          {/* Right Column: Sticky Payment & Actions Panel */}
          <div className="md:sticky md:top-6">
            <Card title="Payment summary">
              {isCreatorViewing ? (
                <>
                  <KV k="Package earnings" v={inr(base)} />
                  <div className="border-t border-line my-2" />
                  <KV k="Total payout" v={inr(base)} />
                  <KV k={`Advance in escrow (${advancePct}%)`} v={inr(advance)} />
                  <KV k="Balance on completion" v={inr(balance)} />
                  <div className="mt-3 p-3 rounded-xl bg-iris-tint flex items-center gap-2 text-[11.5px] text-obsidian/70">
                    <Lock size={13} className="text-iris shrink-0" />
                    <span>
                      {status === 'completed'
                        ? `${inr(base)} released to your payouts`
                        : `${inr(advance)} protected in escrow until session completion`}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <KV k="Package" v={inr(base)} />
                  <KV k="Platform fee" v={inr(platform)} />
                  <div className="border-t border-line my-2" />
                  <KV k="Total amount" v={inr(total)} />
                  <KV
                    k={status === 'completed' ? 'Paid in full' : `Advance in escrow (${advancePct}%)`}
                    v={status === 'completed' ? inr(total) : inr(advance)}
                  />
                  {status !== 'completed' && <KV k="Final on delivery" v={inr(balance)} />}
                  <div className="mt-3 p-3 rounded-xl bg-iris-tint flex items-center gap-2 text-[11.5px] text-obsidian/70">
                    <Lock size={13} className="text-iris shrink-0" />
                    <span>
                      {status === 'completed'
                        ? 'Final payment released to creator'
                        : 'Funds held safely in FTC escrow'}
                    </span>
                  </div>
                </>
              )}
            </Card>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 mb-6">
              {/* Creator Accept / Decline Actions for Pending Requests */}
              {isCreatorViewing && (status === 'pending' || status === 'pending_approval') && (
                <div className="space-y-2 mb-1">
                  <button
                    disabled={processingAction}
                    onClick={handleAcceptRequest}
                    className="tap w-full py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[13.5px] flex items-center justify-center gap-2 hover:bg-obsidian/90 transition shadow-xs disabled:opacity-50"
                  >
                    {processingAction ? (
                      <Loader2 size={16} className="animate-spin text-iris" />
                    ) : (
                      <Check size={16} className="text-acid" />
                    )}
                    <span>{processingAction ? 'Processing…' : 'Accept Booking Request'}</span>
                  </button>

                  <button
                    disabled={processingAction}
                    onClick={handleDeclineRequest}
                    className="tap w-full py-2.5 rounded-2xl border border-line bg-paper text-obsidian/75 hover:bg-bone font-medium text-[13px] flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <X size={15} className="text-obsidian/60" />
                    <span>Decline Request</span>
                  </button>
                </div>
              )}

              <button
                disabled
                className="tap w-full py-3.5 rounded-2xl bg-paper border border-line text-obsidian/40 font-semibold text-[13.5px] flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                title="Messaging is coming soon"
              >
                <MessageCircle size={16} />
                <span>Message (Coming soon)</span>
              </button>

              {/* Cancel Booking Action (Client) */}
              {!isCreatorViewing && status !== 'completed' && status !== 'cancelled' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="tap w-full py-3 rounded-2xl border border-line bg-paper text-rose-600 text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-50 transition"
                >
                  <XCircle size={14} />
                  {status === 'pending' || status === 'pending_approval' ? 'Cancel Request' : 'Cancel Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Booking Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-obsidian/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-paper rounded-2xl border border-line p-5 w-full max-w-md shadow-2xl">
            <h3 className="font-display text-lg mb-1 text-rose-600">
              {status === 'pending' || status === 'pending_approval' ? 'Cancel Booking Request?' : 'Cancel Confirmed Booking?'}
            </h3>
            <p className="text-[12.5px] text-obsidian/60 mb-3">
              {status === 'pending' || status === 'pending_approval'
                ? 'Your request has not been accepted yet. You can cancel immediately with 100% deposit unfreeze.'
                : 'Please provide a reason for cancellation. Advance refund will be handled per platform policy.'}
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (e.g. Schedule conflict, change of plans)…"
              className="w-full min-h-[80px] p-3 rounded-xl bg-bone border border-line outline-none text-[13px] leading-relaxed resize-none focus:border-iris mb-4"
            />
            <div className="flex gap-2">
              <button
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="tap flex-1 py-2.5 rounded-xl border border-line text-[13px] font-semibold hover:bg-bone transition"
              >
                Keep Booking
              </button>
              <button
                disabled={cancelling}
                onClick={handleCancelBooking}
                className="tap flex-1 py-2.5 rounded-xl bg-rose-600 text-paper text-[13px] font-semibold hover:bg-rose-700 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
