import { useState } from 'react'
import { ArrowLeft, ArrowRight, Home, MapPin, Globe, Shield, Lock, Clock } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { useCreator } from '@/hooks/useCreators'
import { inr, pic } from '@/data/constants'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

export function BookingScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { data: dbCreator } = useCreator(state.selectedCreatorId)

  if (!state.selectedCreatorId) {
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

  const c = {
    id: dbCreator?.id || state.selectedCreatorId,
    name: dbCreator?.users?.name || 'Creator',
    avatar: dbCreator?.users?.avatar_url || pic(dbCreator?.users?.name || 'creator', 200, 200),
    startingAt: dbCreator?.starting_at || 8000,
    area: dbCreator?.area || 'Studio',
    city: dbCreator?.city || '',
    travelMode: dbCreator?.travel_mode || 'both',
  }

  const draft = (state.bookingDraft ?? {}) as Record<string, unknown>
  const pkgName = (draft.packageName as string) || (draft.pkg as string) || 'Standard'
  const pkgPrice = typeof draft.packagePrice === 'number' ? draft.packagePrice : (typeof draft.price === 'number' ? draft.price : c.startingAt)
  const pkgDur = (draft.duration as string) || '2 hours'
  const base = pkgPrice
  const dateLabel = (draft.dateLabel as string) || (draft.date as string) || ''
  const time = (draft.time as string) || ''

  const allLocOpts = [
    { key: 'studio', label: `${c.area} · their studio`, sub: 'You visit the creator\'s space', fee: 0 },
    { key: 'local', label: `My location (${c.city || 'Local'})`, sub: 'Creator travels to your venue · Conveyance by client', fee: 0 },
    { key: 'outstation', label: 'Outstation shoot / Another city', sub: 'Travel & stay arranged or reimbursed by client', fee: 0 },
  ]
  const locOptions = allLocOpts.filter(o =>
    c.travelMode === 'both' || (c.travelMode === 'studio' && o.key === 'studio') || (c.travelMode === 'travel' && o.key !== 'studio')
  )

  const [locType, setLocType] = useState(locOptions[0]?.key ?? 'studio')
  const [venue, setVenue] = useState('')
  const [step, setStep] = useState(0)
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const sel = locOptions.find(o => o.key === locType) ?? locOptions[0]
  const platformFee = Math.max(99, Math.round(base * 0.05))
  const total = base + platformFee
  const dep = depositInfo(total)
  const stepTitles = ['Location', 'Brief', 'Pay']

  const confirm = async () => {
    setSubmitting(true)
    setSubmitError(null)

    // Compute request expiration (strict 24-hour SLA window)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    try {
      // Direct call to canonical Rust backend API
      const bookingPayload = {
        creator_id: c.id,
        pkg_name: pkgName,
        date_time: `${dateLabel} ${time}`.trim(),
        location_type: sel?.key ?? 'studio',
        start_time: (draft.time as string) || null,
        end_time: null,
        client_notes: notes ? `${occasion ? `[${occasion}] ` : ''}${notes}${venue ? ` (Venue: ${venue})` : ''}` : null,
      }

      // TODO: Payment Phase - Hook Razorpay Escrow order creation here before booking creation

      const createdBooking = await apiClient.requestBooking(bookingPayload)

      dispatch({
        type: 'CONFIRM_BOOKING',
        booking: {
          ...createdBooking,
          id: createdBooking.id,
          cid: c.id,
          creatorName: c.name,
          creatorAvatar: c.avatar,
          when: `${dateLabel} · ${time}`,
          status: 'pending_approval' as any,
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
        } as any,
      })
    } catch (err: any) {
      console.error('Failed to submit booking request:', err)
      setSubmitError(err?.message || 'Failed to submit booking request. Please check connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between border-b border-line shrink-0">
        <button onClick={() => step > 0 ? setStep(step - 1) : dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          {stepTitles.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn('text-[11px] font-mono uppercase tracking-[0.1em]', i === step ? 'text-obsidian font-semibold' : 'text-obsidian/40')}>{t}</div>
              {i < 2 && <div className="w-4 h-px bg-obsidian/20" />}
            </div>
          ))}
        </div>
        <span className="w-10" />
      </div>

      <div className="px-5 py-3 flex items-center gap-3 border-b border-line bg-bone/40 shrink-0">
        <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-base leading-tight">{c.name}</div>
          <div className="text-[11px] text-obsidian/60">{pkgName} · {dateLabel} · {time}</div>
        </div>
        <div className="font-display text-lg tnum">{inr(base)}</div>
      </div>

      <div className="app-scroll pb-28 md:pb-8">
      <div className="md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start md:px-6 md:pt-6">
      <div className="md:min-w-0">
        {submitError && (
          <div className="mx-5 mt-4 p-3.5 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-[12px] flex items-center justify-between">
            <span>{submitError}</span>
            <button onClick={() => setSubmitError(null)} className="tap font-semibold underline text-[11px]">Dismiss</button>
          </div>
        )}

        {step === 0 && (
          <div className="px-5 py-5">
            <div className="font-display text-2xl tracking-tight leading-tight mb-1">Where's the session?</div>
            <p className="text-[13px] text-obsidian/60 mb-5">Choose whether the shoot happens at their studio, your venue, or outstation.</p>
            <div className="space-y-2.5">
              {locOptions.map(o => {
                const Ic = o.key === 'studio' ? Home : o.key === 'local' ? MapPin : Globe
                return (
                  <button key={o.key} onClick={() => setLocType(o.key)} className={cn('tap w-full p-4 rounded-2xl border-2 text-left transition flex items-start gap-3', locType === o.key ? 'border-iris bg-iris-tint' : 'border-line bg-paper')}>
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
                <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="City / venue address (e.g. Goa · Beach Resort)" className="w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
                <div className="mt-2 text-[11px] text-obsidian/50 flex items-start gap-1.5">
                  <Shield size={12} className="text-iris shrink-0 mt-0.5" />
                  Travel & accommodation arrangements are confirmed directly with creator upon request acceptance.
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="px-5 py-5">
            <div className="font-display text-2xl tracking-tight leading-tight mb-1">Tell them the brief</div>
            <p className="text-[13px] text-obsidian/60 mb-5">Provide essential context so the creator can evaluate your request.</p>
            <div className="space-y-5">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Occasion / purpose</div>
                <div className="grid grid-cols-2 gap-2">
                  {['Wedding', 'Pre-wedding', 'Portrait', 'Brand / product', 'Event', 'Other'].map(o => (
                    <button key={o} onClick={() => setOccasion(o)} className={cn('py-2.5 rounded-xl text-[12px] font-medium', occasion === o ? 'bg-obsidian text-paper' : 'bg-bone border border-line')}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Anything they should prepare?</div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mood, references, must-have shots, specific requirements…" className="w-full min-h-[100px] p-3 rounded-xl bg-bone border border-line outline-none text-[13px] leading-relaxed resize-none focus:border-iris" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-5 py-5">
            <div className="font-display text-2xl tracking-tight leading-tight mb-1">{dep.full ? 'Escrow Protection' : 'Reserve with Deposit'}</div>
            <p className="text-[13px] text-obsidian/60 mb-4">{dep.full ? 'Held in FTC escrow, released only after OTP completion.' : `A ${dep.pct}% deposit locks your date upon creator confirmation.`}</p>
            
            <div className="mb-4 p-3.5 rounded-2xl bg-iris/10 border border-iris/20">
              <div className="flex items-center gap-2 text-iris font-semibold text-[12.5px] mb-1">
                <Clock size={15} />
                <span>24-Hour Creator Guarantee</span>
              </div>
              <p className="text-[11.5px] text-obsidian/75 leading-relaxed">
                {c.name} has 24 hours to review and accept your session for {dateLabel || 'your date'} at {time || 'scheduled slot'}. Advance deposit of {inr(dep.advance)} is authorized in escrow. If declined or expired, you are charged nothing.
              </p>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Price breakdown</div>
            <div className="p-4 rounded-2xl bg-bone space-y-2.5">
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span>{pkgName} package · {pkgDur}</span><span className="tnum">{inr(base)}</span>
              </div>
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span>FTC platform fee</span><span className="tnum">+{inr(platformFee)}</span>
              </div>
              <div className="pt-2 border-t border-line" />
              <div className="flex items-center justify-between text-[12.5px] font-semibold">
                <span>Total</span><span className="tnum">{inr(total)}</span>
              </div>
              <div className="pt-2 border-t border-line" />
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-acid" />
                  {dep.full ? 'Payable (in escrow)' : `Deposit (${dep.pct}%)`}
                </span>
                <span className="tnum font-semibold">{inr(dep.advance)}</span>
              </div>
              {!dep.full && (
                <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-obsidian/20" />
                    Balance due on session day
                  </span>
                  <span className="tnum">{inr(dep.balance)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block md:sticky md:top-6">
        <div className="rounded-2xl border border-line bg-bone p-5">
          <div className="flex items-center gap-3 pb-4 border-b border-line">
            <img src={c.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-base leading-tight">{c.name}</div>
              <div className="text-[11px] text-obsidian/60">{pkgName} · {dateLabel} · {time}</div>
            </div>
          </div>
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
              <span>{pkgName} package · {pkgDur}</span><span className="tnum">{inr(base)}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
              <span>FTC platform fee</span><span className="tnum">+{inr(platformFee)}</span>
            </div>
            <div className="pt-2 border-t border-line" />
            <div className="flex items-center justify-between text-[12.5px] font-semibold">
              <span>Total</span><span className="tnum">{inr(total)}</span>
            </div>
            <div className="pt-2 border-t border-line" />
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-acid" />
                {dep.full ? 'Payable (in escrow)' : `Deposit (${dep.pct}%)`}
              </span>
              <span className="tnum font-semibold">{inr(dep.advance)}</span>
            </div>
            {!dep.full && (
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-obsidian/20" />
                  Balance due on session day
                </span>
                <span className="tnum">{inr(dep.balance)}</span>
              </div>
            )}
          </div>
          <button
            disabled={submitting}
            onClick={() => step < 2 ? setStep(step + 1) : confirm()}
            className="tap w-full mt-5 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {step < 2
              ? <>Continue <ArrowRight size={16} /></>
              : submitting
              ? <span>Submitting request…</span>
              : <><Lock size={14} /> Request to Book · 24h SLA</>
            }
          </button>
        </div>
      </div>
      </div>
      </div>

      <div className="md:hidden absolute bottom-0 inset-x-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-paper/95 backdrop-blur-xl border-t border-line z-20">
        <button
          disabled={submitting}
          onClick={() => step < 2 ? setStep(step + 1) : confirm()}
          className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {step < 2
            ? <>Continue <ArrowRight size={16} /></>
            : submitting
            ? <span>Submitting request…</span>
            : <><Lock size={14} /> Request to Book · 24h SLA</>
          }
        </button>
      </div>
    </div>
  )
}
