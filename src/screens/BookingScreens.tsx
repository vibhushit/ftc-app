import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, Home, MapPin, Globe, Shield, Check,
  Zap, CreditCard, Lock, MessageCircle, Share2, ChevronRight,
  FileText, Star, HelpCircle, Upload,
} from 'lucide-react'
import { StatusBar } from '@/components/ui/StatusBar'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
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

const BOOKING_STAGES = [
  'Requested', 'Accepted', 'Advance paid', 'Contract signed',
  'Scheduled', 'Delivered', 'Final payment', 'Completed',
]

const BOOKINGS_SEED = [
  { id: 'FTC8472', cid: 'c1', when: 'Sun, Apr 27 · 1:00 PM', status: 'confirmed', pkg: 'Standard', locType: 'studio' },
  { id: 'FTC8420', cid: 'c4', when: 'Thu, May 02 · 11:00 AM', status: 'pending', pkg: 'Premium', locType: 'local' },
  { id: 'FTC8211', cid: 'c7', when: 'Sat, Apr 05', status: 'completed', pkg: 'Starter', locType: 'studio' },
  { id: 'FTC7988', cid: 'c10', when: 'Fri, Mar 28', status: 'completed', pkg: 'Standard', locType: 'outstation' },
]

/* ─── 3-step Booking Flow ─── */
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
      <StatusBar />
      {/* Step header */}
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

      {/* Creator summary bar */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-line bg-bone/40 shrink-0">
        <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <div className="font-display text-base leading-tight">{c.name}</div>
          <div className="text-[11px] text-obsidian/60">{pkg.name} · {dateLabel} · {time}</div>
        </div>
        <div className="font-display text-lg tnum">{inr(base)}</div>
      </div>

      <div className="app-scroll pb-28">
        {/* STEP 0 — Location */}
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

        {/* STEP 1 — Brief */}
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

        {/* STEP 2 — Pay */}
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

      {/* Fixed bottom CTA */}
      <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper border-t border-line">
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

/* ─── Confirmed ─── */
export function ConfirmedScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const c = CREATORS.find(x => x.id === state.selectedCreatorId) ?? CREATORS[0]
  const lb = (state.lastBooking ?? {}) as Record<string, unknown>
  const dep = depositInfo((lb.total as number) || Math.round(c.startingAt * 2.5))
  const advAmt = (lb.advance as number) ?? dep.advance
  const dateLine = `${(lb.when as string) || 'Apr 27 · 1:00 PM'} · ${(lb.pkg as string) || 'Standard'}`

  return (
    <div className="flex-1 flex flex-col bg-obsidian text-paper relative overflow-hidden">
      <div className="absolute top-20 right-0 w-80 h-80 dots-acid opacity-20 pointer-events-none" style={{ transform: 'translateX(30%)' }} />
      <StatusBar dark />
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-acid grid place-items-center mb-6">
          <Check size={40} className="text-obsidian" strokeWidth={3} />
        </div>
        <h1 className="font-display text-4xl tracking-tight leading-none">
          Booking<br /><span className="italic">confirmed</span>.
        </h1>
        <p className="mt-4 text-[14px] text-paper/70 max-w-xs">
          {dep.full
            ? `${inr(advAmt)} is held safely in FTC escrow and released to the creator once you approve the delivery.`
            : `${inr(advAmt)} (${dep.pct}%) collected and held in escrow. Balance due on delivery approval.`}
        </p>
        <div className="mt-10 p-5 rounded-2xl bg-paper/10 w-full max-w-sm">
          <div className="flex items-center gap-3">
            <img src={c.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
            <div className="text-left flex-1">
              <div className="font-display text-lg leading-tight">{c.name}</div>
              <div className="text-[11px] text-paper/60">{dateLine}</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-paper/5 flex items-center gap-2 text-[11px] text-paper/70">
            <Lock size={12} className="text-acid" />
            <span>{inr(advAmt)} {dep.full ? 'in escrow' : `(${dep.pct}%) in escrow`} · Booking ID #{(lb.id as string) || 'FTC8472'}</span>
          </div>
        </div>
      </div>
      <div className="relative px-6 pb-10 pt-4 space-y-3">
        <button className="tap w-full py-4 rounded-2xl bg-paper/15 text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
          <Share2 size={15} /> Share to WhatsApp
        </button>
        <button onClick={() => dispatch({ type: 'GO_TAB', tab: 'home' })} className="tap w-full py-4 rounded-2xl bg-acid text-obsidian font-semibold text-[14px]">
          Back to home
        </button>
      </div>
    </div>
  )
}

/* ─── Bookings List ─── */
export function BookingsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <StatusBar />
      <div className="px-5 pt-2 pb-3 flex items-center justify-between bg-paper border-b border-line">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 p-2"><ArrowLeft size={20} /></button>
        <div className="font-display text-lg">My bookings</div>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-5 pt-4 pb-6 space-y-3">
        {BOOKINGS_SEED.map(b => {
          const c = CREATORS.find(x => x.id === b.cid)
          if (!c) return null
          const badge = b.status === 'confirmed'
            ? { cls: 'bg-iris text-paper', t: 'Confirmed' }
            : b.status === 'pending'
              ? { cls: 'bg-acid text-obsidian', t: 'Awaiting creator' }
              : { cls: 'bg-bone border border-line text-obsidian/70', t: 'Completed' }
          return (
            <button key={b.id} onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b as any })} className="tap w-full text-left p-4 rounded-2xl bg-paper border border-line active:bg-bone">
              <div className="flex items-center gap-3">
                <img src={c.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{c.name}</div>
                  <div className="text-[11px] text-obsidian/60">{b.when}</div>
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
    </div>
  )
}

/* ─── Booking Detail ─── */
export function BookingDetailScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const b = ((state.viewBooking ?? BOOKINGS_SEED[0]) as unknown as Record<string, unknown>)
  const c = CREATORS.find(x => x.id === (b.cid as string)) ?? CREATORS[0]
  const [invoiceSaved, setInvoiceSaved] = useState(false)

  const base = Math.round(c.startingAt * 2.5)
  const travel = b.locType === 'outstation' ? 6000 : b.locType === 'local' ? 800 : 0
  const accom = b.locType === 'outstation' ? 4500 : 0
  const platform = Math.max(99, Math.round(base * 0.05))
  const total = base + travel + accom + platform
  const dep = depositInfo(total)
  const status = b.status as string
  const curStage = status === 'completed' ? 7 : status === 'confirmed' ? 4 : 1
  const locLabel = b.locType === 'studio' ? `${c.area} · creator's studio` : b.locType === 'local' ? 'Your location (Delhi)' : 'Outstation / destination'

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mx-5 mb-3 rounded-2xl bg-paper border border-line overflow-hidden">
      <div className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/45">{title}</div>
      <div className="px-4 pb-3">{children}</div>
    </div>
  )
  const KV = ({ k, v }: { k: string; v?: string | null }) => v ? (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-obsidian/55">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  ) : null

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Booking details" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll py-4">
        {/* Hero */}
        <div className="mx-5 mb-3 p-4 rounded-2xl bg-obsidian text-paper flex items-center gap-3">
          <img src={c.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-paper/20" alt="" />
          <div className="flex-1">
            <div className="font-display text-lg leading-tight">{c.name}</div>
            <div className="text-[11px] text-paper/60 font-mono">#{b.id as string} · {b.pkg as string}</div>
          </div>
          <span className={cn('px-2 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider', status === 'completed' ? 'bg-paper/15 text-paper' : 'bg-acid text-obsidian')}>
            {status === 'completed' ? 'Completed' : status === 'confirmed' ? 'Confirmed' : 'Awaiting creator'}
          </span>
        </div>

        {/* Timeline */}
        <Card title="Status timeline">
          <div>
            {BOOKING_STAGES.map((stg, i) => {
              const done = i < curStage
              const cur = i === curStage
              return (
                <div key={stg} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-5 h-5 rounded-full grid place-items-center shrink-0', done ? 'bg-success' : cur ? 'bg-iris' : 'bg-bone border border-line')}>
                      {(done || cur) && <Check size={11} className="text-paper" strokeWidth={3} />}
                    </div>
                    {i < BOOKING_STAGES.length - 1 && <div className={cn('w-0.5 h-5', done ? 'bg-success' : 'bg-line')} />}
                  </div>
                  <div className={cn('text-[12.5px] -mt-3', done ? 'text-obsidian/70' : cur ? 'font-semibold text-obsidian' : 'text-obsidian/35')}>{stg}</div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Details */}
        <Card title="Details">
          <KV k="Package" v={b.pkg as string} />
          <KV k="Date & time" v={b.when as string} />
          <KV k="Location" v={locLabel} />
          <KV k="Booking ID" v={`#${b.id as string}`} />
        </Card>

        {/* Payment */}
        <Card title="Payment">
          <KV k="Package" v={inr(base)} />
          {travel > 0 && <KV k={b.locType === 'outstation' ? 'Travel (outstation)' : 'Travel'} v={inr(travel)} />}
          {accom > 0 && <KV k="Accommodation (est.)" v={inr(accom)} />}
          <KV k="Platform fee" v={inr(platform)} />
          <div className="border-t border-line my-1.5" />
          <KV k="Total" v={inr(total)} />
          <KV k={dep.full ? 'Paid (escrow)' : `Advance paid (${dep.pct}%)`} v={inr(dep.advance)} />
          {!dep.full && <KV k="Final on delivery" v={inr(dep.balance)} />}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-obsidian/55">
            <Lock size={12} className="text-iris" />
            {status === 'completed' ? 'Final payment released to creator' : 'Held in FTC escrow'}
          </div>
        </Card>

        {/* Action buttons */}
        <div className="px-5 grid grid-cols-2 gap-2 mt-1">
          <button onClick={() => dispatch({ type: 'GO', screen: 'legal' })} className="tap py-3 rounded-xl bg-paper border border-line text-[12.5px] font-semibold flex items-center justify-center gap-1.5">
            <FileText size={14} /> Contract
          </button>
          <button onClick={() => setInvoiceSaved(true)} className="tap py-3 rounded-xl bg-paper border border-line text-[12.5px] font-semibold flex items-center justify-center gap-1.5">
            <Upload size={14} /> {invoiceSaved ? 'Saved ✓' : 'Invoice'}
          </button>
        </div>
        <div className="px-5 grid grid-cols-2 gap-2 mt-2 mb-4">
          <button className="tap py-3.5 rounded-2xl bg-obsidian text-paper text-[13px] font-semibold flex items-center justify-center gap-1.5">
            <MessageCircle size={15} /> Message
          </button>
          {status === 'completed'
            ? <button onClick={() => dispatch({ type: 'GO', screen: 'reviews' })} className="tap py-3.5 rounded-2xl bg-iris text-paper text-[13px] font-semibold flex items-center justify-center gap-1.5">
                <Star size={15} /> Leave review
              </button>
            : <button onClick={() => dispatch({ type: 'GO', screen: 'safety' })} className="tap py-3.5 rounded-2xl bg-paper border border-line text-[13px] font-semibold flex items-center justify-center gap-1.5">
                <HelpCircle size={15} /> Get help
              </button>
          }
        </div>
      </div>
    </div>
  )
}
