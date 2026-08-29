import { useState } from 'react'
import { ArrowLeft, ArrowRight, Home, MapPin, Globe, Shield, Check, Zap, CreditCard, Lock } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { inr } from '@/data/constants'
import { cn } from '@/utils'

function depositInfo(price: number) {
  return price <= 10000
    ? { full: true, pct: 100, advance: price, balance: 0 }
    : { full: false, pct: 30, advance: Math.round(price * 0.3), balance: Math.round(price * 0.7) }
}

export function BookingScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const c = CREATORS.find(x => x.id === state.selectedCreatorId) ?? CREATORS[0]
  const draft = (state.bookingDraft ?? {}) as Record<string, unknown>

  const PKGS = [
    { name: 'Starter', price: c.startingAt, dur: '2 hours' },
    { name: 'Standard', price: Math.round(c.startingAt * 2.5), dur: '4 hours' },
    { name: 'Premium', price: Math.round(c.startingAt * 6), dur: '8 hours' },
  ]
  const pkgIdx = typeof draft.pkgIdx === 'number' ? draft.pkgIdx : 1
  const pkg = PKGS[pkgIdx] ?? PKGS[1]
  const base = pkg.price
  const dateLabel = (draft.dateLabel as string) || 'Apr 27'
  const time = (draft.time as string) || '1:00 PM'

  const allLocOpts = [
    { key: 'studio', label: `${c.area} · their studio`, sub: 'You visit the creator\'s space', fee: 0, accom: 0 },
    { key: 'local', label: 'My location (Delhi)', sub: 'Creator travels to your address', fee: 800, accom: 0 },
    { key: 'outstation', label: 'Another city / destination', sub: 'Outstation — travel + stay applies', fee: 6000, accom: 4500 },
  ]
  const locOptions = allLocOpts.filter(o =>
    c.travelMode === 'both' || (c.travelMode === 'studio' && o.key === 'studio') || (c.travelMode === 'travel' && o.key !== 'studio')
  )

  const [locType, setLocType] = useState(locOptions[0]?.key ?? 'studio')
  const [venue, setVenue] = useState('')
  const [step, setStep] = useState(0)
  const [occasion, setOccasion] = useState('')
  const [notes, setNotes] = useState('')
  const [payMethod, setPayMethod] = useState('upi')

  const sel = locOptions.find(o => o.key === locType) ?? locOptions[0]
  const travelFee = sel?.fee ?? 0
  const accom = sel?.accom ?? 0
  const platformFee = Math.max(99, Math.round(base * 0.05))
  const total = base + travelFee + accom + platformFee
  const dep = depositInfo(total)
  const stepTitles = ['Location', 'Brief', 'Pay']

  const confirm = () => {
    dispatch({
      type: 'CONFIRM_BOOKING',
      booking: {
        id: 'FTC' + Math.floor(Math.random() * 9000 + 1000),
        cid: c.id, when: `${dateLabel} · ${time}`, status: 'confirmed' as const,
        pkg: pkg.name, locType: sel?.key ?? 'studio',
        advance: dep.advance, balance: dep.balance, pct: dep.pct, full: dep.full, total,
      } as any,
    })
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
          <div className="text-[11px] text-obsidian/60">{pkg.name} · {dateLabel} · {time}</div>
        </div>
        <div className="font-display text-lg tnum">{inr(base)}</div>
      </div>

      <div className="app-scroll pb-28 md:pb-8">
      <div className="md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start md:px-6 md:pt-6">
      <div className="md:min-w-0">
        {step === 0 && (
          <div className="px-5 py-5">
            <div className="font-display text-2xl tracking-tight leading-tight mb-1">Where's the session?</div>
            <p className="text-[13px] text-obsidian/60 mb-5">Creator, you and the event can all be in different places. Travel costs update live.</p>
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
                    <div className="text-right shrink-0">
                      <div className="text-[12px] font-semibold tnum">{o.fee ? `+${inr(o.fee)}` : 'Free'}</div>
                      {o.accom > 0 && <div className="text-[10px] text-obsidian/45">+ stay</div>}
                    </div>
                  </button>
                )
              })}
            </div>
            {locType === 'outstation' && (
              <div className="mt-3">
                <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="City or venue (e.g. Goa · beach resort)" className="w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
                <div className="mt-2 text-[11px] text-obsidian/50 flex items-start gap-1.5">
                  <Shield size={12} className="text-iris shrink-0 mt-0.5" />
                  Travel & stay shown are estimates — creator confirms exact figures before you pay the balance.
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="px-5 py-5">
            <div className="font-display text-2xl tracking-tight leading-tight mb-1">Tell them the brief</div>
            <p className="text-[13px] text-obsidian/60 mb-5">Two quick things so the session is dialled in.</p>
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
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mood, references, must-have shots…" className="w-full min-h-[100px] p-3 rounded-xl bg-bone border border-line outline-none text-[13px] leading-relaxed resize-none focus:border-iris" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-5 py-5">
            <div className="font-display text-2xl tracking-tight leading-tight mb-1">{dep.full ? 'Pay securely' : 'Reserve your date'}</div>
            <p className="text-[13px] text-obsidian/60 mb-4">{dep.full ? 'Paid in full — held in FTC escrow, released only after you approve delivery.' : `Pay a ${dep.pct}% deposit to lock your date. Balance due on delivery approval.`}</p>
            <div className="mb-5 p-3 rounded-xl bg-iris-tint flex items-start gap-2.5">
              <Shield size={15} className="text-iris shrink-0 mt-0.5" />
              <div className="text-[11.5px] text-obsidian/70 leading-snug">
                <span className="font-semibold">FTC Secure escrow. </span>
                Money is held, not sent. Full refund if cancelled or off-brief.
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Payment method</div>
            <div className="space-y-2 mb-5">
              {[
                { key: 'upi', Icon: Zap, label: 'UPI', note: 'PhonePe · Paytm · GPay · BHIM', hero: true },
                { key: 'card', Icon: CreditCard, label: 'Card', note: 'Visa, Mastercard, Rupay', hero: false },
              ].map(p => (
                <button key={p.key} onClick={() => setPayMethod(p.key)} className={cn('tap w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-colors', payMethod === p.key ? 'border-obsidian bg-obsidian text-paper' : 'border-line bg-paper')}>
                  <p.Icon size={22} />
                  <div className="flex-1 text-left">
                    <div className="text-[13px] font-semibold flex items-center gap-2">
                      {p.label}
                      {p.hero && <span className="px-1.5 py-0.5 rounded bg-acid text-obsidian text-[9px] font-mono uppercase tracking-[0.1em]">Recommended</span>}
                    </div>
                    <div className={cn('text-[11px]', payMethod === p.key ? 'text-paper/60' : 'text-obsidian/60')}>{p.note}</div>
                  </div>
                  {payMethod === p.key && <Check size={18} />}
                </button>
              ))}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Price breakdown</div>
            <div className="p-4 rounded-2xl bg-bone space-y-2.5">
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span>{pkg.name} package · {pkg.dur}</span><span className="tnum">{inr(base)}</span>
              </div>
              {travelFee > 0 && (
                <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                  <span>{sel?.key === 'outstation' ? 'Travel (outstation)' : 'Travel to your location'}</span>
                  <span className="tnum">+{inr(travelFee)}</span>
                </div>
              )}
              {accom > 0 && (
                <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                  <span>Accommodation (est.)</span><span className="tnum">+{inr(accom)}</span>
                </div>
              )}
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
                  {dep.full ? 'Pay now (in escrow)' : `Deposit now (${dep.pct}%)`}
                </span>
                <span className="tnum font-semibold">{inr(dep.advance)}</span>
              </div>
              {!dep.full && (
                <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-obsidian/20" />
                    On delivery approval
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
              <div className="text-[11px] text-obsidian/60">{pkg.name} · {dateLabel} · {time}</div>
            </div>
          </div>
          <div className="pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
              <span>{pkg.name} package · {pkg.dur}</span><span className="tnum">{inr(base)}</span>
            </div>
            {travelFee > 0 && (
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span>{sel?.key === 'outstation' ? 'Travel (outstation)' : 'Travel to your location'}</span>
                <span className="tnum">+{inr(travelFee)}</span>
              </div>
            )}
            {accom > 0 && (
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span>Accommodation (est.)</span><span className="tnum">+{inr(accom)}</span>
              </div>
            )}
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
                {dep.full ? 'Pay now (in escrow)' : `Deposit now (${dep.pct}%)`}
              </span>
              <span className="tnum font-semibold">{inr(dep.advance)}</span>
            </div>
            {!dep.full && (
              <div className="flex items-center justify-between text-[12.5px] text-obsidian/55">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-obsidian/20" />
                  On delivery approval
                </span>
                <span className="tnum">{inr(dep.balance)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => step < 2 ? setStep(step + 1) : confirm()}
            className="tap w-full mt-5 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2"
          >
            {step < 2
              ? <>Continue <ArrowRight size={16} /></>
              : <><Lock size={14} /> {dep.full ? `Pay ${inr(dep.advance)} securely` : `Pay ${dep.pct}% deposit — ${inr(dep.advance)}`}</>
            }
          </button>
        </div>
      </div>
      </div>
      </div>

      <div className="md:hidden absolute bottom-0 inset-x-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-paper/95 backdrop-blur-xl border-t border-line z-20">
        <button
          onClick={() => step < 2 ? setStep(step + 1) : confirm()}
          className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2"
        >
          {step < 2
            ? <>Continue <ArrowRight size={16} /></>
            : <><Lock size={14} /> {dep.full ? `Pay ${inr(dep.advance)} securely` : `Pay ${dep.pct}% deposit — ${inr(dep.advance)}`}</>
          }
        </button>
      </div>
    </div>
  )
}
