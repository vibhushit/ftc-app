import { useState } from 'react'
import { ArrowLeft, Plus, Shield } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { SponsorshipCard } from './SponsorshipCard'
import { DealRow } from './DealRow'

export function SponsorshipsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const role = state.sponsorRole
  const [tab, setTab] = useState('feed')
  const [filter, setFilter] = useState('all')
  const feed = role === 'brand'
    ? state.campaigns.filter(c => c.kind === 'brand')
    : state.campaigns.filter(c => filter === 'all' ? true : c.kind === filter)
  const deals = state.deals
  const activeCount = deals.filter(d => d.stage === 'active').length
  const inEscrow = deals.flatMap(d => d.payments).filter(p => p.status === 'escrow').reduce((a, p) => a + p.amount, 0)
  const needsAction = 0

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <div className="px-5 pt-4 pb-3 bg-paper border-b border-line shrink-0">
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 w-10 h-10 grid place-items-center shrink-0"><ArrowLeft size={20} /></button>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-iris font-mono font-semibold">Brands × creators</div>
              <h1 className="font-display text-3xl tracking-tight leading-none mt-1">Sponsorships</h1>
            </div>
          </div>
          <button onClick={() => dispatch({ type: 'GO', screen: 'campaignCompose' })} className="tap w-10 h-10 rounded-full bg-obsidian text-paper grid place-items-center shrink-0">
            <Plus size={20} />
          </button>
        </div>
        <div className="mt-4 flex gap-2 p-1 bg-bone rounded-2xl">
          {([['creator', "I'm a creator"], ['brand', "I'm a brand"]] as [typeof role, string][]).map(([r, lab]) => (
            <button key={r} onClick={() => dispatch({ type: 'SET_SPONSOR_ROLE', role: r })} className={cn('tap flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition', role === r ? 'bg-paper shadow-sm' : 'text-obsidian/60')}>
              {lab}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {(role === 'creator'
            ? [['feed', 'Opportunities'], ['deals', 'My deals']]
            : [['feed', 'My campaigns'], ['deals', 'Applicants & deals']]
          ).map(([t, lab]) => (
            <button key={t} onClick={() => setTab(t)} className={cn('tap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition flex items-center gap-1.5', tab === t ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/70 border border-line')}>
              {lab}
              {t === 'deals' && needsAction > 0 && <span className={cn('min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold grid place-items-center', tab === t ? 'bg-acid text-obsidian' : 'bg-danger text-paper')}>{needsAction}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'feed' ? (
        <div className="app-scroll pb-nav px-5 pt-4 space-y-3">
          {role === 'creator' && (
            <div className="flex gap-2">
              {['all', 'brand', 'creator'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn('tap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition', filter === f ? 'bg-obsidian text-paper' : 'bg-paper text-obsidian/70 border border-line')}>
                  {f === 'all' ? 'All' : f === 'brand' ? 'Brand campaigns' : 'Creator posts'}
                </button>
              ))}
            </div>
          )}
          <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0 space-y-3">
            {feed.map(c => (
              <SponsorshipCard
                key={c.id}
                campaign={c}
                deal={deals.find(d => d.campaignId === c.id)}
                onClick={() => dispatch({ type: 'OPEN_CAMPAIGN', id: c.id })}
              />
            ))}
          </div>
          <div className="h-6" />
        </div>
      ) : (
        <div className="app-scroll pb-nav px-5 pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-obsidian">
              <div className="font-display text-2xl text-acid tnum">{activeCount}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-paper/60 mt-0.5">Active</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-iris-tint">
              <div className="font-display text-2xl text-iris tnum">₹{(inEscrow / 1000).toFixed(0)}K</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-obsidian/60 mt-0.5">In escrow</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-paper border border-line">
              <div className="font-display text-2xl tnum">{deals.filter(d => d.stage === 'completed').length}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-obsidian/60 mt-0.5">Done</div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-iris-tint flex items-center gap-2.5">
            <Shield size={16} className="text-iris shrink-0" />
            <span className="text-[11px] text-obsidian/70 leading-snug">Every deal runs on a standard contract. Payments sit in escrow and release on approval.</span>
          </div>
          {deals.length === 0 && (
            <div className="p-5 rounded-2xl bg-paper border border-line text-center">
              <div className="text-[24px]">💼</div>
              <div className="mt-2 text-[13px] font-semibold">No deals yet</div>
              <div className="text-[11px] text-obsidian/60 mt-1">{role === 'creator' ? 'Apply to a campaign to start your first deal.' : 'Post a campaign and creators will apply.'}</div>
            </div>
          )}
          <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0 space-y-3">
            {deals.map(d => <DealRow key={d.id} deal={d} role={role} onOpen={() => dispatch({ type: 'OPEN_DEAL', id: d.id })} />)}
          </div>
          <div className="h-6" />
        </div>
      )}
    </div>
  )
}
