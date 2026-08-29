import React, { useState } from 'react'
import { Check, Lock, FileText, Upload, MessageCircle, Star, HelpCircle } from 'lucide-react'
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
              <img src={c.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-paper/20 shrink-0" alt="" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-xl leading-tight truncate">{c.name}</div>
                <div className="text-[12px] text-paper/60 font-mono mt-0.5">#{b.id as string} · {b.pkg as string}</div>
              </div>
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold shrink-0', status === 'completed' ? 'bg-paper/15 text-paper' : 'bg-acid text-obsidian')}>
                {status === 'completed' ? 'Completed' : status === 'confirmed' ? 'Confirmed' : 'Awaiting creator'}
              </span>
            </div>

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

            <Card title="Session Details">
              <KV k="Package" v={b.pkg as string} />
              <KV k="Date & time" v={b.when as string} />
              <KV k="Location" v={locLabel} />
              <KV k="Booking ID" v={`#${b.id as string}`} />
            </Card>
          </div>

          {/* Right Column: Sticky Payment & Actions Panel */}
          <div className="md:sticky md:top-6">
            <Card title="Payment summary">
              <KV k="Package" v={inr(base)} />
              {travel > 0 && <KV k={b.locType === 'outstation' ? 'Travel (outstation)' : 'Travel'} v={inr(travel)} />}
              {accom > 0 && <KV k="Accommodation (est.)" v={inr(accom)} />}
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
                onClick={() => dispatch({ type: 'OPEN_CLIENT_CHAT', client: { name: c.name, avatar: c.avatar } })}
                className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2 shadow-md hover:bg-obsidian/90 transition"
              >
                <MessageCircle size={16} /> Message {c.name.split(' ')[0]}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => dispatch({ type: 'GO', screen: 'legal' })} className="tap py-3 px-3 rounded-xl bg-paper border border-line text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-bone transition">
                  <FileText size={14} /> Contract
                </button>
                <button onClick={() => setInvoiceSaved(true)} className="tap py-3 px-3 rounded-xl bg-paper border border-line text-[12.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-bone transition">
                  <Upload size={14} /> {invoiceSaved ? 'Saved ✓' : 'Invoice'}
                </button>
              </div>

              {status === 'completed'
                ? <button onClick={() => dispatch({ type: 'GO', screen: 'reviews' })} className="tap w-full py-3.5 rounded-2xl bg-iris text-paper text-[13px] font-semibold flex items-center justify-center gap-1.5">
                    <Star size={15} /> Leave a review
                  </button>
                : <button onClick={() => dispatch({ type: 'GO', screen: 'safety' })} className="tap w-full py-3.5 rounded-2xl bg-paper border border-line text-[13px] font-semibold text-obsidian/70 flex items-center justify-center gap-1.5 hover:bg-bone">
                    <HelpCircle size={15} /> Get support
                  </button>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
