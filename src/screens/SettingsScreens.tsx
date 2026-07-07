import { useState } from 'react'
import {
  Shield, Copy, Share2,
  ChevronRight, Clock, Lock, Zap, CreditCard, ArrowDown, ArrowUpRight, Upload,
  Camera,
} from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn } from '@/utils'

/* ─── Settings Screen ─── */
export function SettingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const u = state.user
  const [name, setName] = useState(u?.name ?? 'Rhea Kapoor')
  const [locality, setLocality] = useState(u?.locality ?? 'Hauz Khas')
  const [phone, setPhone] = useState(u?.phone ?? '+91 98765 43210')
  const [email, setEmail] = useState(u?.email ?? 'rhea@example.com')
  const [notif, setNotif] = useState(true)
  const [saved, setSaved] = useState(false)

  const field = (label: string, val: string, set: (v: string) => void, type?: string) => (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/50">{label}</label>
      <input type={type ?? 'text'} value={val} onChange={e => set(e.target.value)} className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Settings" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-5 pb-10 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-acid grid place-items-center font-display text-3xl text-obsidian">
              {(name[0] || 'R')}
            </div>
            <button className="tap absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-obsidian grid place-items-center border-2 border-bone">
              <Camera size={14} className="text-paper" />
            </button>
          </div>
          <div className="mt-2 text-[11px] text-obsidian/50">Tap to change photo</div>
        </div>
        {/* Fields */}
        <div className="space-y-3">
          {field('Full name', name, setName)}
          {field('Locality', locality, setLocality)}
          {field('Phone', phone, setPhone, 'tel')}
          {field('Email', email, setEmail, 'email')}
        </div>
        {/* Notifications toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-paper border border-line">
          <div>
            <div className="text-[14px] font-semibold">Push notifications</div>
            <div className="text-[11px] text-obsidian/50">Bookings, messages & payouts</div>
          </div>
          <button onClick={() => setNotif(!notif)} className={cn('tap relative w-11 h-6 rounded-full transition', notif ? 'bg-success' : 'bg-obsidian/15')}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-sm transition-all" style={{ left: notif ? 22 : 2 }} />
          </button>
        </div>
        <button
          onClick={() => {
            dispatch({ type: 'UPDATE_USER', patch: { name, locality, phone, email } })
            setSaved(true)
            setTimeout(() => dispatch({ type: 'BACK' }), 600)
          }}
          className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px]"
        >
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

/* ─── Link-in-Bio Screen ─── */
export function LinkBioScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const handle = state.user?.handle ?? ('@' + (state.user?.name ?? 'you').split(' ')[0].toLowerCase())
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Link-in-Bio" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-5 pb-10 space-y-4">
        {/* Hero link card */}
        <div className="p-5 rounded-2xl bg-obsidian text-paper text-center relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative text-[10px] font-mono uppercase tracking-[0.14em] text-acid">Your public booking link</div>
          <div className="relative font-display text-2xl mt-2">ftc.app/{handle}</div>
          <div className="relative flex gap-2 mt-4">
            <button
              onClick={() => { try { navigator.clipboard?.writeText('https://ftc.app/' + handle) } catch {} setCopied(true); setTimeout(() => setCopied(false), 1500) }}
              className="tap flex-1 py-3 rounded-xl bg-acid text-obsidian font-semibold text-[13px] flex items-center justify-center gap-1.5"
            >
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button className="tap flex-1 py-3 rounded-xl bg-paper/10 text-paper font-semibold text-[13px] flex items-center justify-center gap-1.5">
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
        {/* QR code mock */}
        <div className="rounded-2xl bg-paper border border-line p-5 flex flex-col items-center">
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/50 mb-3">Scan to open</div>
          <div className="grid p-3 bg-paper rounded-xl border border-line" style={{ gridTemplateColumns: 'repeat(11, 1fr)', gap: 2 }}>
            {Array.from({ length: 121 }, (_, i) => {
              const on = ((i * 37 + (i % 11) * 13 + Math.floor(i / 11) * 7) % 5) < 2 || i < 11 || i % 11 === 0 || i % 11 === 10 || i > 109
              return <div key={i} style={{ width: 11, height: 11, background: on ? '#141414' : 'transparent', borderRadius: 1 }} />
            })}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-iris-tint flex items-start gap-2.5">
          <ChevronRight size={15} className="text-iris shrink-0 mt-0.5" />
          <div className="text-[12px] text-obsidian/70 leading-relaxed">Put this link in your Instagram bio. When someone taps it they land on your booking page — portfolio, packages, trust score and a Book button — even without the app installed.</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Calendar Screen ─── */
export function CalendarScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [sel, setSel] = useState(27)
  const [instant, setInstant] = useState(false)
  const [holiday, setHoliday] = useState(false)
  const [buffer, setBuffer] = useState(15)
  const [allDay, setAllDay] = useState(false)
  const [workStart, setWorkStart] = useState(9)
  const [workEnd, setWorkEnd] = useState(21)
  const [days, setDays] = useState({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: false })
  const avail = state.creatorAvailability
  const monthDays = Array.from({ length: 30 }, (_, i) => i + 1)
  const hours = Array.from({ length: 24 }, (_, hr) => hr)
  const hourLabel = (hr: number) => { const ap = hr < 12 ? 'am' : 'pm'; const h12 = hr % 12 === 0 ? 12 : hr % 12; return h12 + ap }
  const toggleDay = (d: string) => setDays(s => ({ ...s, [d]: !(s as any)[d] }))
  const Toggle = (on: boolean, fn: () => void) => (
    <button onClick={fn} className={cn('tap relative w-11 h-6 rounded-full transition shrink-0', on ? 'bg-success' : 'bg-obsidian/15')}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-sm transition-all" style={{ left: on ? 22 : 2 }} />
    </button>
  )
  const upcoming = state.creatorBookings.filter(b => b.status === 'upcoming')

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Availability" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4">
        {/* Booking mode */}
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13.5px] font-semibold flex items-center gap-1.5"><Zap size={14} className="text-iris" /> Instant booking</div>
              <div className="text-[11px] text-obsidian/55">{instant ? 'Clients book open slots directly' : 'You approve each request'}</div>
            </div>
            {Toggle(instant, () => setInstant(!instant))}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <div>
              <div className="text-[13.5px] font-semibold">Holiday mode</div>
              <div className="text-[11px] text-obsidian/55">{holiday ? 'Profile shows "away" — no new bookings' : 'Accepting bookings'}</div>
            </div>
            {Toggle(holiday, () => setHoliday(!holiday))}
          </div>
        </div>

        {/* Working hours */}
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Working hours</div>
            <button onClick={() => setAllDay(!allDay)} className={cn('tap px-2.5 py-1 rounded-full text-[11px] font-semibold', allDay ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/60')}>24 hours</button>
          </div>
          {!allDay && (
            <div className="flex items-center gap-2">
              <select value={workStart} onChange={e => setWorkStart(+e.target.value)} className="flex-1 py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none appearance-none">
                {hours.map(hr => <option key={hr} value={hr}>{hourLabel(hr)}</option>)}
              </select>
              <span className="text-obsidian/40 text-[12px]">to</span>
              <select value={workEnd} onChange={e => setWorkEnd(+e.target.value)} className="flex-1 py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none appearance-none">
                {hours.map(hr => <option key={hr} value={hr}>{hourLabel(hr)}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-1.5">
            {Object.keys(days).map(d => (
              <button key={d} onClick={() => toggleDay(d)} className={cn('tap flex-1 py-2 rounded-lg text-[11px] font-semibold border', (days as any)[d] ? 'bg-iris text-paper border-iris' : 'bg-bone border-line text-obsidian/45')}>
                {d[0]}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[12px] text-obsidian/60">Buffer between bookings</span>
            <div className="flex gap-1.5">
              {[0, 15, 30, 60].map(m => (
                <button key={m} onClick={() => setBuffer(m)} className={cn('tap px-2.5 py-1 rounded-lg text-[11px] font-semibold border', buffer === m ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line text-obsidian/60')}>
                  {m === 0 ? 'None' : `${m}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Month calendar */}
        <div className="rounded-2xl bg-paper border border-line overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-lg tracking-tight">April 2026</div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-obsidian/45">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-acid" />Booked</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-obsidian/20" />Off</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-1">
              {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="text-center text-[10px] font-mono text-obsidian/40">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {[null, null, ...monthDays].map((d, i) =>
                d === null
                  ? <div key={'b' + i} />
                  : <button key={d} onClick={() => setSel(d)} className={cn('aspect-square rounded-lg text-[12px] font-medium tnum grid place-items-center', sel === d ? 'bg-obsidian text-paper' : avail[d] === 'booked' ? 'bg-acid/30' : 'bg-bone')}>
                      {d}
                    </button>
              )}
            </div>
          </div>
          <div className="border-t border-line p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5"><Clock size={14} className="text-iris" /><span className="font-display text-base">24-hour slots · Apr {sel}</span></div>
              <button onClick={() => dispatch({ type: 'SET_AVAILABILITY', day: sel, value: avail[sel] === 'booked' ? [] : 'booked' })} className={cn('tap px-2.5 py-1 rounded-lg text-[11px] font-semibold', avail[sel] === 'booked' ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/60')}>
                {avail[sel] === 'booked' ? 'Unblock' : 'Block day'}
              </button>
            </div>
            {avail[sel] === 'booked'
              ? <div className="rounded-xl bg-bone p-3 text-[12.5px] text-obsidian/55 flex items-center gap-2"><Lock size={13} /> Blocked out for the full day.</div>
              : <div className="grid grid-cols-6 gap-1.5">
                  {hours.map(hr => {
                    const open = allDay || (hr >= workStart && hr < workEnd)
                    return <div key={hr} className={cn('py-1.5 rounded-lg text-[10.5px] font-medium text-center tnum', open ? 'bg-success/10 text-success' : 'bg-bone text-obsidian/30')}>{hourLabel(hr)}</div>
                  })}
                </div>
            }
          </div>
        </div>

        {/* Upcoming bookings */}
        {upcoming.length > 0 && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2 px-1">Upcoming bookings</div>
            <div className="space-y-2">
              {upcoming.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl bg-paper border border-line">
                  <img src={b.clientAvatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{b.date}</div>
                    <div className="text-[11px] text-obsidian/55">{b.clientName} · {b.projectType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Payouts Screen ─── */
const PAYOUT_TXNS = [
  { id: 't1', who: 'Priya Joshi job', amount: 30000, dir: 'in' as const, when: 'Apr 22', status: 'released' },
  { id: 't2', who: 'Withdrawal to HDFC ••4821', amount: 28000, dir: 'out' as const, when: 'Apr 20', status: 'paid' },
  { id: 't3', who: 'Karan Bhalla advance', amount: 25000, dir: 'in' as const, when: 'Apr 18', status: 'escrow' },
  { id: 't4', who: 'Nisha Reddy job', amount: 10000, dir: 'in' as const, when: 'Apr 12', status: 'released' },
]

export function PayoutsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [stmt, setStmt] = useState(false)
  const released = state.creatorBookings.filter(b => b.status === 'completed').reduce((a, b) => a + b.price, 0)
  const pending = state.creatorBookings.filter(b => b.status === 'pending' || b.status === 'upcoming').reduce((a, b) => a + b.advancePaid, 0)
  const available = 43000

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Revenue & payouts" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4">
        <div className="rounded-2xl bg-obsidian text-paper p-5 relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-acid">Available to withdraw</div>
            <div className="font-display text-4xl tnum mt-1">{inr(available)}</div>
            <button onClick={() => dispatch({ type: 'GO', screen: 'payoutSetup' })} className="tap mt-4 w-full py-3 rounded-xl bg-acid text-obsidian font-semibold text-[14px]">
              Withdraw to bank
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3.5 rounded-2xl bg-paper border border-line">
            <div className="font-display text-xl tnum">{inr(pending)}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/45 mt-1">In escrow</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-paper border border-line">
            <div className="font-display text-xl tnum">{inr(released)}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/45 mt-1">Released (lifetime)</div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'GO', screen: 'payoutSetup' })} className="tap w-full p-4 rounded-2xl bg-paper border border-line flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-bone grid place-items-center"><CreditCard size={18} className="text-obsidian/70" /></div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold">Payout method</div>
            <div className="text-[11.5px] text-obsidian/55">HDFC Bank ••4821 · primary</div>
          </div>
          <ChevronRight size={16} className="text-obsidian/30" />
        </button>
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Transaction history</div>
            <button onClick={() => setStmt(true)} className="tap text-[11px] font-medium text-iris flex items-center gap-1">
              <Upload size={12} /> {stmt ? 'Saved ✓' : 'Statement'}
            </button>
          </div>
          <div className="rounded-2xl bg-paper border border-line divide-y divide-line overflow-hidden">
            {PAYOUT_TXNS.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={cn('w-8 h-8 rounded-lg grid place-items-center shrink-0', t.dir === 'in' ? 'bg-success/10' : 'bg-bone')}>
                  {t.dir === 'in' ? <ArrowDown size={14} className="text-success" /> : <ArrowUpRight size={14} className="text-obsidian/60" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">{t.who}</div>
                  <div className="text-[10px] font-mono text-obsidian/45">{t.when} · {t.status}</div>
                </div>
                <div className={cn('text-[13px] font-semibold tnum', t.dir === 'in' ? 'text-success' : 'text-obsidian')}>
                  {t.dir === 'in' ? '+' : '−'}{inr(t.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Payout Setup Screen ─── */
export function PayoutSetupScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [method, setMethod] = useState<'bank' | 'upi'>('bank')
  const [f, setF] = useState({ holder: 'Rhea Kapoor', bank: 'HDFC Bank', acct: '', ifsc: '', upi: '', gst: '', pan: '' })
  const set = (k: keyof typeof f, v: string) => setF(s => ({ ...s, [k]: v }))
  const [saved, setSaved] = useState(false)
  const valid = method === 'bank' ? (f.holder && f.acct && f.ifsc) : f.upi.trim()

  const field = (label: string, k: keyof typeof f, ph: string, opt?: boolean) => (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">{label}{opt && <span className="text-obsidian/30 normal-case"> (optional)</span>}</label>
      <input value={f[k]} onChange={e => set(k, e.target.value)} placeholder={ph} className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <SimpleHeader title="Payout method" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-28 space-y-4">
        <div className="flex gap-2 p-1 bg-paper border border-line rounded-2xl">
          {([['bank', 'Bank account', 'Primary'], ['upi', 'UPI', 'Secondary']] as [typeof method, string, string][]).map(([k, l, tag]) => (
            <button key={k} onClick={() => setMethod(k)} className={cn('tap flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition', method === k ? 'bg-obsidian text-paper' : 'text-obsidian/60')}>
              {l}
              <div className={cn('text-[9px] font-mono uppercase', method === k ? 'text-paper/50' : 'text-obsidian/35')}>{tag}</div>
            </button>
          ))}
        </div>
        {method === 'bank'
          ? <div className="space-y-3">{field('Account holder name', 'holder', 'As per bank records')}{field('Bank name', 'bank', 'e.g. HDFC Bank')}{field('Account number', 'acct', '')}{field('IFSC code', 'ifsc', 'HDFC0001234')}</div>
          : <div className="space-y-3">{field('UPI ID', 'upi', 'name@upi')}</div>
        }
        <div className="pt-1 space-y-3">
          {field('PAN', 'pan', 'ABCDE1234F', true)}
          {field('GSTIN', 'gst', '07ABCDE1234F1Z5', true)}
        </div>
        <div className="p-3 rounded-xl bg-paper border border-line flex items-start gap-2 text-[11.5px] text-obsidian/55">
          <Shield size={14} className="text-iris shrink-0 mt-0.5" />
          Escrow releases land here within 24h of the client approving delivery. 1% TDS is deducted and filed against your PAN.
        </div>
      </div>
      <div className="px-5 py-3 border-t border-line bg-paper shrink-0">
        <button
          disabled={!valid}
          onClick={() => { setSaved(true); setTimeout(() => dispatch({ type: 'BACK' }), 600) }}
          className={cn('tap w-full py-4 rounded-2xl font-semibold text-[15px]', valid ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/30')}
        >
          {saved ? '✓ Saved' : 'Save payout method'}
        </button>
      </div>
    </div>
  )
}
