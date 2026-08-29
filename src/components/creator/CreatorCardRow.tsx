import { BadgeCheck, Star, MapPin, Bookmark, Check } from 'lucide-react'
import { memo } from 'react'
import type { Creator } from '@/types'
import { inr, TRAVEL_MODES } from '@/data/constants'
import { fakeDistance, zoneOfArea, cn } from '@/utils'

interface CreatorCardRowProps {
  c: Creator | any
  onOpen: () => void
  isSaved?: boolean
  onToggleSave?: () => void
  userLoc?: [number, number] | null
}

export const CreatorCardRow = memo(function CreatorCardRow({ c, onOpen, isSaved, onToggleSave }: CreatorCardRowProps) {
  const area = c.area ?? c.locality ?? 'Central'
  const distance = fakeDistance(c.city, area)
  const coverImage = c.portfolio?.[0] ?? c.portfolio_urls?.[0] ?? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'
  const subSkills = c.subSkills ?? c.sub_skills ?? []
  const reviews = c.reviews ?? c.review_count ?? 0
  const startingAt = c.startingAt ?? c.starting_at ?? 12000
  const isVerified = c.verified || c.verification === 'vetted' || c.verification === 'id'

  return (
    <div className="px-5 py-4 bg-paper border-b border-line">
      <button onClick={onOpen} className="tap w-full flex gap-3 text-left">
        <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-bone shrink-0">
          <img src={coverImage} className="w-full h-full object-cover" alt={c.name} loading="lazy" />
          {isVerified && (
            <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-paper/90 backdrop-blur grid place-items-center">
              <BadgeCheck size={13} className="text-iris" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="font-display text-lg leading-tight">{c.name}</div>
              <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-obsidian/50 mt-0.5">{c.discipline}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); onToggleSave?.() }} className="-mr-1 -mt-1 p-1">
              <Bookmark size={15} className={isSaved ? 'fill-iris text-iris' : 'text-obsidian/40'} />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[11px] text-obsidian/70">
            <span className="flex items-center gap-1"><MapPin size={10} />{area}, {zoneOfArea(area) || c.city}</span>
            <span className="tnum text-obsidian/50">· {distance} km</span>
            {c.travelMode && (
              <span className="text-obsidian/50">· {(TRAVEL_MODES[c.travelMode] ?? TRAVEL_MODES.both).short}</span>
            )}
            {c.availableToday && (
              <span className="flex items-center gap-0.5 text-success font-semibold">
                <Check size={10} />Available today
              </span>
            )}
          </div>
          {c.tagline && <p className="mt-1.5 text-[12px] text-obsidian/70 line-clamp-1">{c.tagline}</p>}
          <div className="flex flex-wrap gap-1 mt-2">
            {subSkills.slice(0, 2).map((s: string) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-bone text-[10px]">{s}</span>
            ))}
            {c.gender && (
              <span className={cn('px-1.5 py-0.5 rounded bg-iris-tint text-iris text-[10px] capitalize')}>{c.gender}</span>
            )}
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex items-center gap-0.5">
                <Star size={10} className="fill-obsidian text-obsidian" />
                <span className="font-semibold tnum">{c.rating}</span>
                <span className="text-obsidian/50">({reviews})</span>
              </div>
            </div>
            <div className="text-[12px] font-semibold tnum">from {inr(startingAt)}</div>
          </div>
        </div>
      </button>
    </div>
  )
})
