import { BadgeCheck, Star, MapPin, Bookmark, Check } from 'lucide-react'
import { memo } from 'react'
import type { Creator } from '@/types'
import { inr, TRAVEL_MODES } from '@/data/constants'
import { fakeDistance, zoneOfArea, cn } from '@/utils'

interface CreatorCardRowProps {
  c: Creator
  onOpen: () => void
  isSaved?: boolean
  onToggleSave?: () => void
  userLoc?: [number, number] | null
}

export const CreatorCardRow = memo(function CreatorCardRow({ c, onOpen, isSaved, onToggleSave }: CreatorCardRowProps) {
  const distance = fakeDistance(c.city, c.area)
  return (
    <div className="px-5 py-4 bg-paper border-b border-line">
      <button onClick={onOpen} className="tap w-full flex gap-3 text-left">
        <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-bone shrink-0">
          <img src={c.portfolio[0]} className="w-full h-full object-cover" alt={c.name} loading="lazy" />
          {(c.verification === 'vetted' || c.verification === 'id') && (
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
            <span className="flex items-center gap-1"><MapPin size={10} />{c.area}, {zoneOfArea(c.area) || c.city}</span>
            <span className="tnum text-obsidian/50">· {distance} km</span>
            <span className="text-obsidian/50">· {(TRAVEL_MODES[c.travelMode] ?? TRAVEL_MODES.both).short}</span>
            {c.availableToday && (
              <span className="flex items-center gap-0.5 text-success font-semibold">
                <Check size={10} />Available today
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[12px] text-obsidian/70 line-clamp-1">{c.tagline}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {c.subSkills.slice(0, 2).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-bone text-[10px]">{s}</span>
            ))}
            <span className={cn('px-1.5 py-0.5 rounded bg-iris-tint text-iris text-[10px] capitalize')}>{c.gender}</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex items-center gap-0.5">
                <Star size={10} className="fill-obsidian text-obsidian" />
                <span className="font-semibold tnum">{c.rating}</span>
                <span className="text-obsidian/50">({c.reviews})</span>
              </div>
              <span className="text-obsidian/30">·</span>
              <span className="font-mono tnum text-obsidian/70">from {inr(c.startingAt)}</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  )
})
