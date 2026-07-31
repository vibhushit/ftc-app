import { Heart, BadgeCheck, Star, MapPin } from 'lucide-react'
import { memo } from 'react'
import type { Creator } from '@/types'
import { inr } from '@/data/constants'
import { cn } from '@/utils'

interface CreatorCardLargeProps {
  c: Creator | any
  onOpen: () => void
}

export const CreatorCardLarge = memo(function CreatorCardLarge({ c, onOpen }: CreatorCardLargeProps) {
  const coverImage = c.portfolio?.[0] ?? c.portfolio_urls?.[0] ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  const rating = c.rating ?? 4.8
  const reviews = c.reviews ?? c.review_count ?? 0
  const startingAt = c.startingAt ?? c.starting_at ?? 12000
  const area = c.area ?? c.locality ?? 'Central'
  const isVerified = c.verified || c.verification === 'vetted' || c.verification === 'id'

  return (
    <button onClick={onOpen} className={cn('tap shrink-0 w-[240px] md:w-full md:shrink text-left group')}>
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-bone">
        <img
          src={coverImage}
          className="w-full h-full object-cover group-active:scale-105 transition-transform duration-500"
          alt={c.name}
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper/90 backdrop-blur text-[9px] font-mono uppercase tracking-[0.1em]">
              <BadgeCheck size={9} className="text-iris" /> Verified
            </span>
          )}
        </div>
        <button
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-paper/90 backdrop-blur grid place-items-center"
        >
          <Heart size={13} />
        </button>
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-obsidian/90 to-transparent text-paper">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] opacity-80">{c.discipline}</div>
          <div className="font-display text-lg leading-tight">{c.name}</div>
        </div>
      </div>
      <div className="pt-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[12px]">
            <Star size={11} className="fill-obsidian text-obsidian" />
            <span className="font-semibold tnum">{rating}</span>
            <span className="text-obsidian/50">({reviews})</span>
          </div>
          <div className="text-[11px] font-mono text-obsidian/60 tnum">from {inr(startingAt)}</div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-obsidian/60 mt-0.5">
          <MapPin size={10} /> {area}, {c.city}
        </div>
      </div>
    </button>
  )
})
