import { DEAL_STAGES, inr } from '@/data/constants'
import { cn } from '@/utils'
import type { Deal } from '@/types'

const stageIdx = (stage: string) => DEAL_STAGES.findIndex(s => s.key === stage)

export function DealRow({ deal, role, onOpen }: { deal: Deal; role: string; onOpen: () => void }) {
  const idx = stageIdx(deal.stage)
  const other = role === 'creator' ? deal.brandName : deal.creatorName
  const avatar = role === 'creator' ? deal.brandAvatar : deal.creatorAvatar
  return (
    <button onClick={onOpen} className="tap w-full text-left p-4 rounded-2xl bg-paper border border-line">
      <div className="flex items-center gap-3">
        <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{deal.campaignTitle}</div>
          <div className="text-[11px] text-obsidian/60 mt-0.5">{other} · {inr(deal.quote)}</div>
        </div>
        <span className={cn('px-2 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0', deal.stage === 'completed' ? 'bg-obsidian text-acid' : deal.stage === 'active' ? 'bg-acid text-obsidian' : deal.stage === 'contract' ? 'bg-iris text-paper' : 'bg-bone text-obsidian/70 border border-line')}>
          {DEAL_STAGES[idx]?.label ?? deal.stage}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {DEAL_STAGES.map((s, i) => (
          <div key={s.key} className={cn('h-1 flex-1 rounded-full', i <= idx ? 'bg-iris' : 'bg-obsidian/10')} />
        ))}
      </div>
    </button>
  )
}
