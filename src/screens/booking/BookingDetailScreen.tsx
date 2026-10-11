import React, { useState, useEffect } from 'react'
import {
  Check, Lock, FileText, Upload, MessageCircle,
  KeyRound, Clock, XCircle, AlertCircle, RefreshCw
} from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'
import { useToast } from '@/components/ui/ToastNotification'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

const BOOKING_STAGES = [
  'Requested', 'Confirmed', 'In Progress', 'Completed'
]

export function BookingDetailScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { showSuccess, showError } = useToast()
  const b = ((state.viewBooking ?? state.lastBooking) as unknown as Record<string, unknown> | null)

  const [invoiceSaved, setInvoiceSaved] = useState(false)

  // ─── OTP Generator State (Client-Side) ───────────────────────────────────
  const [activeOtp, setActiveOtp] = useState<string | null>(null)
  const [_otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null)
  const [cooldownSecs, setCooldownSecs] = useState<number>(0)
  const [generationCount, setGenerationCount] = useState<number>(0)
  const [generatingOtp, setGeneratingOtp] = useState(false)

  // ─── Cancel Booking Modal State ──────────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState<string>('')
  const [cancelling, setCancelling] = useState(false)

  // Live countdown ticker for cooldown
  useEffect(() => {
    if (cooldownSecs <= 0) return
    const timer = setInterval(() => {
      setCooldownSecs(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSecs])

  if (!b) {
    return (
      <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0 h-full">
        <SimpleHeader title="Booking details" onBack={() => dispatch({ type: 'BACK' })} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-paper">
          <div className="text-4xl mb-3">📋</div>
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

  const bookingId = String(b.id)
  const creatorName = (b.creatorName as string) || (b.creator_name as string) || (b.clientName as string) || 'Creator'
  const creatorAvatar = (b.creatorAvatar as string) || (b.creator_avatar as string) || (b.clientAvatar as string) || ''
  const base = typeof b.total === 'number' ? b.total : (typeof b.price === 'number' ? b.price : (typeof b.total_price === 'number' ? b.total_price : 0))
  const platform = Math.max(99, Math.round(base * 0.05))
  const total = base + platform
  const dep = depositInfo(total)
  const status = (b.status as string) || 'pending'
  const curStage = status === 'completed' ? 3 : status === 'in_progress' ? 2 : status === 'confirmed' ? 1 : 0
  const locLabel = b.locType === 'studio' || b.location_type === 'studio' ? 'Creator studio' : b.locType === 'local' || b.location_type === 'local' ? 'Client venue (Local)' : 'Outstation destination'
  const currentNotes = (b.notes as string) || (b.client_notes as string) || (b.clientNotes as string) || ''

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

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4 rounded-2xl bg-paper border border-line overflow-hidden shadow-xs">
      <div className="px-5 pt-4 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">{title}</div>
      <div className="px-5 pb-4">{children}</div>
    </div>
  )

  const KV = ({ k, v }: { k: string; v?: string | null }) => v ? (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-obsidian/55">{k}</span>
      <span className="font-semibold text-obsidian">{v}</span>
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
              {creatorAvatar ? (
                <img src={creatorAvatar} className="w-14 h-14 rounded-full object-cover border-2 border-paper/20 shrink-0" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-paper/20 font-semibold text-paper grid place-items-center shrink-0 border-2 border-paper/20 text-lg">
                  {creatorName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl leading-tight truncate">{creatorName}</div>
                <div className="text-[12px] text-paper/60 font-mono mt-0.5">#{bookingId} · {(b.pkg as string) || (b.pkg_name as string) || 'Session'}</div>
              </div>
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold shrink-0',
                status === 'completed' && 'bg-paper/15 text-paper',
                status === 'confirmed' && 'bg-acid text-obsidian',
                status === 'cancelled' && 'bg-rose-500 text-paper',
                (status === 'pending' || status === 'pending_approval') && 'bg-acid text-obsidian'
              )}>
                {status === 'completed' ? 'Completed' : status === 'confirmed' ? 'Confirmed' : status === 'cancelled' ? 'Cancelled' : 'Awaiting creator'}
              </span>
            </div>

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

            {/* On-Demand Session Completion OTP Card (Active when Confirmed / In-Progress) */}
            {(status === 'confirmed' || status === 'in_progress') && (
              <Card title="Session completion code">
                {!activeOtp ? (
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
              <KV k="Package" v={(b.pkg as string) || (b.pkg_name as string) || 'Standard Session'} />
              <KV k="Date & time" v={(b.when as string) || (b.date as string) || (b.date_time as string) || 'Scheduled'} />
              <KV k="Location" v={locLabel} />
              <KV k="Booking ID" v={`#${bookingId}`} />
              {currentNotes && <KV k="Location / notes" v={currentNotes} />}
            </Card>
          </div>

          {/* Right Column: Sticky Payment & Actions Panel */}
          <div className="md:sticky md:top-6">
            <Card title="Payment summary">
              <KV k="Package" v={inr(base)} />
              <KV k="Platform fee" v={inr(platform)} />
              <div className="border-t border-line my-2" />
              <KV k="Total amount" v={inr(total)} />
              <KV k={dep.full ? 'Paid (escrow)' : `Advance paid (${dep.pct}%)`} v={inr(dep.advance)} />
              {!dep.full && <KV k="Final on delivery" v={inr(dep.balance)} />}
              <div className="mt-3 p-3 rounded-xl bg-iris-tint flex items-center gap-2 text-[11.5px] text-obsidian/70">
                <Lock size={13} className="text-iris shrink-0" />
                <span>{status === 'completed' ? 'Final payment released to creator' : 'Held safely in FTC escrow'}</span>
              </div>
            </Card>

            {/* Primary Action Buttons */}
            <div className="space-y-2.5 mb-6">
              <button
                onClick={() => dispatch({ type: 'OPEN_CLIENT_CHAT', client: { name: creatorName, avatar: creatorAvatar } })}
                className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md hover:bg-obsidian/90 transition"
              >
                <MessageCircle size={16} /> Message {creatorName.split(' ')[0]}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => dispatch({ type: 'GO', screen: 'legal' })} className="tap py-3 px-3 rounded-xl bg-paper border border-line text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-bone transition">
                  <FileText size={14} /> Contract
                </button>
                <button onClick={() => setInvoiceSaved(true)} className="tap py-3 px-3 rounded-xl bg-paper border border-line text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-bone transition">
                  <Upload size={14} /> {invoiceSaved ? 'Saved ✓' : 'Invoice'}
                </button>
              </div>

              {/* Cancel Booking Action (Client) */}
              {status !== 'completed' && status !== 'cancelled' && (
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
