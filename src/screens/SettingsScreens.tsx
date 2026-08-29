import { useState } from 'react'
import { Check, Clock, Lock, Zap, Loader2 } from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

/* ─── Settings Screen ─── */
export function SettingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const u = state.user ?? {}
  const [name, setName] = useState(u.name ?? '')
  const [city, setCity] = useState(u.city ?? '')
  const [handle, setHandle] = useState(u.handle ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (supabaseAvailable) {
        await authApi.updateMyProfile({ name: name.trim(), city: city.trim() })
      }
      dispatch({ type: 'UPDATE_USER', patch: { name: name.trim(), city: city.trim(), handle: handle.trim() } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      console.error('[FTC] Failed to update profile:', e)
      setError(e?.message || 'Failed to save changes to database')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Settings" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">Profile details</div>
          <div>
            <label className="text-[11px] text-obsidian/60">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rhea Kapoor"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>
          <div>
            <label className="text-[11px] text-obsidian/60">City</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Delhi NCR, Mumbai"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>
          <div>
            <label className="text-[11px] text-obsidian/60">Handle</label>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="e.g. @rhea.kapoor"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>

          {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className={cn(
              'tap w-full mt-2 py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition shadow-sm',
              saved ? 'bg-success text-paper' : 'bg-obsidian text-paper hover:bg-obsidian/90 disabled:opacity-50'
            )}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving to database…</>
            ) : saved ? (
              <><Check size={14} /> Saved to Database ✓</>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Calendar Screen (Compact & Elegant Layout) ─── */
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

  const upcoming = state.creatorBookings.filter(b => b.status === 'upcoming' || b.status === 'inquiry')

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0 h-full">
      <SimpleHeader title="Calendar & Availability" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 md:px-6 py-4 md:py-6">
        <div className="max-w-4xl mx-auto w-full md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-4 md:space-y-0">
          
          {/* Left Column: Compact Month Calendar & Slots */}
          <div className="space-y-4">
            {/* Compact month picker */}
            <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-iris font-semibold">Select date</div>
                  <div className="font-display text-xl tracking-tight mt-0.5">April 2026</div>
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-mono text-obsidian/50">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-acid border border-obsidian/10" /> Booked</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-obsidian/20" /> Off</span>
                </div>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['M','T','W','T','F','S','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-mono text-obsidian/45 py-0.5">{d}</div>
                ))}
              </div>

              {/* Compact date grid */}
              <div className="grid grid-cols-7 gap-1.5 place-items-center">
                {[null, null, ...monthDays].map((d, i) =>
                  d === null ? (
                    <div key={'b' + i} className="w-8 h-8 md:w-9 md:h-9" />
                  ) : (
                    <button
                      key={d}
                      onClick={() => setSel(d)}
                      className={cn(
                        'w-8 h-8 md:w-9 md:h-9 rounded-xl text-[12px] font-medium tnum flex items-center justify-center transition-all',
                        sel === d ? 'bg-obsidian text-paper font-semibold shadow-md' : avail[d] === 'booked' ? 'bg-acid text-obsidian font-semibold hover:opacity-80' : 'bg-bone hover:bg-obsidian/10 text-obsidian'
                      )}
                    >
                      {d}
                    </button>
                  )
                )}
              </div>

              {/* Day slot detail */}
              <div className="mt-4 pt-4 border-t border-line">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium">
                    <Clock size={14} className="text-iris" />
                    <span>April {sel} Slots</span>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'SET_AVAILABILITY', day: sel, value: avail[sel] === 'booked' ? [] : 'booked' })}
                    className={cn('tap px-3 py-1 rounded-lg text-[11px] font-semibold transition', avail[sel] === 'booked' ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/70 hover:bg-obsidian/10')}
                  >
                    {avail[sel] === 'booked' ? 'Unblock Day' : 'Block Day'}
                  </button>
                </div>

                {avail[sel] === 'booked' ? (
                  <div className="rounded-xl bg-bone p-3 text-[12px] text-obsidian/60 flex items-center gap-2 border border-line">
                    <Lock size={13} className="text-obsidian/40" /> Blocked — no bookings accepted for April {sel}.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                    {hours.slice(workStart, workEnd).map(hr => (
                      <div key={hr} className="py-1.5 rounded-lg text-[10.5px] font-mono font-medium text-center tnum bg-success/15 text-success border border-success/20">
                        {hourLabel(hr)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Working Hours & Booking Controls */}
          <div className="space-y-4">
            {/* Working hours card */}
            <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Working Hours</div>
                <button onClick={() => setAllDay(!allDay)} className={cn('tap px-2.5 py-1 rounded-full text-[11px] font-semibold transition', allDay ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/60 border border-line')}>24 hours</button>
              </div>

              {!allDay && (
                <div className="flex items-center gap-2">
                  <select value={workStart} onChange={e => setWorkStart(+e.target.value)} className="flex-1 py-2 px-3 bg-bone rounded-xl text-[13px] outline-none border border-line">
                    {hours.map(hr => <option key={hr} value={hr}>{hourLabel(hr)}</option>)}
                  </select>
                  <span className="text-obsidian/40 text-[12px]">to</span>
                  <select value={workEnd} onChange={e => setWorkEnd(+e.target.value)} className="flex-1 py-2 px-3 bg-bone rounded-xl text-[13px] outline-none border border-line">
                    {hours.map(hr => <option key={hr} value={hr}>{hourLabel(hr)}</option>)}
                  </select>
                </div>
              )}

              {/* Compact circular weekday selectors */}
              <div>
                <div className="text-[11px] text-obsidian/50 mb-1.5">Active Work Days</div>
                <div className="flex items-center justify-between gap-1">
                  {Object.keys(days).map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDay(d)}
                      className={cn(
                        'w-8 h-8 rounded-full text-[11px] font-semibold flex items-center justify-center transition border',
                        (days as any)[d] ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line text-obsidian/40 hover:bg-obsidian/10'
                      )}
                    >
                      {d[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line">
                <span className="text-[12px] text-obsidian/60">Buffer between sessions</span>
                <div className="flex gap-1">
                  {[0, 15, 30, 60].map(m => (
                    <button key={m} onClick={() => setBuffer(m)} className={cn('tap px-2 py-1 rounded-lg text-[10.5px] font-semibold border transition', buffer === m ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line text-obsidian/60')}>
                      {m === 0 ? 'None' : `${m}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Mode Controls */}
            <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold flex items-center gap-1.5"><Zap size={14} className="text-iris" /> Instant booking</div>
                  <div className="text-[11px] text-obsidian/55 mt-0.5">{instant ? 'Clients book open slots directly' : 'You approve each request'}</div>
                </div>
                {Toggle(instant, () => setInstant(!instant))}
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-line">
                <div>
                  <div className="text-[13px] font-semibold">Holiday mode</div>
                  <div className="text-[11px] text-obsidian/55 mt-0.5">{holiday ? 'Profile shows "away" — no new bookings' : 'Accepting new bookings'}</div>
                </div>
                {Toggle(holiday, () => setHoliday(!holiday))}
              </div>
            </div>

            {/* Upcoming Bookings */}
            {upcoming.length > 0 && (
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 space-y-2.5 shadow-xs">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Upcoming Bookings</div>
                <div className="space-y-2">
                  {upcoming.map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-bone border border-line text-[12.5px]">
                      <img src={b.clientAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{b.date}</div>
                        <div className="text-[11px] text-obsidian/55 truncate">{b.clientName} · {b.projectType}</div>
                      </div>
                      <span className="font-mono font-semibold text-iris shrink-0">{inr(b.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
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
  const dispatch = useAppStore(s => s.dispatch)
  const [stmt, setStmt] = useState(false)

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Revenue & payouts" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        <div className="p-5 rounded-3xl bg-obsidian text-paper relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-acid">Available balance</div>
          <div className="font-display text-4xl tnum mt-1 font-light">₹43,000</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => dispatch({ type: 'GO', screen: 'payoutSetup' })} className="tap flex-1 py-3 rounded-xl bg-acid text-obsidian text-[12.5px] font-semibold">
              Withdraw to bank
            </button>
            <button onClick={() => setStmt(true)} className="tap px-4 py-3 rounded-xl bg-paper/10 text-paper text-[12.5px] font-semibold">
              {stmt ? 'Sent ✓' : 'Statement'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-paper border border-line overflow-hidden p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-3">Transaction history</div>
          <div className="space-y-3">
            {PAYOUT_TXNS.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-[13px]">
                <div>
                  <div className="font-medium">{t.who}</div>
                  <div className="text-[11px] text-obsidian/45">{t.when}</div>
                </div>
                <div className="text-right">
                  <div className={cn('font-semibold tnum', t.dir === 'in' ? 'text-success' : 'text-obsidian')}>{t.dir === 'in' ? '+' : '-'}{inr(t.amount)}</div>
                  <span className="text-[10px] font-mono text-obsidian/40 uppercase">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LinkBioScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <SimpleHeader title="Link-in-Bio" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll p-5">
        <div className="p-6 rounded-2xl bg-paper border border-line text-center">
          <div className="font-display text-xl">Your Link-in-Bio is Active</div>
          <div className="text-sm text-obsidian/60 mt-1">ftc.app/@rhea</div>
        </div>
      </div>
    </div>
  )
}

export function PayoutSetupScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <SimpleHeader title="Payout Setup" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll p-5">
        <div className="p-6 rounded-2xl bg-paper border border-line">
          <div className="font-display text-xl">Bank Account & UPI</div>
          <div className="text-sm text-obsidian/60 mt-1">HDFC Bank •••• 4821 (Verified)</div>
        </div>
      </div>
    </div>
  )
}
