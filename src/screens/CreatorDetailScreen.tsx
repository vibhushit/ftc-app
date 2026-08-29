import { useState } from 'react'
import { ArrowLeft, Heart, Share2, MapPin, BadgeCheck, Shield, Check, Star, Clock, ChevronRight, MessageCircle, HelpCircle, Volume2, Coffee, ArrowRight, CalendarCheck, Instagram, Film, Briefcase, Globe, Link2 } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { pic, inr } from '@/data/constants'
import { cn } from '@/utils'
import { useCreator, useCreatorServices } from '@/hooks/useCreators'
import type { CreatorWithUser } from '@/lib/database.types'
import type { Tier, Verification, Gender, TravelMode, TravelRadius, Creator } from '@/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function dbToCreatorFull(db: CreatorWithUser): Creator {
  return {
    id:           db.id,
    name:         db.users.name,
    handle:       db.handle,
    discipline:   db.discipline,
    subSkills:    db.sub_skills,
    city:         db.city,
    area:         db.area,
    avatar:       db.users.avatar_url ?? pic(db.users.name + '-av', 200, 200),
    portfolio:    db.portfolio_urls?.length
                    ? db.portfolio_urls
                    : [pic(db.users.name + '-1', 1200, 1500), pic(db.users.name + '-2', 1200, 1200)],
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
    oneOnOne:     { name: '1:1 Call', mins: 30, price: 999, type: 'Video call', today: false },
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

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM']

export function CreatorDetailScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const id = state.selectedCreatorId
  const { data: dbCreator, isLoading } = useCreator(id)
  const { data: dbServices }           = useCreatorServices(id)

  let c: Creator | undefined = dbCreator ? dbToCreatorFull(dbCreator) : (CREATORS.find(x => x.id === id))

  // Fallback for newly created creator viewing their own profile
  if (!c && (id === state.supabaseUserId || id === state.user.handle || (state.isCreator && state.user.name))) {
    const ob = state.onboard
    c = {
      id: id || state.supabaseUserId || 'my_profile',
      name: ob.name || state.user.name || 'Creator',
      handle: state.user.handle || `@${(ob.name || state.user.name || 'creator').toLowerCase().replace(/\s+/g, '_')}`,
      discipline: ob.discipline || 'Photography',
      subSkills: ob.subSkills?.length ? ob.subSkills : ['Commercial', 'Editorial'],
      city: ob.city || state.user.city || 'Delhi',
      area: ob.area || '',
      avatar: state.user.avatar || pic(state.user.name + '-av', 200, 200),
      portfolio: ob.portfolio?.length ? ob.portfolio : [pic('my-1', 1200, 1500), pic('my-2', 1200, 1200)],
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
      gender: 'prefer_not_to_say',
      trustScore: 80,
      availableToday: true,
      travelMode: 'both',
      oneOnOne: { name: '1:1 Call', mins: 30, price: 999, type: 'Video call', today: false },
    }
  }

  const [portfolioIdx, setPortfolioIdx] = useState(0)
  const [selectedPkg, setSelectedPkg] = useState(1)
  const [selectedDate, setSelectedDate] = useState<number | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [shareToast, setShareToast] = useState(false)

  if (isLoading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-iris border-t-transparent animate-spin" />
      <div className="text-[13px] text-obsidian/50">Loading profile…</div>
    </div>
  )
  if (!c) return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="text-4xl mb-3">👤</div>
      <div className="font-display text-xl">Creator not found</div>
      <button onClick={() => dispatch({ type: 'BACK' })} className="tap mt-4 px-5 py-3 rounded-2xl bg-obsidian text-paper text-[14px] font-semibold">← Back</button>
    </div>
  )

  type Pkg = { name: string; price: number; duration: string; revisions: number; delivery: string; inclusions: string[] }
  const packages: Pkg[] = dbServices && dbServices.length > 0
    ? dbServices.map(s => ({ name: s.name, price: s.price, duration: s.duration, revisions: s.revisions, delivery: `${s.delivery_days} days`, inclusions: s.inclusions }))
    : [
        { name: 'Starter',  price: c.startingAt,                     duration: '2 hours', revisions: 1, delivery: '7 days',  inclusions: ['Up to 30 edited photos', 'Digital delivery', '1 location'] },
        { name: 'Standard', price: Math.round(c.startingAt * 2.5),   duration: '4 hours', revisions: 2, delivery: '10 days', inclusions: ['Up to 80 edited photos', 'Digital + print', '2 locations'] },
        { name: 'Premium',  price: Math.round(c.startingAt * 6),     duration: '8 hours', revisions: 4, delivery: '14 days', inclusions: ['Unlimited photos', 'Album + print', 'Multiple locations'] },
      ]

  const isSaved = state.saved.includes(c.id)
  const bookDateLabel = selectedDate === null ? '' : ((23 + selectedDate) > 30 ? 'May ' + (23 + selectedDate - 30) : 'Apr ' + (23 + selectedDate))
  const bookReady = selectedDate !== null && !!selectedTime
  const dep = depositInfo(packages[selectedPkg].price)

  const packagesBlock = (
    <div className="px-5 py-5 border-b border-line">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1.5">Packages</div>
      <div className="flex items-start gap-1.5 mb-3 text-[11px] text-obsidian/55 leading-snug">
        <HelpCircle size={13} className="text-iris shrink-0 mt-0.5" />
        <span>FTC Secure escrow — quick gigs paid in full; bigger projects take a deposit with balance due on delivery.</span>
      </div>
      <div className="space-y-2">
        {packages.map((p, i) => (
          <button key={i} onClick={() => setSelectedPkg(i)} className={cn('tap w-full text-left p-4 rounded-2xl border-2 transition-colors', selectedPkg === i ? 'border-obsidian bg-obsidian text-paper' : 'border-line bg-paper')}>
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
            {selectedPkg === i && (
              <ul className="mt-3 pt-3 border-t border-paper/20 space-y-1">
                {p.inclusions.map(inc => (
                  <li key={inc} className="text-[11px] flex items-center gap-2"><Check size={12} className="text-acid" />{inc}</li>
                ))}
              </ul>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  const calendarBlock = (
    <div className="px-5 py-5 border-b border-line">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Next 28 days</div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-acid" /> Open</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-obsidian/10" /> Booked</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DAYS.map((d, i) => <div key={i} className="text-[10px] font-mono text-obsidian/40 py-1">{d}</div>)}
        {c.availability.map((avail, i) => {
          const date = 23 + i
          const isSelected = selectedDate === i
          return (
            <button
              key={i}
              disabled={!avail}
              onClick={() => { setSelectedDate(i); setSelectedTime(null) }}
              className={cn('aspect-square rounded-lg text-[12px] font-medium transition-all tnum',
                !avail && 'text-obsidian/20 bg-obsidian/5',
                !!avail && !isSelected && 'bg-acid/30 hover:bg-acid/50',
                isSelected && 'bg-obsidian text-paper')}
            >
              {date > 30 ? date - 30 : date}
            </button>
          )
        })}
      </div>
      {selectedDate !== null && (
        <div className="mt-4 pt-4 border-t border-line">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2.5">Pick a time</div>
          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map(t => (
              <button key={t} onClick={() => setSelectedTime(t)} className={cn('tap py-2.5 rounded-xl text-[12px] font-medium transition border', selectedTime === t ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line text-obsidian/70')}>{t}</button>
            ))}
          </div>
        </div>
      )}
      {selectedDate === null && (
        <div className="mt-3 text-[11px] text-obsidian/45 flex items-center gap-1.5"><Clock size={12} />Pick a date to see open time slots</div>
      )}
    </div>
  )

  const desktopCta = (
    <div className="px-5 pb-5">
      {bookReady && (
        <div className="flex items-center gap-1.5 mb-2 text-[11px] text-obsidian/60">
          <CalendarCheck size={12} className="text-success" />
          {bookDateLabel} · {selectedTime} · {packages[selectedPkg].name}
        </div>
      )}
      <button
        disabled={!bookReady}
        onClick={() => dispatch({ type: 'START_BOOKING', draft: { creatorId: c.id, creatorName: c.name, creatorAvatar: c.avatar, packageName: packages[selectedPkg].name, packagePrice: packages[selectedPkg].price, date: bookDateLabel, time: selectedTime ?? '', location: c.area, notes: '' } })}
        className={cn('tap w-full py-3.5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2', bookReady ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/40')}
      >
        {!bookReady ? 'Select date & time' : `${dep.full ? 'Book' : 'Reserve'} · ${inr(dep.advance)}`}
        {bookReady && <ArrowRight size={16} />}
      </button>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <div className="absolute top-0 inset-x-0 z-20 px-5 py-3 flex items-center justify-between pointer-events-none">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow-md"><ArrowLeft size={18} /></button>
        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: 'TOGGLE_SAVE', id: c.id })} className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow-md">
            <Heart size={16} className={isSaved ? 'fill-danger text-danger' : ''} />
          </button>
          <button onClick={() => { try { navigator.clipboard?.writeText('https://ftc.app/' + c.handle) } catch {} setShareToast(true); setTimeout(() => setShareToast(false), 1800) }} className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow-md">
            <Share2 size={16} />
          </button>
        </div>
      </div>
      {shareToast && (
        <div className="absolute left-1/2 -translate-x-1/2 z-30 px-4 py-2.5 rounded-full bg-obsidian text-paper text-[12px] font-medium shadow-2xl flex items-center gap-2" style={{ bottom: 96 }}>
          <Check size={14} className="text-acid" /> Profile link copied
        </div>
      )}

      <div className="app-scroll pb-28 md:pb-8">
      <div className="md:grid md:grid-cols-[1fr_380px] md:gap-6 md:items-start md:px-6 md:pt-6">
      <div className="md:min-w-0">
        {/* Hero */}
        <div className="relative aspect-[4/5] bg-obsidian overflow-hidden">
          <img src={c.portfolio[portfolioIdx]} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian/40 via-transparent to-obsidian/80" />
          <div className="absolute top-2 right-2 left-2 flex gap-1">
            {c.portfolio.map((_, i) => (
              <button key={i} onClick={() => setPortfolioIdx(i)} className={cn('flex-1 h-0.5 rounded-full', i === portfolioIdx ? 'bg-paper' : 'bg-paper/30')} />
            ))}
          </div>
          <div className="absolute bottom-0 inset-x-0 p-5 text-paper">
            {(c.verification === 'vetted' || c.verification === 'id') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper/90 text-obsidian text-[10px] font-mono uppercase tracking-[0.1em] mb-2">
                <BadgeCheck size={11} className="text-iris" /> Verified
              </span>
            )}
            <h1 className="font-display text-4xl tracking-tight leading-none">{c.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-[12px] opacity-80">
              <span>{c.handle}</span><span>·</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{c.area}, {c.city}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 py-5 border-b border-line grid grid-cols-4 gap-2">
          <Stat value={c.rating.toFixed(1)} label="Rating" />
          <Stat value={c.completed} label="Projects" />
          <Stat value={c.yearsExp} label="Years" unit="yr" />
          <Stat value={c.responseTime.replace('~', '')} label="Reply" />
        </div>

        {/* Tagline + skills */}
        <div className="px-5 py-5 border-b border-line">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Tagline</div>
          <p className="font-display text-xl tracking-tight leading-tight">{c.tagline}</p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {c.subSkills.map(s => <span key={s} className="px-2.5 py-1 rounded-full bg-bone text-[11px] border border-line">{s}</span>)}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-[12px] text-obsidian/70">
              <Volume2 size={14} className="text-iris shrink-0" />
              <span><span className="text-obsidian/45">Speaks </span>{c.languages.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-obsidian/70">
              <MapPin size={14} className="text-iris shrink-0" />
              <span><span className="text-obsidian/45">Works </span>{c.travelMode === 'both' ? 'studio & travels to you' : c.travelMode === 'travel' ? 'travels to you' : 'at their studio'}</span>
            </div>
          </div>
        </div>

        {/* Trust */}
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Trust & verification</div>
            <div className="text-[10px] text-obsidian/40">100-point scale</div>
          </div>
          <div className="mb-4 p-4 rounded-2xl bg-bone border border-line">
            <div className="flex items-end justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Shield size={15} className="text-iris" />
                <span className="font-display text-base tracking-tight">Trust score</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="font-display text-2xl tnum" style={{ color: c.trustScore >= 80 ? '#16A34A' : '#7D61F2' }}>{c.trustScore}</span>
                <span className="text-[11px] text-obsidian/40 font-mono">/100</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-obsidian/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: c.trustScore + '%', background: c.trustScore >= 80 ? '#16A34A' : '#7D61F2' }} />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Phone verified', on: true },
              { label: 'Government ID verified', on: c.verification === 'id' || c.verification === 'vetted' },
              { label: 'FTC Vetted (human-reviewed)', on: c.verification === 'vetted' },
              { label: 'Social proof linked', on: true },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-[12px]">
                {item.on
                  ? <div className="w-4 h-4 rounded-full bg-iris grid place-items-center"><Check size={11} className="text-paper" /></div>
                  : <div className="w-4 h-4 rounded-full border border-line" />}
                <span className={item.on ? '' : 'text-obsidian/40'}>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-iris-tint flex items-center gap-3">
            <Shield size={20} className="text-iris shrink-0" />
            <div>
              <div className="text-[11px] font-semibold">Trust tier: Excellent</div>
              <div className="text-[11px] text-obsidian/60">{(c.repeatRate * 100).toFixed(0)}% of clients book again</div>
            </div>
          </div>
        </div>

        {/* Social links */}
        <div className="px-5 py-4 border-b border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {[[Instagram, 'Instagram'], [Film, 'YouTube'], [Briefcase, 'LinkedIn'], [Globe, 'Website'], [Link2, 'Portfolio']].map(([Ic, label], i) => (
                <button key={i} title={label as string} className="tap w-9 h-9 rounded-xl bg-bone border border-line grid place-items-center">
                  <Ic size={15} className="text-obsidian/70" />
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
              <BadgeCheck size={13} /> {(c.verification === 'id' || c.verification === 'vetted') ? 'Verified via Instagram' : 'Self-reported'}
            </span>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-iris-tint flex items-center gap-2">
            <Link2 size={13} className="text-iris shrink-0" />
            <span className="text-[11px] text-obsidian/70">Came from Instagram? Same creator, verified — book here with escrow-protected payment.</span>
          </div>
        </div>

        {/* 1:1 session */}
        {c.oneOnOne && (
          <div className="px-5 py-5 border-b border-line">
            <div className="rounded-2xl bg-obsidian text-paper p-4 relative overflow-hidden">
              <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-acid grid place-items-center shrink-0"><Coffee size={22} className="text-obsidian" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg tracking-tight leading-none">{c.oneOnOne.name}</span>
                    {c.oneOnOne.today && <span className="px-1.5 py-0.5 rounded-full bg-success text-paper text-[9px] font-mono uppercase">Today</span>}
                  </div>
                  <div className="text-[11.5px] text-paper/60 mt-1 flex items-center gap-2">
                    <span className="flex items-center gap-1"><Clock size={11} />{c.oneOnOne.mins} min</span>
                    <span>· {c.oneOnOne.type}</span>
                  </div>
                </div>
                <div className="text-right shrink-0"><div className="font-display text-xl tnum">{inr(c.oneOnOne.price)}</div></div>
              </div>
              <button className="tap relative mt-3 w-full py-2.5 rounded-xl bg-acid text-obsidian text-[13px] font-semibold">Book session</button>
            </div>
          </div>
        )}

        {/* Packages — mobile inline position (hidden on desktop, shown in sidebar instead) */}
        <div className="md:hidden">
          {packagesBlock}
          {calendarBlock}
        </div>

        {/* Reviews */}
        <div className="px-5 py-5 border-b border-line">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50">Reviews · verified only</div>
            <button className="tap text-[11px] font-medium text-iris">See all {c.reviews} →</button>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['Quality', 'Communication', 'Timeliness', 'Value'].map((axis, i) => {
              const score = (4.6 + (i * 13 % 4) / 10).toFixed(1)
              return (
                <div key={axis} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-[11px] text-obsidian/60">{axis}</div>
                    <div className="h-1.5 bg-bone rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-obsidian rounded-full" style={{ width: `${(parseFloat(score) / 5) * 100}%` }} />
                    </div>
                  </div>
                  <span className="font-display text-sm tnum">{score}</span>
                </div>
              )
            })}
          </div>
          <div className="space-y-3">
            {[
              { name: 'Aditi K.', text: "Absolutely floored by the delivery. Arrived early, stayed late, didn't miss a single detail.", when: '2w ago' },
              { name: 'Raghav M.', text: 'Second time booking. Know the shoot brief better than we do at this point. Highly recommend.', when: '1mo ago' },
            ].map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-bone">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[12px]">{r.name}</span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <div className="flex">{Array.from({ length: 5 }).map((_, k) => <Star key={k} size={10} className="fill-obsidian text-obsidian" />)}</div>
                    <span className="text-obsidian/50 tnum">· {r.when}</span>
                  </div>
                </div>
                <p className="text-[12px] text-obsidian/80 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Message CTA */}
        <div className="px-5 py-5">
          <button onClick={() => dispatch({ type: 'OPEN_CLIENT_CHAT', client: { name: c.name, avatar: c.avatar } })} className="tap w-full rounded-2xl bg-bone p-4 flex items-center gap-4 text-left active:bg-obsidian/5">
            <div className="w-12 h-12 rounded-2xl bg-obsidian grid place-items-center shrink-0"><MessageCircle size={22} className="text-acid" /></div>
            <div className="flex-1">
              <div className="font-display text-base leading-tight">Have a question first?</div>
              <div className="text-[11px] text-obsidian/60 mt-0.5">Message {c.name ? c.name.split(' ')[0] : 'Creator'} or request a custom quote before you book.</div>
            </div>
            <ChevronRight size={18} className="text-obsidian/40" />
          </button>
        </div>
      </div>

      {/* Desktop booking rail — sticky, mirrors the mobile packages/calendar/CTA flow */}
      <div className="hidden md:block md:sticky md:top-6">
        <div className="rounded-2xl border border-line bg-paper overflow-hidden shadow-sm">
          {packagesBlock}
          {calendarBlock}
          {desktopCta}
        </div>
      </div>
      </div>
      </div>

      {/* Sticky bottom CTA — mobile only; desktop uses the sidebar CTA above */}
      <div className="md:hidden absolute bottom-0 inset-x-0 px-5 pb-6 pt-3 bg-paper/95 backdrop-blur-xl border-t border-line z-10">
        {bookReady && (
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-obsidian/60">
            <CalendarCheck size={12} className="text-success" />
            {bookDateLabel} · {selectedTime} · {packages[selectedPkg].name}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: 'OPEN_CLIENT_CHAT', client: { name: c.name, avatar: c.avatar } })} className="tap w-14 rounded-2xl bg-obsidian/5 grid place-items-center">
            <MessageCircle size={19} className="text-obsidian/70" />
          </button>
          <button
            disabled={!bookReady}
            onClick={() => dispatch({ type: 'START_BOOKING', draft: { creatorId: c.id, creatorName: c.name, creatorAvatar: c.avatar, packageName: packages[selectedPkg].name, packagePrice: packages[selectedPkg].price, date: bookDateLabel, time: selectedTime ?? '', location: c.area, notes: '' } })}
            className={cn('tap flex-1 py-3.5 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2', bookReady ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/40')}
          >
            {!bookReady ? 'Select date & time' : `${dep.full ? 'Book' : 'Reserve'} · ${inr(dep.advance)}`}
            {bookReady && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
