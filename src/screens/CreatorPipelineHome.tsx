import { Calendar, ChevronRight, Clock, Plus } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { CRM_TABS, CRM_EMPTY } from '@/data/constants'
import { cn } from '@/utils'

export function CreatorPipelineHome() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const tab = state.crmTab || 'inquiry'
  const jobs = state.creatorBookings.filter(b => b.status === tab)
  const revenue = state.creatorBookings.filter(b => b.status === 'completed').reduce((a, b) => a + b.price, 0)
  const payout = state.creatorBookings.filter(b => b.status === 'pending' || b.status === 'upcoming').reduce((a, b) => a + (b.price - b.advancePaid), 0)

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-iris">Creator pipeline</div>
            <div className="font-display text-3xl tracking-tight leading-none mt-1">Your jobs</div>
          </div>
          <button onClick={() => dispatch({ type: 'GO', screen: 'calendar' })} className="tap w-10 h-10 rounded-full bg-bone grid place-items-center">
            <Calendar size={18} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['Revenue', inr(revenue), 'released'],
            ['Pending payout', inr(payout), 'in escrow'],
            ['Response rate', '96%', 'avg ~15 min'],
            ['Trust score', String((state.user?.trustScore) || 92), 'out of 100'],
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-2xl bg-bone border border-line">
              <div className="font-display text-xl tracking-tight tnum leading-none">{s[1]}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.1em] text-obsidian/50 mt-1">{s[0]}</div>
              <div className="text-[10px] text-obsidian/40">{s[2]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-3 border-b border-line">
        {CRM_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => dispatch({ type: 'SET_CRM_TAB', tab: t.key })}
            className={cn('tap shrink-0 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition', tab === t.key ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/60')}
          >
            {t.label}
            <span className={cn('ml-1 text-[10px]', tab === t.key ? 'text-paper/50' : 'text-obsidian/35')}>
              {state.creatorBookings.filter(b => b.status === t.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="app-scroll pb-nav">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-bone grid place-items-center mb-4">
              <Clock size={24} className="text-obsidian/30" />
            </div>
            <div className="font-display text-lg">{CRM_EMPTY[tab]?.[0]}</div>
            <p className="text-[13px] text-obsidian/50 mt-2 leading-relaxed">{CRM_EMPTY[tab]?.[1]}</p>
          </div>
        ) : (
          <div className="divide-y divide-line md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:px-5 md:pt-4">
            {jobs.map(b => (
              <button
                key={b.id}
                onClick={() => dispatch({ type: 'OPEN_BOOKING', booking: b })}
                className="tap w-full px-5 py-4 flex items-center gap-3 text-left md:rounded-2xl md:border md:border-line md:bg-paper"
              >
                <img src={b.clientAvatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-[14px]">{b.clientName}</div>
                    <div className="font-mono text-[12px] tnum text-obsidian/60">{inr(b.price)}</div>
                  </div>
                  <div className="text-[12px] text-obsidian/60 mt-0.5">{b.projectType}</div>
                  <div className="text-[11px] font-mono text-obsidian/40 mt-0.5">{b.date}</div>
                </div>
                <ChevronRight size={16} className="text-obsidian/30 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => dispatch({ type: 'GO', screen: 'campaigns' })}
        className="absolute bottom-24 right-5 w-14 h-14 bg-obsidian text-paper rounded-2xl grid place-items-center shadow-lg tap"
      >
        <Plus size={22} />
      </button>
    </div>
  )
}
