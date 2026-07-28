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

        <Card title="Details">
          <KV k="Package" v={b.pkg as string} />
          <KV k="Date & time" v={b.when as string} />
          <KV k="Location" v={locLabel} />
          <KV k="Booking ID" v={`#${b.id as string}`} />
        </Card>

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
