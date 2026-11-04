import { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Heart, Share2, MapPin, BadgeCheck, Check, Star, Clock,
  ChevronRight, ChevronLeft, MessageCircle, Volume2,
  ArrowRight, CalendarCheck, Instagram, Film, Briefcase, Globe,
  Loader2, Sparkles, Lock, AlertCircle, UserX
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { apiClient } from '@/services/apiClient'
import { inr } from '@/data/constants'
import { cn, shareOrCopy, formatSlotRange12h, getProfileUrl, normalizeSocialUrl } from '@/utils'
import { useCreator, useCreatorServices, useMonthAvailability } from '@/hooks/useCreators'
import type { CreatorWithUser } from '@/lib/database.types'
import type { Tier, Verification, Gender, TravelMode, TravelRadius, Creator, BookingDraft } from '@/types'

function dbToCreatorFull(db: CreatorWithUser): Creator {
  return {
    id:           db.id,
    name:         db.users.name,
    handle:       db.handle,
    discipline:   db.discipline,
    subSkills:    db.sub_skills,
    city:         db.city,
    area:         db.area,
    avatar:       db.users.avatar_url || '',
    portfolio:    db.portfolio_urls?.length
                    ? db.portfolio_urls
                    : (db.users.avatar_url ? [db.users.avatar_url] : []),
    rating:       Number(db.avg_rating),
    reviews:      db.review_count,
    startingAt:   db.starting_at,
    yearsExp:     db.years_exp,
    completed:    db.completed_jobs,
    rise:         '+0%',
    tier:         db.tier as Tier,
    verification: db.verification as Verification,
    isPro:        db.is_pro,
    responseTime: db.response_time,
    nextSlot:     db.next_slot,
    languages:    db.languages,
    tagline:      db.tagline,
    availability: [],
    repeatRate:   db.repeat_rate / 100,
    travelRadius: db.travel_radius as TravelRadius,
    gender:       db.gender as Gender,
    trustScore:   db.trust_score,
    availableToday: db.available_today,
    travelMode:   db.travel_mode as TravelMode,
    igHandle:     db.ig_handle,
    ytHandle:     db.yt_handle,
    websiteUrl:   db.website_url,
    lat:          db.lat ?? undefined,
    lng:          db.lng ?? undefined,
  }
}

function Stat({ value, label, unit }: { value: string | number; label: string; unit?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-display text-xl tnum">{value}{unit && <span className="text-[13px]">{unit}</span>}</div>
      <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-obsidian/50 mt-0.5">{label}</div>
    </div>
  )
}

function depositInfo(price: number) {
  return price <= 10000 ? { full: true, pct: 100, advance: price } : { full: false, pct: 30, advance: Math.round(price * 0.3) }
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

export function CreatorDetailScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const id = state.selectedCreatorId === '__not_found__'
    ? null
    : (state.selectedCreatorId || (state.isCreator ? state.supabaseUserId : null))
  const { data: dbCreator, isLoading } = useCreator(id)
  const { data: dbServices }           = useCreatorServices(id)

  let c: Creator | undefined = dbCreator ? dbToCreatorFull(dbCreator) : undefined

  // Fallback strictly for newly created creator viewing their own profile
  const isSelfProfile = Boolean(
    (id && state.supabaseUserId && id === state.supabaseUserId) ||
    (id && state.user?.handle && id.replace(/^@+/, '').toLowerCase() === state.user.handle.replace(/^@+/, '').toLowerCase()) ||
    (!state.selectedCreatorId && state.isCreator)
  )

  if (!c && isSelfProfile && (id === state.supabaseUserId || (state.user?.handle && id === state.user.handle) || state.isCreator)) {
    const ob = state.onboard
    c = {
      id: id || state.supabaseUserId || 'my_profile',
      name: ob.name || state.user.name || 'Creator',
      handle: state.user?.handle ? state.user.handle.replace(/^@+/, '') : (ob.name || state.user.name || 'creator').toLowerCase().replace(/\s+/g, '_'),
      discipline: ob.discipline || 'Photography',
      subSkills: ob.subSkills?.length ? ob.subSkills : ['Commercial', 'Editorial'],
      city: ob.city || state.user.city || 'Delhi',
      area: ob.area || '',
      avatar: (state.user as any).avatar || '',
      portfolio: ob.portfolio?.length
        ? ob.portfolio
        : ((state.user as any).avatar ? [(state.user as any).avatar] : []),
      rating: 5.0,
      reviews: 0,
      startingAt: ob.startingPrice || 8000,
      yearsExp: ob.yearsExp || 3,
      completed: 0,
      rise: '+0%',
      tier: 'Rising',
      verification: 'phone',
      isPro: false,
      responseTime: '< 1 hr',
      nextSlot: 'Today',
      languages: ['Hindi', 'English'],
      tagline: '',
      availability: [],
      repeatRate: 0.9,
      travelRadius: 'city',
      gender: 'female' as Gender,
      trustScore: 80,
      availableToday: true,
      travelMode: 'both',
      igHandle: (ob as any)?.ig || null,
      ytHandle: (ob as any)?.yt || null,
      websiteUrl: (ob as any)?.web || null,
    }
  }

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

  const [[portfolioIdx, direction], setSlideState] = useState<[number, number]>([0, 0])
  const heroRef = useRef<HTMLDivElement>(null)

  const portfolio = useMemo(() => c?.portfolio || [], [c?.portfolio])
  const activePhotoIdx = portfolio.length > 0 ? Math.min(portfolioIdx, portfolio.length - 1) : 0

  const validSocials = useMemo(() => {
    if (!c) return []
    const links: { icon: typeof Instagram; label: string; url: string }[] = []
    const igUrl = normalizeSocialUrl(c.igHandle, 'instagram.com')
    if (igUrl) links.push({ icon: Instagram, label: 'Instagram', url: igUrl })

    const ytUrl = normalizeSocialUrl(c.ytHandle, 'youtube.com')
    if (ytUrl) links.push({ icon: Film, label: 'YouTube', url: ytUrl })

    const webUrl = normalizeSocialUrl(c.websiteUrl)
    if (webUrl) links.push({ icon: Globe, label: 'Website', url: webUrl })

    return links
  }, [c?.igHandle, c?.ytHandle, c?.websiteUrl])

  const paginate = (newDirection: number) => {
    if (portfolio.length <= 1) return
    setSlideState(([curr]) => {
      const next = curr + newDirection
      if (next < 0 || next >= portfolio.length) return [curr, 0]
      return [next, newDirection]
    })
  }

  const goToSlide = (idx: number) => {
    if (idx < 0 || idx >= portfolio.length) return
    setSlideState(([curr]) => [idx, idx > curr ? 1 : -1])
  }

  useEffect(() => {
    if (portfolioIdx >= portfolio.length && portfolio.length > 0) {
      setSlideState([0, 0])
    }
  }, [portfolio.length, portfolioIdx])

  const [selectedPkg, setSelectedPkg] = useState(0)
  const [currentYear, setCurrentYear] = useState(tomorrow.getFullYear())
  const [currentMonthNum, setCurrentMonthNum] = useState(tomorrow.getMonth() + 1)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(tomorrowStr)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState(false)
  const qc = useQueryClient()
  const [validatingSlot, setValidatingSlot] = useState(false)
  const [slotConflictError, setSlotConflictError] = useState<string | null>(null)

  // Canonical URL upgrade: If profile was opened via UUID, upgrade selectedCreatorId to handle
  useEffect(() => {
    if (c?.handle && state.selectedCreatorId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.selectedCreatorId)) {
      dispatch({ type: 'OPEN_CREATOR', id: c.handle.toLowerCase() })
    }
  }, [c?.handle, state.selectedCreatorId, dispatch])

  type Pkg = { id?: string; name: string; price: number; duration: string; revisions: number; delivery: string; inclusions: string[] }

  const rawServices = ((dbCreator as any)?.services && (dbCreator as any).services.length > 0)
    ? (dbCreator as any).services
    : (dbServices && dbServices.length > 0)
      ? dbServices
      : (state.onboard.builtPackages && state.onboard.builtPackages.length > 0)
        ? state.onboard.builtPackages.map(p => ({
            name: p.name,
            price: Number(p.price) || 8000,
            duration: p.duration || '2 hours',
            revisions: p.revisions || 2,
            delivery_days: parseInt(p.delivery || '7', 10),
            inclusions: p.inclusions || [],
          }))
        : []

  const packages: Pkg[] = rawServices.map((s: any) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration || '2 hours',
    revisions: s.revisions ?? 1,
    delivery: `${s.delivery_days ?? 7} days`,
    inclusions: s.inclusions ?? [],
  }))

  const hasPackages = packages.length > 0
  const activePackage: Pkg | null = hasPackages ? (packages[selectedPkg] ?? packages[0]) : null

  function formatSlotRange(startTime: string, durationMinutes: number): string {
    return formatSlotRange12h(startTime, durationMinutes)
  }

  const durMins = useMemo(() => {
    const d = (activePackage?.duration || '').toLowerCase()
    const matchHours = d.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)/i)
    if (matchHours) return Math.round(parseFloat(matchHours[1]) * 60)
    const matchMins = d.match(/(\d+)\s*(?:mins?|minutes?|m\b)/i)
    if (matchMins) return parseInt(matchMins[1], 10)
    if (d.includes('1 day') || d.includes('full day')) return 480
    return 120
  }, [activePackage?.duration])

  const packageSummary = useMemo(() => {
    const name = (activePackage?.name || '').trim()
    const dur = (activePackage?.duration || '').trim()
    if (dur && name.toLowerCase().includes(dur.toLowerCase())) {
      return name
    }
    if (name && dur && dur.toLowerCase().includes(name.toLowerCase())) {
      return dur
    }
    const cleanName = name.replace(/\b(\w+)\s+\1\b/gi, '$1')
    return dur ? `${cleanName} · ${dur}` : cleanName
  }, [activePackage?.name, activePackage?.duration])

  const monthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`
  const monthTitle = new Date(currentYear, currentMonthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })

  // Dynamic month availability cached via TanStack Query
  const { data: availData, isLoading: loadingAvail } = useMonthAvailability(c?.id, monthStr, durMins)

  // Reset selected time if package duration changes
  useEffect(() => {
    setSelectedTime(null)
  }, [selectedPkg])

  const bookDateLabel = useMemo(() => {
    if (!selectedDateKey) return ''
    const parts = selectedDateKey.split('-')
    const m = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])).toLocaleString('default', { month: 'short' })
    return `${m} ${parseInt(parts[2])}`
  }, [selectedDateKey])

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-iris border-t-transparent animate-spin" />
      <div className="text-[13px] text-obsidian/50">Loading profile…</div>
    </div>
  )
  if (!c) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="w-12 h-12 rounded-2xl bg-bone border border-line flex items-center justify-center text-obsidian/40 mb-3">
        <UserX size={20} />
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-obsidian/40 mb-1">404 · Not Found</div>
      <div className="font-display text-2xl font-light text-obsidian">Creator not found</div>
      <p className="text-[13px] text-obsidian/60 mt-1.5 max-w-xs">
        This creator profile does not exist or the link is invalid.
      </p>
      <button
        onClick={() => dispatch({ type: 'GO', screen: 'home' })}
        className="tap mt-5 px-6 py-3 rounded-2xl bg-obsidian text-paper text-[13.5px] font-semibold cursor-pointer shadow-sm hover:bg-obsidian/90 transition"
      >
        Explore FTC Creators
      </button>
    </div>
  )

  const isSaved = state.saved.includes(c.id)
  const isOwnProfile = !!(
    (state.supabaseUserId && c.id === state.supabaseUserId) ||
    (state.isCreator && state.user?.handle && c.handle.toLowerCase() === state.user.handle.replace(/^@+/, '').toLowerCase()) ||
    isSelfProfile
  )
  const isOtherCreatorViewing = Boolean(state.isAuthed && state.isCreator && !isOwnProfile)
  const bookReady = !isOwnProfile && !isOtherCreatorViewing && !!selectedDateKey && !!selectedTime

  const handleStartBooking = async () => {
    if (isOwnProfile || !hasPackages || !activePackage || !bookReady || !selectedDateKey || !selectedTime) return
    setValidatingSlot(true)
    setSlotConflictError(null)

    const draftPayload: BookingDraft = {
      creatorId: c.id,
      creatorName: c.name,
      creatorAvatar: c.avatar,
      serviceId: activePackage.id,
      service_id: activePackage.id,
      packageName: activePackage.name,
      packagePrice: activePackage.price,
      date: bookDateLabel,
      dateLabel: bookDateLabel,
      time: selectedTime ? formatSlotRange(selectedTime, durMins) : '',
      startTime: selectedTime,
      location: c.area,
      notes: '',
      duration: activePackage.duration,
      durationHours: Math.max(1, Math.round(durMins / 60)),
      dateKey: selectedDateKey,
      sessionDate: selectedDateKey,
    }

    try {
      const check = await apiClient.validateSlot(c.id, selectedDateKey, selectedTime, durMins)
      if (!check.valid) {
        const msg = check.reason || 'This time slot was just booked or blocked. Please select another slot.'
        setSlotConflictError(msg)
        qc.invalidateQueries({ queryKey: ['calendar'] })
        setSelectedTime(null)
        setValidatingSlot(false)
        return
      }

      if (!state.isAuthed) {
        try {
          localStorage.setItem('ftc_pending_booking_draft', JSON.stringify(draftPayload))
        } catch {}
        dispatch({ type: 'START_BOOKING', draft: draftPayload })
        dispatch({ type: 'GO', screen: 'login' })
        return
      }

      dispatch({
        type: 'START_BOOKING',
        draft: draftPayload,
      })
    } catch {
      // If validation call fails, proceed gracefully
      if (!state.isAuthed) {
        try {
          localStorage.setItem('ftc_pending_booking_draft', JSON.stringify(draftPayload))
        } catch {}
        dispatch({ type: 'START_BOOKING', draft: draftPayload })
        dispatch({ type: 'GO', screen: 'login' })
        return
      }
      dispatch({
        type: 'START_BOOKING',
        draft: draftPayload,
      })
    } finally {
      setValidatingSlot(false)
    }
  }

  const activeDayAvail = selectedDateKey && availData?.days ? availData.days[selectedDateKey] : null
  const daySlots: string[] = activeDayAvail?.slots ?? []

  const packagesBlock = (
    <div className="px-5 py-5 border-b border-line">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Packages</div>
      {!hasPackages ? (
        <div className="p-4 rounded-2xl bg-bone/70 border border-line text-center space-y-1 mt-2">
          <div className="font-display text-[14px] text-obsidian/80">No standard packages listed yet</div>
          <p className="text-[12px] text-obsidian/50 max-w-sm mx-auto">
            This creator has not published standard booking packages. Direct quote inquiries will be available soon.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-2">
          {packages.map((p, i) => (
            <button key={p.id ?? i} onClick={() => setSelectedPkg(i)} className={cn('tap w-full text-left p-4 rounded-2xl border-2 transition-colors', selectedPkg === i ? 'border-obsidian bg-obsidian text-paper' : 'border-line bg-paper')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg">{p.name}</span>
                    {i === 1 && <span className="px-1.5 py-0.5 rounded bg-acid text-obsidian text-[9px] font-mono uppercase">Popular</span>}
                  </div>
                  <div className={cn('text-[11px] mt-0.5', selectedPkg === i ? 'text-paper/60' : 'text-obsidian/60')}>
                    {p.duration} · {p.revisions} revision{p.revisions > 1 ? 's' : ''} · {p.delivery}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl tracking-tight tnum">{inr(p.price)}</div>
                  <div className={cn('text-[10px] font-medium', selectedPkg === i ? 'text-acid' : 'text-iris')}>
                    {depositInfo(p.price).full ? 'Pay in full · escrow' : depositInfo(p.price).pct + '% to reserve'}
                  </div>
                </div>
              </div>
              {selectedPkg === i && p.inclusions.length > 0 && (
                <ul className="mt-3 pt-3 border-t border-paper/20 space-y-1">
                  {p.inclusions.map(inc => (
                    <li key={inc} className="text-[11px] flex items-center gap-2"><Check size={12} className="text-acid" />{inc}</li>
                  ))}
                </ul>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // Calendar month days calculation (leap year safe)
  const firstDayOfMonth = new Date(currentYear, currentMonthNum - 1, 1).getDay() // 0 = Sun
  const offset = (firstDayOfMonth + 6) % 7 // Align Monday = 0
  const daysInMonth = new Date(currentYear, currentMonthNum, 0).getDate()
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const isCurrentOrPastMonth = currentYear < now.getFullYear() || (currentYear === now.getFullYear() && currentMonthNum <= now.getMonth() + 1)

  const prevMonth = () => {
    if (isCurrentOrPastMonth) return
    if (currentMonthNum === 1) {
      setCurrentMonthNum(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonthNum(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonthNum === 12) {
      setCurrentMonthNum(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonthNum(m => m + 1)
    }
  }

  const calendarBlock = (
    <div className="px-5 py-5 border-b border-line">
      {/* Month Header & Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg tracking-tight">{monthTitle}</span>
          {loadingAvail && <Loader2 size={13} className="animate-spin text-obsidian/40" />}
        </div>
        <div className="flex items-center gap-1 bg-bone p-1 rounded-xl border border-line">
          <button
            onClick={prevMonth}
            disabled={isCurrentOrPastMonth}
            className={cn(
              "tap w-7 h-7 rounded-lg grid place-items-center transition",
              isCurrentOrPastMonth ? "text-obsidian/20 cursor-not-allowed" : "hover:bg-paper text-obsidian/70"
            )}
            title={isCurrentOrPastMonth ? "Cannot view past months" : "Previous month"}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={nextMonth}
            className="tap w-7 h-7 rounded-lg grid place-items-center hover:bg-paper text-obsidian/70 transition"
            title="Next month"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-obsidian/60 mb-2 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Open</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-iris" /> Custom Hours</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-obsidian/20" /> Day Off</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" /> Unavailable</span>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1.5 text-center mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-[10px] font-mono text-obsidian/40 py-0.5">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loadingAvail ? (
        <div className="grid grid-cols-7 gap-1.5 place-items-center animate-pulse">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={'offset-' + i} className="w-8 h-8" />
          ))}
          {monthDays.map(d => (
            <div
              key={d}
              className="w-8 h-8 rounded-xl bg-bone/60 border border-line/40 flex items-center justify-center text-[11px] font-medium text-obsidian/25"
            >
              {d}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5 place-items-center">
          {Array.from({ length: offset }).map((_, i) => (
            <div key={'offset-' + i} className="w-8 h-8" />
          ))}
          {monthDays.map(d => {
            const dateKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dayInfo = availData?.days?.[dateKey]
            const isPast = dateKey < todayStr
            const isToday = dateKey === todayStr
            const isDayOff = !isPast && !isToday && (dayInfo ? (dayInfo.status === 'blocked' && (dayInfo.reason === 'Day off' || dayInfo.reason === null)) : false)
            const isBlockedOverride = !isPast && !isToday && (dayInfo ? (dayInfo.status === 'blocked' && dayInfo.reason !== 'Day off' && dayInfo.reason !== null) : false)
            const isAvailable = !isPast && !isToday && !isDayOff && !isBlockedOverride && (dayInfo ? dayInfo.status === 'available' : true)
            const isBooked = !isPast && !isToday && (dayInfo ? dayInfo.status === 'booked' : false)
            const isSelected = selectedDateKey === dateKey
            const hasCustomHours = !isPast && !isToday && !!dayInfo?.is_custom_hours

            return (
              <button
                key={d}
                disabled={isPast || isToday || isDayOff || isBlockedOverride}
                onClick={() => {
                  setSelectedDateKey(dateKey)
                  setSelectedTime(null)
                }}
                title={isToday ? 'Same-day booking unavailable (24h advance notice required)' : undefined}
                className={cn(
                  'w-8 h-8 rounded-xl text-[12px] font-medium tnum flex items-center justify-center transition-all relative cursor-pointer',
                  isSelected && 'bg-obsidian text-paper font-semibold shadow-md ring-2 ring-iris/40',
                  !isSelected && isPast && 'bg-obsidian/[0.02] text-obsidian/20 cursor-not-allowed',
                  !isSelected && isToday && 'ring-1 ring-obsidian/25 text-obsidian/40 bg-obsidian/[0.02] cursor-not-allowed',
                  !isSelected && !isPast && !isToday && isDayOff && 'bg-obsidian/10 text-obsidian/35 cursor-not-allowed',
                  !isSelected && !isPast && !isToday && isBlockedOverride && 'bg-rose-100 text-rose-800 font-semibold line-through cursor-not-allowed',
                  !isSelected && !isPast && !isToday && isAvailable && 'bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-950 font-semibold',
                  !isSelected && !isPast && !isToday && isBooked && 'bg-obsidian/10 text-obsidian/40 hover:bg-obsidian/20'
                )}
              >
                {d}
                {hasCustomHours && !isSelected && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-iris ring-1 ring-paper" title="Custom creator hours" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Time Slot Picker grouped by time of day */}
      {selectedDateKey && (
        <div className="mt-4 pt-4 border-t border-line space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/60">
              Shoot Windows for {bookDateLabel}
            </div>
            <span className="text-[10px] font-mono text-iris bg-iris/10 px-2 py-0.5 rounded-full">
              24h confirmation SLA
            </span>
          </div>

          {loadingAvail ? (
            <div className="space-y-2.5 animate-pulse pt-1">
              <div className="flex items-center justify-between text-[11px] text-obsidian/40 font-medium mb-1">
                <div className="h-3 w-32 bg-bone rounded" />
                <div className="h-2.5 w-20 bg-bone/70 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-bone/60 border border-line/40" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Custom Hours Banner */}
              {activeDayAvail?.is_custom_hours && (
                <div className="rounded-xl bg-iris/10 border border-iris/25 p-2.5 text-[11.5px] text-iris flex items-center justify-between gap-2 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0" />
                    <span>
                      <strong className="font-semibold">Special Hours:</strong>{' '}
                      {activeDayAvail?.custom_start_time && activeDayAvail?.custom_end_time
                        ? `${activeDayAvail.custom_start_time} – ${activeDayAvail.custom_end_time}`
                        : 'Adjusted creator hours'}
                      {activeDayAvail?.reason ? ` · ${activeDayAvail.reason}` : ''}
                    </span>
                  </div>
                </div>
              )}

              {activeDayAvail?.status === 'blocked' ? (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-center space-y-1 text-rose-900 animate-fade-in">
                  <div className="text-[12px] font-semibold flex items-center justify-center gap-1.5">
                    <Lock size={13} className="text-rose-600" />
                    <span>Date Unavailable</span>
                  </div>
                  <div className="text-[11.5px] text-rose-800/80">
                    {activeDayAvail?.reason || 'The creator is not accepting bookings on this date.'}
                  </div>
                </div>
              ) : activeDayAvail?.status === 'unavailable' ? (
                <div className="rounded-xl bg-bone border border-line p-3.5 text-center space-y-1 text-obsidian/70 animate-fade-in">
                  <div className="text-[12px] font-semibold flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-obsidian/40" />
                    <span>24h Advance Notice Required</span>
                  </div>
                  <div className="text-[11.5px] text-obsidian/60">
                    {activeDayAvail?.reason || 'Same-day bookings are unavailable. All bookings require at least 24 hours advance notice.'}
                  </div>
                </div>
              ) : activeDayAvail?.status === 'booked' ? (
                <div className="rounded-xl bg-bone border border-line p-3.5 text-center space-y-1 text-obsidian/70 animate-fade-in">
                  <div className="text-[12px] font-semibold flex items-center justify-center gap-1.5">
                    <Clock size={13} className="text-obsidian/40" />
                    <span>Fully Booked</span>
                  </div>
                  <div className="text-[11.5px] text-obsidian/50">
                    {activeDayAvail?.reason || 'All shoot windows on this date have already been reserved.'}
                  </div>
                </div>
              ) : (daySlots.length === 0 && (!activeDayAvail?.slots_detail || activeDayAvail.slots_detail.length === 0)) ? (
                <div className="rounded-xl bg-bone p-3.5 text-center text-[12px] text-obsidian/60 border border-line">
                  {activeDayAvail?.reason || 'No open slots fit this package duration on this date. Try another day or package.'}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-obsidian/50 font-medium mb-2">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-iris" />
                      <span>Available & Booked Slots</span>
                    </div>
                    <span className="font-mono text-[10px] text-obsidian/40">24h Notice Applied</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {activeDayAvail?.slots_detail && activeDayAvail.slots_detail.length > 0 ? (
                      activeDayAvail.slots_detail.map(slot => {
                        const isAvailable = slot.is_available
                        const isSelected = selectedTime === slot.time
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setSelectedTime(slot.time)}
                            className={cn(
                              'py-2.5 px-3 rounded-xl text-[11.5px] sm:text-[12px] font-medium tnum tracking-tight transition border text-center flex items-center justify-center whitespace-nowrap',
                              isAvailable
                                ? (isSelected
                                    ? 'bg-obsidian text-paper border-obsidian font-semibold shadow-xs cursor-pointer tap'
                                    : 'bg-bone border-line text-obsidian/85 hover:border-obsidian/40 cursor-pointer tap')
                                : 'bg-obsidian/[0.04] border-line/60 text-obsidian/30 line-through cursor-not-allowed select-none opacity-50'
                            )}
                            title={!isAvailable ? (slot.reason || 'Slot not available') : undefined}
                          >
                            {formatSlotRange(slot.time, durMins)}
                          </button>
                        )
                      })
                    ) : (
                      daySlots.map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          className={cn(
                            'tap py-2.5 px-3 rounded-xl text-[11.5px] sm:text-[12px] font-medium tnum tracking-tight transition border text-center cursor-pointer flex items-center justify-center whitespace-nowrap',
                            selectedTime === t
                              ? 'bg-obsidian text-paper border-obsidian font-semibold shadow-xs'
                              : 'bg-bone border-line text-obsidian/80 hover:border-obsidian/30'
                          )}
                        >
                          {formatSlotRange(t, durMins)}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!selectedDateKey && (
        <div className="mt-3 text-[11px] text-obsidian/45 flex items-center gap-1.5">
          <Clock size={12} />
          Pick an available date to view open {activePackage ? activePackage.duration : 'session'} windows
        </div>
      )}
    </div>
  )

  const desktopCta = (
    <div className="p-5 pt-4 border-t border-line bg-paper">
      {slotConflictError && (
        <div className="mb-2.5 px-3.5 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[11px] flex items-center gap-2 animate-fade-in leading-tight">
          <AlertCircle size={14} className="shrink-0" />
          <span>{slotConflictError}</span>
        </div>
      )}
      {bookReady && (
        <div className="flex items-center gap-1.5 mb-2.5 text-[11px] text-obsidian/60">
          <CalendarCheck size={12} className="text-success" />
          {bookDateLabel} · {selectedTime ? formatSlotRange(selectedTime, durMins) : ''} · {packageSummary}
        </div>
      )}
      <div className="flex gap-2.5 items-center">
        <button
          disabled
          className="tap w-12 h-12 rounded-2xl grid place-items-center shrink-0 border border-line/60 bg-obsidian/5 text-obsidian/30 opacity-40 cursor-not-allowed"
          title="Direct messaging coming soon"
          aria-label="Direct messaging coming soon"
        >
          <MessageCircle size={19} />
        </button>
        {isOwnProfile ? (
          <button
            disabled
            className="tap flex-1 py-3.5 rounded-2xl font-semibold text-[13px] bg-obsidian/10 text-obsidian/50 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Your Profile (Preview Mode)</span>
          </button>
        ) : !hasPackages ? (
          <button
            disabled
            className="tap flex-1 py-3.5 rounded-2xl font-semibold text-[13px] bg-obsidian/10 text-obsidian/40 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span>Get a Quote (Coming Soon)</span>
          </button>
        ) : (
          <button
            disabled={!bookReady || validatingSlot}
            onClick={handleStartBooking}
            className={cn('tap flex-1 py-3.5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-all', bookReady && !validatingSlot ? 'bg-obsidian text-paper cursor-pointer' : 'bg-bone text-obsidian/40 cursor-not-allowed')}
          >
            {validatingSlot ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Verifying slot…</span>
              </>
            ) : !bookReady ? (
              'Select date & time'
            ) : (
              <>
                <span>Request to Book</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden relative">
      {/* Owner Preview Mode Top Banner */}
      {isOwnProfile && (
        <aside aria-label="Profile preview banner" className="shrink-0 z-30 bg-bone border-b border-line px-4 py-2.5 flex items-center justify-between gap-3 text-obsidian">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-iris shrink-0" />
            <span className="text-[11.5px] font-medium text-obsidian/80 truncate">
              Public Profile Preview <span className="hidden sm:inline text-obsidian/45">· Viewing as a client</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => dispatch({ type: 'GO', screen: 'settings' })}
              className="tap px-2.5 py-1 rounded-md border border-line bg-paper text-[10.5px] font-mono uppercase tracking-wider text-obsidian/70 hover:text-obsidian hover:border-obsidian/30 transition cursor-pointer"
            >
              Edit Profile
            </button>
            <button
              onClick={() => dispatch({ type: 'GO', screen: 'home' })}
              className="tap px-2.5 py-1 rounded-md bg-obsidian text-paper text-[10.5px] font-mono uppercase tracking-wider hover:bg-obsidian/90 transition cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </aside>
      )}

      {/* Creator Mode Visiting Gate Modal */}
      {isOtherCreatorViewing && (
        <div className="fixed inset-0 z-50 bg-obsidian/60 backdrop-blur-xs flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-paper border border-line p-6 shadow-2xl text-center space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-obsidian/50">
              Creator Mode Active
            </div>
            <div className="font-display text-2xl font-light text-obsidian tracking-tight">
              Switch to client mode to view this profile
            </div>
            <p className="text-[13px] text-obsidian/60 leading-relaxed">
              You are currently browsing in Creator Mode. Switch to Client Mode to explore creators and book services.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => dispatch({ type: 'SET_ROLE', isCreator: false })}
                className="tap w-full py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[13.5px] cursor-pointer hover:bg-obsidian/90 transition shadow-sm"
              >
                Switch to Client Mode
              </button>
              <button
                onClick={() => dispatch({ type: 'GO', screen: 'home' })}
                className="tap w-full py-2.5 text-[12px] text-obsidian/50 hover:text-obsidian font-mono uppercase tracking-wider transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex-1 min-h-0 flex flex-col">
        <div className="absolute top-0 inset-x-0 z-30 px-5 py-3 md:px-8 md:py-4 flex items-center justify-between pointer-events-none max-w-6xl mx-auto">
          <button onClick={() => dispatch({ type: 'BACK' })} className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow-md"><ArrowLeft size={18} /></button>
          <div className="flex gap-2">
          <button
            onClick={() => {
              if (!state.isAuthed) {
                dispatch({ type: 'GO', screen: 'login' })
                return
              }
              dispatch({ type: 'TOGGLE_SAVE', id: c.id })
            }}
            className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow-md cursor-pointer"
            title={!state.isAuthed ? 'Sign in to save' : undefined}
          >
            <Heart size={16} className={isSaved ? 'fill-danger text-danger' : ''} />
          </button>
          <button
            onClick={async () => {
              const url = getProfileUrl(c.handle)
              if (navigator.clipboard?.writeText) {
                try {
                  await navigator.clipboard.writeText(url)
                  setShareToast(true)
                  setTimeout(() => setShareToast(false), 2000)
                  return
                } catch {}
              }
              const res = await shareOrCopy({
                title: `${c.name} on FTC`,
                url,
              })
              if (res === 'copied') {
                setShareToast(true)
                setTimeout(() => setShareToast(false), 2000)
              }
            }}
            className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow-md cursor-pointer hover:bg-paper transition-colors"
            title="Share or copy profile link"
            aria-label="Share profile"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
      {shareToast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-obsidian text-paper text-[12px] font-medium shadow-2xl flex items-center gap-2" style={{ bottom: 96 }}>
          <Check size={14} className="text-acid" /> Profile link copied
        </div>
      )}

      <div className="app-scroll pb-28 md:pb-12">
      <div className="md:grid md:grid-cols-[1fr_380px] md:gap-8 md:items-start md:px-6 md:pt-6 max-w-6xl mx-auto w-full">
      <div className="md:min-w-0 md:rounded-3xl md:border md:border-line md:bg-paper md:overflow-hidden md:shadow-xs">
        {/* Hero */}
        <div ref={heroRef} className="relative aspect-[4/5] bg-obsidian overflow-hidden group touch-pan-y select-none md:rounded-t-3xl">
          {portfolio.length === 0 ? (
            <div className="w-full h-full bg-obsidian flex flex-col items-center justify-center text-paper/40 p-6 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-paper/10 border border-paper/10 flex items-center justify-center text-paper/60 mb-3">
                <Briefcase size={28} className="text-paper/40" />
              </div>
              <div className="font-display text-xl text-paper/90">{c.name}</div>
              <div className="text-[12px] text-paper/50 mt-1">{c.discipline}{c.city ? ` · ${c.city}` : ''}</div>
            </div>
          ) : (
            <>
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={activePhotoIdx}
                  src={portfolio[activePhotoIdx]}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 350, damping: 32 },
                    opacity: { duration: 0.18 },
                  }}
                  drag={portfolio.length > 1 ? 'x' : false}
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onTap={(_, info) => {
                    if (portfolio.length <= 1) return
                    const rect = heroRef.current?.getBoundingClientRect()
                    if (!rect) return
                    const tapX = info.point.x - rect.left
                    if (tapX < rect.width * 0.35) {
                      if (activePhotoIdx > 0) paginate(-1)
                    } else {
                      if (activePhotoIdx < portfolio.length - 1) paginate(1)
                    }
                  }}
                  onDragEnd={(_, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x
                    if (offset.x < -40 || swipe < -6000) {
                      if (activePhotoIdx < portfolio.length - 1) paginate(1)
                    } else if (offset.x > 40 || swipe > 6000) {
                      if (activePhotoIdx > 0) paginate(-1)
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-auto"
                  alt={c.name}
                />
              </AnimatePresence>

              {/* Gradient scrim for text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-obsidian/40 via-transparent to-obsidian/85 pointer-events-none z-10" />

              {/* Segmented bar indicators + Counter pill */}
              {portfolio.length > 1 && (
                <>
                  <div className="absolute top-2.5 right-3.5 left-3.5 z-20 flex gap-1 pointer-events-auto">
                    {portfolio.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation()
                          goToSlide(i)
                        }}
                        className={cn(
                          'flex-1 h-1 rounded-full transition-all duration-200 cursor-pointer',
                          i === activePhotoIdx ? 'bg-paper shadow-sm' : 'bg-paper/30 hover:bg-paper/50'
                        )}
                        aria-label={`Go to photo ${i + 1}`}
                      />
                    ))}
                  </div>
                  <div className="absolute top-5 right-4 z-20 px-2 py-0.5 rounded-full bg-obsidian/60 backdrop-blur-md border border-paper/10 text-[10px] font-mono text-paper/80 tnum pointer-events-none">
                    {activePhotoIdx + 1} / {portfolio.length}
                  </div>

                  {/* Desktop hover arrows */}
                  {activePhotoIdx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        paginate(-1)
                      }}
                      className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-paper/90 hover:bg-paper text-obsidian backdrop-blur items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  {activePhotoIdx < portfolio.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        paginate(1)
                      }}
                      className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-paper/90 hover:bg-paper text-obsidian backdrop-blur items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Identity info overlay */}
          <div className="absolute bottom-0 inset-x-0 p-5 text-paper z-20 pointer-events-none">
            {(c.verification === 'vetted' || c.verification === 'id') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper/90 text-obsidian text-[10px] font-mono uppercase tracking-[0.1em] mb-2 shadow-sm">
                <BadgeCheck size={11} className="text-iris" /> Verified
              </span>
            )}
            <h1 className="font-display text-4xl tracking-tight leading-none">{c.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-[12px] opacity-80">
              <span>{c.handle}</span>
              {(c.area || c.city) && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1"><MapPin size={11} />{[c.area, c.city].filter(Boolean).join(', ')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-5 border-b border-line grid grid-cols-3 gap-3">
          <Stat value={c.reviews > 0 ? c.rating.toFixed(1) : 'New'} label="Rating" />
          <Stat value={c.completed || 0} label="Projects" />
          <Stat value={c.yearsExp || 1} label="Experience" unit="yr" />
        </div>

        {/* Tagline + skills */}
        <div className="px-5 py-5 border-b border-line">
          {c.tagline?.trim() && (
            <div className="mb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Tagline</div>
              <p className="font-display text-xl tracking-tight leading-tight">{c.tagline.trim()}</p>
            </div>
          )}
          {c.subSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {c.subSkills.map(s => <span key={s} className="px-2.5 py-1 rounded-full bg-bone text-[11px] border border-line">{s}</span>)}
            </div>
          )}
          <div className={cn("space-y-2", c.subSkills?.length > 0 && "mt-4")}>
            <div className="flex items-center gap-2 text-[12px] text-obsidian/70">
              <Volume2 size={14} className="text-iris shrink-0" />
              <span><span className="text-obsidian/45">Speaks </span>{c.languages?.length ? c.languages.join(', ') : 'English, Hindi'}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-obsidian/70">
              <MapPin size={14} className="text-iris shrink-0" />
              <span><span className="text-obsidian/45">Works </span>{c.travelMode === 'both' ? 'studio & travels to you' : c.travelMode === 'travel' ? 'travels to you' : 'at their studio'}</span>
            </div>
          </div>
        </div>

        {/* Social links — rendered only when valid links exist */}
        {validSocials.length > 0 && (
          <div className="px-5 py-3.5 border-b border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {validSocials.map(({ icon: Icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="tap w-9 h-9 rounded-xl bg-bone border border-line grid place-items-center hover:bg-obsidian/5 transition-colors cursor-pointer text-obsidian/70 hover:text-obsidian"
                  aria-label={label}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
            {(c.verification === 'id' || c.verification === 'vetted') && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                <BadgeCheck size={13} /> Verified
              </span>
            )}
          </div>
        )}

        {/* Packages — mobile inline position (hidden on desktop, shown in sidebar instead) */}
        <div className="md:hidden">
          {packagesBlock}
          {calendarBlock}
        </div>

        {/* Reviews */}
        <div className="px-5 py-5 border-b border-line md:border-b-0">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">
              Client Reviews {c.reviews > 0 ? `(${c.reviews})` : ''}
            </div>
            {c.reviews > 0 && (
              <span className="text-[11px] font-medium text-obsidian/60 flex items-center gap-1">
                <Star size={11} className="fill-obsidian text-obsidian" /> {c.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-bone/70 border border-line text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-paper border border-line mx-auto grid place-items-center mb-2">
              <Star size={16} className="text-obsidian/30" />
            </div>
            <div className="font-display text-[15px] text-obsidian/90">No client reviews yet</div>
            <p className="text-[12px] text-obsidian/50 max-w-xs mx-auto leading-relaxed">
              Reviews will appear here after completed bookings with escrow protection.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop booking rail — sticky, mirrors the mobile packages/calendar/CTA flow */}
      <div className="hidden md:block md:sticky md:top-6">
        <div className="rounded-3xl border border-line bg-paper overflow-hidden shadow-xs">
          {packagesBlock}
          {calendarBlock}
          {desktopCta}
        </div>
      </div>
      </div>
      </div>

      {/* Sticky bottom CTA — mobile only; desktop uses the sidebar CTA above */}
      <div className="md:hidden absolute bottom-0 inset-x-0 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] bg-paper/95 backdrop-blur-xl border-t border-line z-20">
        {slotConflictError && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[11px] flex items-center gap-1.5 animate-fade-in leading-tight">
            <AlertCircle size={13} className="shrink-0" />
            <span>{slotConflictError}</span>
          </div>
        )}
        {bookReady && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-obsidian/60">
            <CalendarCheck size={12} className="text-success" />
            {bookDateLabel} · {selectedTime ? formatSlotRange(selectedTime, durMins) : ''} · {packageSummary}
          </div>
        )}
        <div className="flex gap-2">
          <button
            disabled
            className="tap w-14 rounded-2xl grid place-items-center bg-obsidian/5 text-obsidian/30 opacity-40 cursor-not-allowed"
            title="Direct messaging coming soon"
            aria-label="Direct messaging coming soon"
          >
            <MessageCircle size={19} />
          </button>
          {isOwnProfile ? (
            <button
              disabled
              className="tap flex-1 py-3.5 rounded-2xl font-semibold text-[13px] bg-obsidian/10 text-obsidian/50 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Your Profile (Preview Mode)</span>
            </button>
          ) : !hasPackages ? (
            <button
              disabled
              className="tap flex-1 py-3.5 rounded-2xl font-semibold text-[13px] bg-obsidian/10 text-obsidian/40 cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Get a Quote (Coming Soon)</span>
            </button>
          ) : (
            <button
              disabled={!bookReady || validatingSlot}
              onClick={handleStartBooking}
              className={cn('tap flex-1 py-3.5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-all', bookReady && !validatingSlot ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/40')}
            >
              {validatingSlot ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying slot…</span>
                </>
              ) : !bookReady ? (
                'Select date & time'
              ) : (
                <>
                  <span>Request to Book</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
