import { useState } from 'react'
import { ArrowLeft, ArrowRight, Home, MapPin, Globe, Shield } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { useCreator } from '@/hooks/useCreators'
import { inr } from '@/data/constants'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'

import { useQueryClient } from '@tanstack/react-query'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

export function BookingScreen() {
  const qc = useQueryClient()
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { data: dbCreator } = useCreator(state.selectedCreatorId)

  const draft = (state.bookingDraft ?? {}) as Record<string, unknown>

  if (!state.selectedCreatorId && !draft.creatorId) {
    return (
      <div className="flex-1 flex flex-col bg-bone items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h2 className="font-display text-xl mb-1">Creator Unavailable</h2>
        <p className="text-[13px] text-obsidian/60 max-w-xs mb-6">
          Unable to start booking because no creator was selected or the profile is unavailable.
        </p>
        <button
          onClick={() => dispatch({ type: 'BACK' })}
          className="tap px-5 py-2.5 rounded-2xl bg-obsidian text-paper text-[13px] font-semibold"
        >
          Go Back
        </button>
      </div>
    )
  }

  // Prioritize real creator avatar and name from the booking draft
  const creatorId = (draft.creatorId as string) || dbCreator?.id || state.selectedCreatorId || ''
  const creatorName = (draft.creatorName as string) || dbCreator?.users?.name || 'Creator'
  const creatorAvatar = (draft.creatorAvatar as string) || dbCreator?.users?.avatar_url || ''
  const creatorArea = dbCreator?.area || (draft.location as string) || 'Studio'
  const creatorCity = dbCreator?.city || ''
  const travelMode = dbCreator?.travel_mode || 'both'
  const startingAt = dbCreator?.starting_at || (typeof draft.packagePrice === 'number' ? draft.packagePrice : 8000)

  const pkgName = (draft.packageName as string) || (draft.pkg as string) || 'Standard'
  const pkgPrice = typeof draft.packagePrice === 'number' ? draft.packagePrice : (typeof draft.price === 'number' ? draft.price : startingAt)
  const pkgDur = (draft.duration as string) || '2 hours'
  const base = pkgPrice
  const dateLabel = (draft.dateLabel as string) || (draft.date as string) || ''
  const time = (draft.time as string) || ''

  const allLocOpts = [
    { key: 'studio', label: `${creatorArea} · their studio`, sub: 'You visit the creator\'s space', fee: 0 },
    { key: 'local', label: `My location (${creatorCity || 'Local'})`, sub: 'Creator travels to your venue', fee: 0 },
    { key: 'outstation', label: 'Outstation shoot / Another city', sub: 'Travel arranged or reimbursed by client', fee: 0 },
  ]
  const locOptions = allLocOpts.filter(o =>
    travelMode === 'both' || (travelMode === 'studio' && o.key === 'studio') || (travelMode === 'travel' && o.key !== 'studio')
  )

  const [locType, setLocType] = useState(locOptions[0]?.key ?? 'studio')
  const [venue, setVenue] = useState('')
  const [step, setStep] = useState(0) // 0: Location, 1: Review & Pay
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const sel = locOptions.find(o => o.key === locType) ?? locOptions[0]
  const platformFee = Math.max(99, Math.round(base * 0.05))
  const total = base + platformFee
  const dep = depositInfo(total)
  const stepTitles = ['Location', 'Review & Pay']

  const confirm = async () => {
    setSubmitting(true)
    setSubmitError(null)

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    try {
      const bookingPayload = {
        creator_id: creatorId,
        pkg_name: pkgName,
        date_time: `${dateLabel} ${time}`.trim(),
        location_type: sel?.key ?? 'studio',
        start_time: (draft.time as string) || null,
        end_time: null,
        client_notes: venue ? `Venue: ${venue}` : null,
      }

      const createdBooking = await apiClient.requestBooking(bookingPayload)
      qc.invalidateQueries({ queryKey: ['bookings'] })

      dispatch({
        type: 'CONFIRM_BOOKING',
        booking: {
          ...createdBooking,
          id: createdBooking.id,
          cid: creatorId,
          creatorName,
          creatorAvatar,
          when: `${dateLabel} · ${time}`,
          status: 'pending' as any,
          request_expires_at: createdBooking.request_expires_at || expiresAt,
          pkg: pkgName,
          locType: sel?.key ?? 'studio',
          advance: dep.advance,
          balance: dep.balance,
          pct: dep.pct,
          full: dep.full,
          total,
          dateLabel,
          time,
          deposit_amount: dep.advance,
          price: total,
        } as any
      })
      dispatch({ type: 'GO', screen: 'confirmed' })
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit booking request')
    } finally {
      setSubmitting(false)
    }
  }

  const renderAvatar = (size = 'w-10 h-10 text-sm') => {
    if (creatorAvatar) {
      return <img src={creatorAvatar} className={cn(size, 'rounded-full object-cover shrink-0')} alt="" />
    }
    return (
      <div className={cn(size, 'rounded-full bg-obsidian text-paper font-semibold grid place-items-center shrink-0')}>
        {creatorName.charAt(0)}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden min-h-0 relative">
      {/* Top Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-line bg-paper shrink-0">
        <button onClick={() => step > 0 ? setStep(step - 1) : dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {stepTitles.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('text-[11px] font-mono uppercase tracking-[0.1em]', i === step ? 'text-obsidian font-semibold' : 'text-obsidian/40')}>{t}</div>
              {i < stepTitles.length - 1 && <div className="w-4 h-px bg-obsidian/20" />}
            </div>
          ))}
        </div>
        <span className="w-10" />
      </div>

      {/* Booking Context Pill */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-line bg-bone/40 shrink-0">
        {renderAvatar('w-10 h-10 text-sm')}
        <div className="flex-1 min-w-0">
          <div className="font-display text-base leading-tight truncate">{creatorName}</div>
          <div className="text-[11px] text-obsidian/60 truncate">{pkgName} · {dateLabel} · {time}</div>
        </div>
        <div className="font-display text-lg tnum">{inr(base)}</div>
      </div>

      {/* Main Body */}
      <div className="app-scroll pb-28 md:pb-8">
        <div className="max-w-4xl mx-auto w-full md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start md:px-6 md:pt-6">
          <div className="md:min-w-0">
            {submitError && (
              <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-[12px] flex items-center justify-between">
                <span>{submitError}</span>
                <button onClick={() => setSubmitError(null)} className="tap font-semibold underline text-[11px]">Dismiss</button>
              </div>
            )}

            {/* STEP 0: LOCATION */}
            {step === 0 && (
              <div className="px-5 py-5">
                <div className="font-display text-2xl tracking-tight leading-tight mb-1">Where's the session?</div>
                <p className="text-[13px] text-obsidian/60 mb-5">Choose whether the shoot happens at the creator's studio or your location.</p>
                
                <div className="space-y-2.5">
                  {locOptions.map(o => {
                    const Ic = o.key === 'studio' ? Home : o.key === 'local' ? MapPin : Globe
                    return (
                      <button
                        key={o.key}
                        onClick={() => setLocType(o.key)}
                        className={cn(
                          'tap w-full p-4 rounded-2xl border-2 text-left transition flex items-start gap-3',
                          locType === o.key ? 'border-iris bg-iris-tint' : 'border-line bg-paper'
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0', locType === o.key ? 'bg-iris text-paper' : 'bg-bone text-obsidian/60')}>
                          <Ic size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[13.5px] font-semibold">{o.label}</div>
                          <div className="text-[11.5px] text-obsidian/55 mt-0.5">{o.sub}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {locType !== 'studio' && (
                  <div className="mt-3">
                    <input
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      placeholder="Venue address or landmark (e.g. Bandra West, Studio 4)"
                      className="w-full py-3 px-4 bg-bone rounded-xl text-[13.5px] outline-none focus:ring-2 focus:ring-iris/30 border border-line"
                    />
                    <div className="mt-2 text-[11px] text-obsidian/50 flex items-start gap-1.5">
                      <Shield size={12} className="text-iris shrink-0 mt-0.5" />
                      Travel specifics are coordinated directly with creator upon confirmation.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: REVIEW & PAY */}
            {step === 1 && (
              <div className="px-5 py-5">
                <div className="font-display text-2xl tracking-tight leading-tight mb-1">Review & Pay</div>
                <p className="text-[13px] text-obsidian/60 mb-5">Review your booking summary before submitting your request.</p>

                {/* Session Summary Card */}
                <div className="p-4 rounded-2xl bg-bone border border-line mb-4 space-y-2">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-obsidian/60">Creator</span>
                    <span className="font-semibold text-obsidian">{creatorName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-obsidian/60">Package</span>
                    <span className="font-semibold text-obsidian">{pkgName} ({pkgDur})</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-obsidian/60">Date & Slot</span>
                    <span className="font-semibold text-obsidian">{dateLabel} · {time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-obsidian/60">Location</span>
                    <span className="font-semibold text-obsidian">{sel.label}</span>
                  </div>
                  {venue && (
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-obsidian/60">Address</span>
                      <span className="font-medium text-obsidian truncate max-w-[200px]">{venue}</span>
                    </div>
                  )}
                </div>

                {/* Clean Price Breakdown */}
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Price Breakdown</div>
                <div className="p-4 rounded-2xl bg-bone border border-line space-y-2.5">
                  <div className="flex items-center justify-between text-[12.5px] text-obsidian/60">
                    <span>Session Fee</span><span className="tnum font-medium text-obsidian">{inr(base)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12.5px] text-obsidian/60">
                    <span>Platform Fee</span><span className="tnum font-medium text-obsidian">+{inr(platformFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-line" />
                  <div className="flex items-center justify-between text-[13px] font-semibold">
                    <span>Total Amount</span><span className="tnum text-obsidian">{inr(total)}</span>
                  </div>
                  <div className="pt-2 border-t border-line" />
                  <div className="flex items-center justify-between text-[13px] font-semibold text-iris">
                    <span>Advance Due Now</span>
                    <span className="tnum">{inr(dep.advance)}</span>
                  </div>
                  {!dep.full && (
                    <div className="flex items-center justify-between text-[12px] text-obsidian/50">
                      <span>Balance on Completion</span>
                      <span className="tnum">{inr(dep.balance)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sticky Panel */}
          <div className="hidden md:block md:sticky md:top-6">
            <div className="rounded-2xl border border-line bg-bone p-5">
              <div className="flex items-center gap-3 pb-4 border-b border-line">
                {renderAvatar('w-11 h-11 text-base')}
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base leading-tight truncate">{creatorName}</div>
                  <div className="text-[11px] text-obsidian/60 truncate">{pkgName} · {dateLabel}</div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-[12.5px] text-obsidian/60">
                  <span>Total</span><span className="tnum font-semibold text-obsidian">{inr(total)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px] font-semibold text-iris">
                  <span>Due now</span><span className="tnum">{inr(dep.advance)}</span>
                </div>
              </div>

              <button
                disabled={submitting}
                onClick={() => step === 0 ? setStep(1) : confirm()}
                className="tap w-full mt-5 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-obsidian/90 transition shadow-xs"
              >
                {step === 0 ? (
                  <>Continue <ArrowRight size={16} /></>
                ) : submitting ? (
                  <span>Submitting request…</span>
                ) : (
                  <span>Confirm & Request Booking</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="md:hidden absolute bottom-0 inset-x-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-paper/95 backdrop-blur-xl border-t border-line z-20">
        <button
          disabled={submitting}
          onClick={() => step === 0 ? setStep(1) : confirm()}
          className="tap w-full py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-obsidian/90 transition shadow-xs"
        >
          {step === 0 ? (
            <>Continue <ArrowRight size={16} /></>
          ) : submitting ? (
            <span>Submitting request…</span>
          ) : (
            <span>Confirm & Request Booking</span>
          )}
        </button>
      </div>
    </div>
  )
}
