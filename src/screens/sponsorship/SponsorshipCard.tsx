import { Clock, MapPin, Shield, Users, ArrowRight } from 'lucide-react'
import { cn } from '@/utils'
import type { Campaign, Deal } from '@/types'

export function SponsorshipCard({ campaign, deal, onClick }: { campaign: Campaign; deal?: Deal; onClick: () => void }) {
  const isBrand = campaign.kind === 'brand'
  return (
    <div onClick={onClick} className="tap bg-paper rounded-3xl overflow-hidden border border-line active:scale-[0.99] transition">
      {campaign.hero && (
        <div className="relative h-44 overflow-hidden">
          <img src={campaign.hero} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <span className={cn('px-2 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider', isBrand ? 'bg-acid text-obsidian' : 'bg-iris text-paper')}>
              {isBrand ? 'Brand campaign' : 'Creator post'}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-obsidian/80 text-paper text-[11px] font-mono">
            <Clock size={11} /> {campaign.postedAgo}
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <img src={campaign.posterAvatar} className="w-7 h-7 rounded-full object-cover" alt="" />
          <div className="flex items-center gap-1 text-[12px]">
            <span className="font-semibold">{campaign.posterName}</span>
          </div>
          {!campaign.hero && (
            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider', isBrand ? 'bg-acid text-obsidian' : 'bg-iris text-paper')}>
              {isBrand ? 'Brand campaign' : 'Creator post'}
            </span>
          )}
        </div>
        <h3 className="font-display text-xl leading-tight tracking-tight">{campaign.title}</h3>
        <p className="mt-2 text-[13px] text-obsidian/70 leading-relaxed line-clamp-2">{campaign.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {campaign.discipline && <span className="px-2 py-0.5 rounded-full bg-bone text-[10px] font-medium">{campaign.discipline}</span>}
          {campaign.city && <span className="px-2 py-0.5 rounded-full bg-bone text-[10px] font-medium flex items-center gap-1"><MapPin size={9} />{campaign.city}</span>}
          {campaign.budgetMin && campaign.budgetMax && <span className="px-2 py-0.5 rounded-full bg-iris-tint text-iris text-[10px] font-semibold">₹{(campaign.budgetMin / 1000).toFixed(0)}K–{(campaign.budgetMax / 1000).toFixed(0)}K</span>}
        </div>
        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-[11px] text-obsidian/60">
          <span className="flex items-center gap-1"><Shield size={11} className="text-iris" /> Escrow protected</span>
          {deal
            ? <span className="flex items-center gap-1 font-semibold text-iris">You applied <ArrowRight size={12} /></span>
            : <span className="flex items-center gap-3"><span className="flex items-center gap-1"><Users size={11} /> {campaign.applicants}</span>{campaign.deadline && <span><Clock size={11} className="inline mr-0.5" />{campaign.deadline}</span>}</span>
          }
        </div>
      </div>
    </div>
  )
}
