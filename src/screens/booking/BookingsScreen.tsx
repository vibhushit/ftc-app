import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { cn } from '@/utils'

const BOOKINGS_SEED = [
  { id: 'FTC8472', cid: 'c1', when: 'Sun, Apr 27 · 1:00 PM', status: 'confirmed', pkg: 'Standard', locType: 'studio' },
  { id: 'FTC8420', cid: 'c4', when: 'Thu, May 02 · 11:00 AM', status: 'pending', pkg: 'Premium', locType: 'local' },
  { id: 'FTC8211', cid: 'c7', when: 'Sat, Apr 05', status: 'completed', pkg: 'Starter', locType: 'studio' },
  { id: 'FTC7988', cid: 'c10', when: 'Fri, Mar 28', status: 'completed', pkg: 'Standard', locType: 'outstation' },
]

export function BookingsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between bg-paper border-b border-line">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 p-2"><ArrowLeft size={20} /></button>
        <div className="font-display text-lg">My bookings</div>
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 px-5 pt-4 pb-6 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
        {BOOKINGS_SEED.map(b => {
          const c = CREATORS.find(x => x.id === b.cid)
          if (!c) return null
          const badge = b.status === 'confirmed'
            ? { cls: 'bg-iris text-paper', t: 'Confirmed' }
            : b.status === 'pending'
              ? { cls: 'bg-acid text-obsidian', t: 'Awaiting creator' }
              : { cls: 'bg-bone border border-line text-obsidian/70', t: 'Completed' }
          return (
            <button key={b.id} onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b as any })} className="tap w-full text-left p-4 rounded-2xl bg-paper border border-line active:bg-bone md:h-full">
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
