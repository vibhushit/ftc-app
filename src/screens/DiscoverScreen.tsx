import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, Map, List, X } from 'lucide-react'
import { StatusBar } from '@/components/ui/StatusBar'
import { CreatorCardRow } from '@/components/creator/CreatorCardRow'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS, DISCIPLINE_CONFIG } from '@/data/creators'
import { pic } from '@/data/constants'
import { cn } from '@/utils'
import { useCreatorSearch } from '@/hooks/useCreators'
import { supabaseAvailable } from '@/lib/supabase'
import type { Tier, Verification, Gender, Creator } from '@/types'

function dbToCreator(row: {
  id: string; name: string; handle: string; avatar_url: string | null
  discipline: string; city: string; area: string; starting_at: number
  avg_rating: number; review_count: number; completed_jobs: number
  tier: string; trust_score: number; available_today: boolean; verification: string
}): Creator {
  return {
    id: row.id,
    name: row.name ?? '',
    handle: row.handle,
    discipline: row.discipline,
    subSkills: [],
    city: row.city,
    area: row.area,
    avatar: row.avatar_url ?? pic((row.name || row.handle) + '-av', 200, 200),
    portfolio: [
      pic((row.name || row.handle) + '-1', 1200, 1500),
      pic((row.name || row.handle) + '-2', 1200, 1200),
    ],
    rating: Number(row.avg_rating) || 0,
    reviews: row.review_count || 0,
    startingAt: row.starting_at,
    yearsExp: 0,
    completed: row.completed_jobs || 0,
    rise: '+0%',
    tier: row.tier as Tier,
    verification: row.verification as Verification,
    isPro: false,
    responseTime: '~2 hrs',
    nextSlot: 'Tomorrow',
    languages: [],
    tagline: '',
    availability: [],
    repeatRate: 0,
    travelRadius: 'city',
    gender: 'male' as Gender,
    trustScore: row.trust_score || 0,
    availableToday: row.available_today,
    travelMode: 'both',
    oneOnOne: { name: '1:1 Call', mins: 30, price: 999, type: 'Video call', today: false },
  }
}

export function DiscoverScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [query, setQuery] = useState('')
  const { filters, viewMode } = state

  const searchParams = {
    query:      query.trim() || undefined,
    discipline: filters.discipline !== 'All' ? filters.discipline : undefined,
    city:       filters.city || undefined,
    minPrice:   filters.budgetMin > 0 ? filters.budgetMin : undefined,
    maxPrice:   filters.budgetMax < 200000 ? filters.budgetMax : undefined,
    minRating:  filters.rating > 0 ? filters.rating : undefined,
    available:  filters.availableToday || undefined,
    limit:      50,
  }
  const { data: dbData, isLoading: dbLoading } = useCreatorSearch(searchParams, supabaseAvailable)

  const results = useMemo((): Creator[] => {
    if (supabaseAvailable && dbData && dbData.length > 0) {
      let list: Creator[] = (dbData as Parameters<typeof dbToCreator>[0][]).map(dbToCreator)
      if (filters.gender && filters.gender !== 'Any') list = list.filter((c: Creator) => c.gender === filters.gender.toLowerCase())
      return list
    }
    let list = [...CREATORS]
    if (filters.discipline && filters.discipline !== 'All') list = list.filter(c => c.discipline === filters.discipline)
    if (filters.city) list = list.filter(c => c.city === filters.city)
    if (filters.availableToday) list = list.filter(c => c.availableToday)
    if (filters.gender && filters.gender !== 'Any') list = list.filter(c => c.gender === filters.gender.toLowerCase())
    if (filters.rating > 0) list = list.filter(c => c.rating >= filters.rating)
    if (filters.budgetMin > 0) list = list.filter(c => c.startingAt >= filters.budgetMin)
    if (filters.budgetMax < 200000) list = list.filter(c => c.startingAt <= filters.budgetMax)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.discipline.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q),
      )
    }
    return list
  }, [dbData, filters, query])

  const hasFilters = filters.discipline !== 'All' || filters.availableToday || filters.gender !== 'Any' || filters.rating > 0

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <StatusBar />
      {/* Search header */}
      <div className="px-4 pt-2 pb-3 space-y-3 border-b border-line">
        <div className="flex items-center gap-2 bg-bone border border-line rounded-2xl px-3.5 py-3">
          <Search size={17} className="text-obsidian/40 shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Photographer, city, style…"
            className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="tap">
              <X size={15} className="text-obsidian/40" />
            </button>
          )}
        </div>
        {/* Filter chips row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'filters' })}
            className={cn('chip shrink-0', hasFilters && 'chip-active')}
          >
            <SlidersHorizontal size={12} />
            Filters
            {hasFilters && <span className="ml-0.5 text-[9px] opacity-70">·on</span>}
          </button>
          {Object.keys(DISCIPLINE_CONFIG).map(d => (
            <button
              key={d}
              onClick={() => dispatch({ type: 'SET_FILTER', patch: { discipline: filters.discipline === d ? 'All' : d } })}
              className={cn('chip shrink-0', filters.discipline === d && 'chip-active')}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="px-5 py-2.5 flex items-center justify-between border-b border-line">
        <span className="text-[12px] font-mono text-obsidian/50">
          {dbLoading ? 'Loading…' : `${results.length} creator${results.length !== 1 ? 's' : ''}`}
          {filters.city ? ` in ${filters.city}` : ''}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'list' })}
            className={cn('tap w-8 h-8 rounded-lg grid place-items-center', viewMode === 'list' ? 'bg-obsidian text-paper' : 'text-obsidian/40')}
          >
            <List size={15} />
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'map' })}
            className={cn('tap w-8 h-8 rounded-lg grid place-items-center', viewMode === 'map' ? 'bg-obsidian text-paper' : 'text-obsidian/40')}
          >
            <Map size={15} />
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <MapPlaceholder count={results.length} onSwitch={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'list' })} />
      ) : (
        <div className="app-scroll">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-8">
              <div className="text-4xl mb-4">🔍</div>
              <div className="font-display text-xl">No matches</div>
              <p className="text-[13px] text-obsidian/50 mt-2">Try adjusting your filters or search term.</p>
              <button onClick={() => { dispatch({ type: 'RESET_FILTERS' }); setQuery('') }} className="tap mt-4 px-4 py-2 rounded-xl bg-bone text-[13px] font-medium">
                Clear all filters
              </button>
            </div>
          ) : (
            results.map(c => (
              <CreatorCardRow
                key={c.id}
                c={c}
                isSaved={state.saved.includes(c.id)}
                onOpen={() => dispatch({ type: 'OPEN_CREATOR', id: c.id })}
                onToggleSave={() => dispatch({ type: 'TOGGLE_SAVE', id: c.id })}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function MapPlaceholder({ count, onSwitch }: { count: number; onSwitch: () => void }) {
  return (
    <div className="flex-1 relative bg-sand overflow-hidden">
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-5xl mb-3">🗺️</div>
          <div className="font-display text-lg">{count} creators nearby</div>
          <p className="text-[12px] text-obsidian/50 mt-1">Map view — enable location for distances</p>
          <button onClick={onSwitch} className="tap mt-4 px-5 py-2.5 rounded-xl bg-obsidian text-paper text-[13px] font-semibold">
            Switch to list
          </button>
        </div>
      </div>
      {/* Decorative dots */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-8 h-8 rounded-full bg-iris/20 border-2 border-iris/40 grid place-items-center"
          style={{ left: `${15 + (i * 37 % 70)}%`, top: `${20 + (i * 53 % 60)}%` }}
        >
          <div className="w-2 h-2 rounded-full bg-iris" />
        </div>
      ))}
    </div>
  )
}
