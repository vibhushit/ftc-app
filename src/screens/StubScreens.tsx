import { useState, useRef } from 'react'
import {
  MessageCircle, Bell, Settings, ChevronRight, Shield, Star,
  MapPin, Edit3, Sparkles, CalendarCheck, Wallet, Link2, FileText,
  Bookmark, Copy, X, Clock, HelpCircle, BadgeCheck, Heart, Calendar,
  ArrowRight, ArrowLeft,
} from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { CreatorCardRow } from '@/components/creator/CreatorCardRow'
import { CreatorCardLarge } from '@/components/creator/CreatorCardLarge'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { CREATORS } from '@/data/creators'
import { cn } from '@/utils'

/* ─── Notifications data ─── */
const NOTIF_META: Record<string, { icon: any; bg: string; fg: string }> = {
  booking:      { icon: CalendarCheck, bg: 'bg-iris-tint', fg: 'text-iris' },
  quote:        { icon: FileText,      bg: 'bg-acid/20',   fg: 'text-obsidian' },
  payment:      { icon: Wallet,        bg: 'bg-success/10',fg: 'text-success' },
  review:       { icon: Star,          bg: 'bg-acid/20',   fg: 'text-obsidian' },
  trust:        { icon: Shield,        bg: 'bg-iris-tint', fg: 'text-iris' },
  verification: { icon: BadgeCheck,   bg: 'bg-success/10',fg: 'text-success' },
  availability: { icon: Clock,        bg: 'bg-bone',       fg: 'text-obsidian/60' },
  dispute:      { icon: HelpCircle,   bg: 'bg-danger/10',  fg: 'text-danger' },
}
const SEED_NOTIFS = [
  { id: 'n1', type: 'booking',      group: 'today',   title: 'Booking accepted',       sub: 'Ananya Desai accepted your request — Apr 26, 1:00 PM.',         time: '12m', action: { label: 'View booking', screen: 'bookings' } },
  { id: 'n2', type: 'quote',        group: 'today',   title: 'Quote expiring in 6 hrs', sub: 'Your custom quote of ₹45,000 from Kabir Sethi expires soon.',  time: '40m', action: { label: 'Review quote', screen: 'inbox' }, urgent: true },
  { id: 'n3', type: 'payment',      group: 'today',   title: 'Payment released',       sub: '₹30,000 was released from escrow to Priya Joshi.',              time: '3h',  action: { label: 'View receipt', screen: 'bookings' } },
  { id: 'n4', type: 'review',       group: 'week',    title: 'Review received',        sub: 'Nisha Reddy left you a 5★ review — "Worth every rupee."',       time: '2d',  action: { label: 'See review',   screen: 'reviews' } },
  { id: 'n5', type: 'trust',        group: 'week',    title: 'Trust score increased',  sub: 'Your trust score went up to 92 after a completed booking.',     time: '3d' },
  { id: 'n6', type: 'availability', group: 'week',    title: 'Creator available today',sub: 'Meher Krishnan (saved) just opened slots for today.',           time: '4d',  action: { label: 'Open profile', screen: 'creator' } },
  { id: 'n7', type: 'verification', group: 'earlier', title: 'Verification approved',  sub: 'Your Aadhaar and PAN were verified. You can now go live.',       time: '1w' },
  { id: 'n8', type: 'dispute',      group: 'earlier', title: 'Dispute resolved',       sub: 'Your dispute on Booking #FTC8190 was resolved in your favour.',  time: '2w',  action: { label: 'View details', screen: 'safety' } },
]

const INBOX = [
  { id: 'ib1', cid: 'c1', last: 'Thanks, looking forward to Sunday!', time: '2m',  unread: 2, online: true },
  { id: 'ib2', cid: 'c2', last: "I'll send a moodboard tonight 🎨",   time: '1h',  unread: 0, online: false },
  { id: 'ib3', cid: 'c4', last: 'Chai Chat confirmed for Thu 6pm',    time: '3h',  unread: 1, online: true },
  { id: 'ib4', cid: 'c6', last: 'Here are the final edits',           time: '1d',  unread: 0, online: false },
  { id: 'ib5', cid: 'c8', last: 'Location scouting photos attached',  time: '2d',  unread: 0, online: false },
  { id: 'ib6', cid: 'c10',last: 'Booking confirmed ✨',               time: '3d',  unread: 0, online: false },
]

export function InboxList() {
  const { drillIntoTab, dispatch } = useAppStore(useShallow(s => ({ drillIntoTab: s.drillIntoTab, dispatch: s.dispatch })))
  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden h-full">
      <div className="px-5 pt-4 pb-3 border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {drillIntoTab && (
            <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 w-9 h-9 grid place-items-center"><ArrowLeft size={18} /></button>
          )}
          <div className="font-display text-3xl tracking-tight leading-none">Inbox</div>
        </div>
        <button className="tap w-9 h-9 rounded-full bg-bone grid place-items-center">
          <Edit3 size={15} />
        </button>
      </div>
      <div className="app-scroll pb-nav flex-1">
        {INBOX.map(m => {
          const c = CREATORS.find(x => x.id === m.cid)
          if (!c) return null
          return (
            <button
              key={m.id}
              onClick={() => dispatch({ type: 'OPEN_CLIENT_CHAT', client: { name: c.name, avatar: c.avatar } })}
              className="tap w-full flex items-center gap-3.5 px-5 py-4 border-b border-line text-left hover:bg-bone/40 transition-colors"
            >
              <div className="relative shrink-0">
                <img src={c.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                {m.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-paper" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn('text-[14px]', m.unread ? 'font-semibold' : 'font-medium')}>{c.name}</span>
                  <span className="text-[11px] font-mono text-obsidian/40">{m.time}</span>
                </div>
                <div className="text-[12px] text-obsidian/60 mt-0.5 truncate">{m.last}</div>
                {m.unread > 0 && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-iris text-paper text-[10px] font-semibold grid place-items-center">{m.unread}</span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function InboxScreen() {
  return (
    <div className="flex-1 flex flex-col md:flex-row bg-paper overflow-hidden h-full">
      <div className="flex-1 md:flex-none md:w-[320px] lg:w-[360px] md:border-r md:border-line h-full flex flex-col">
        <InboxList />
      </div>
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-bone">
        <div className="w-16 h-16 rounded-full bg-iris/10 text-iris grid place-items-center mb-3">
          <MessageCircle size={32} />
        </div>
        <h3 className="font-display text-xl tracking-tight text-obsidian">Your Conversations</h3>
        <p className="text-[13px] text-obsidian/60 max-w-xs mt-1 leading-relaxed">
          Select a conversation from the left to view quotes, discuss bookings, and send messages.
        </p>
      </div>
    </div>
  )
}

/* ─── Me Screen (matches HTML MeScreen exactly) ─── */
export function MeScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const u = state.user ?? {}
  const name: string = (u as any).name ?? 'Rhea Kapoor'
  const handle: string = (u as any).handle ?? '@rhea'
  const city: string = (u as any).city ?? 'Delhi'
  const locality: string = (u as any).locality ?? 'Hauz Khas'
  const isC = state.isCreator

  const clientMenu = [
    { icon: CalendarCheck, label: 'My bookings',    sub: '2 upcoming · 5 completed',              s: 'bookings' },
    { icon: Bookmark,      label: 'Saved creators', sub: state.saved.length + ' saved',            s: 'saved' },
    { icon: Bell,          label: 'Notifications',  sub: '3 new updates',                          s: 'notifications' },
    { icon: MessageCircle, label: 'Messages',       sub: 'Your conversations',                     s: 'inbox' },
    { icon: Star,          label: 'Reviews',        sub: 'Reviews you\'ve written',                s: 'reviews' },
    { icon: Shield,        label: 'Safety Centre',  sub: 'Report an issue or dispute',             s: 'safety' },
    { icon: FileText,      label: 'Legal & contracts', sub: 'Booking contract & policies',         s: 'legal' },
    { icon: Settings,      label: 'Settings',       sub: 'Profile, notifications, privacy',        s: 'settings' },
  ]
  const creatorMenu = [
    { icon: CalendarCheck, label: 'My bookings',    sub: state.creatorBookings.length + ' jobs in pipeline', s: 'bookings' },
    { icon: Calendar,      label: 'Calendar',       sub: 'Set your availability & slots',                    s: 'calendar' },
    { icon: Wallet,        label: 'Revenue & payouts', sub: '₹43,000 available to withdraw',               s: 'payouts' },
    { icon: MessageCircle, label: 'Messages',       sub: 'Client chats & quotes',                           s: 'inbox' },
    { icon: Star,          label: 'Reviews',        sub: '12 reviews · 4.8 average',                        s: 'reviews' },
    { icon: Link2,         label: 'Link-in-Bio',    sub: 'ftc.app/' + handle,                               s: 'linkbio' },
    { icon: Shield,        label: 'Safety Centre',  sub: 'Report an issue or dispute',                      s: 'safety' },
    { icon: FileText,      label: 'Legal & contracts', sub: 'Your signed agreements',                       s: 'legal' },
    { icon: Settings,      label: 'Settings',       sub: 'Profile, notifications, privacy',                 s: 'settings' },
  ]
  const menu = isC ? creatorMenu : clientMenu
  const stats = isC
    ? [['7', 'Jobs'], ['4.8', 'Rating'], ['12', 'Reviews']]
    : [['7', 'Bookings'], [String(state.saved.length), 'Saved'], ['12', 'Reviews']]
  const go = (s: string) => dispatch(s === 'inbox' ? { type: 'GO_TAB', tab: 'inbox', viaMenu: true } : { type: 'GO', screen: s as any })

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden">
      {/* Dark header */}
      <div className="bg-obsidian text-paper relative shrink-0">
        <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
        <div className="relative px-5 pt-4 pb-6">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-wider text-acid">Your account</div>
            <button onClick={() => go('settings')} className="tap w-9 h-9 rounded-full bg-paper/10 grid place-items-center">
              <Settings size={15} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-acid grid place-items-center font-display text-3xl text-obsidian shrink-0">
              {name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-2xl leading-none truncate">{name}</div>
              <div className="text-[12px] text-paper/60 mt-1 flex items-center gap-1">
                <MapPin size={11} />{locality ? locality + ', ' : ''}{city}
              </div>
              <button onClick={() => go('settings')} className="tap mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-paper/10 text-[11px] font-semibold">
                <Edit3 size={11} /> Edit profile
              </button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {stats.map(([val, lbl], i) => (
              <div key={i} className="p-3 rounded-2xl bg-paper/10">
                <div className="font-display text-2xl tnum leading-none">{val}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-paper/60 mt-1">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="app-scroll pb-nav px-5">
        {/* CTA banner */}
        {isC ? (
          <button onClick={() => go('linkbio')} className="tap w-full mt-4 p-4 rounded-2xl bg-obsidian text-paper text-left relative overflow-hidden">
            <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-wider text-acid">Your booking link</div>
                <div className="font-display text-lg truncate mt-0.5">ftc.app/{handle}</div>
              </div>
              <span className="shrink-0 px-3 py-2 rounded-xl bg-acid text-obsidian text-[12px] font-semibold flex items-center gap-1.5">
                <Copy size={12} /> Copy
              </span>
            </div>
          </button>
        ) : (
          <button onClick={() => go('creatorOnboard1')} className="tap w-full mt-4 p-4 rounded-2xl bg-acid text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 dots-obsidian opacity-20 pointer-events-none" style={{ transform: 'translate(25%,-25%)' }} />
            <div className="relative flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-obsidian grid place-items-center shrink-0">
                <Sparkles size={22} className="text-acid" />
              </div>
              <div className="flex-1">
                <div className="font-display text-lg leading-tight">Become a creator</div>
                <div className="text-[12px] text-obsidian/70 mt-0.5">Build your profile in 5 steps, ~7 minutes.</div>
              </div>
              <ChevronRight size={18} />
            </div>
          </button>
        )}

        {/* Menu list */}
        <div className="mt-4 bg-paper rounded-2xl border border-line overflow-hidden">
          {menu.map((r, i) => (
            <button
              key={r.label}
              onClick={() => go(r.s)}
              className={cn('tap w-full flex items-center gap-3 px-4 py-3.5 active:bg-bone text-left', i < menu.length - 1 && 'border-b border-line')}
            >
              <div className="w-9 h-9 rounded-xl bg-bone grid place-items-center shrink-0">
                <r.icon size={17} className="text-obsidian/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">{r.label}</div>
                <div className="text-[11px] text-obsidian/50 truncate">{r.sub}</div>
              </div>
              <ChevronRight size={15} className="text-obsidian/30" />
            </button>
          ))}
        </div>

        {/* Switch view */}
        <button
          onClick={() => dispatch({ type: 'SET_ROLE', isCreator: !isC })}
          className="tap w-full mt-4 py-4 rounded-2xl bg-iris text-paper font-semibold text-[14px] flex items-center justify-center gap-2"
        >
          <Sparkles size={16} /> {isC ? 'Switch to Consumer View' : 'Switch to Creator View'}
        </button>

        {/* Log out */}
        <button onClick={() => dispatch({ type: 'RESET' })} className="tap w-full mt-2 py-2 text-center text-[12px] text-obsidian/40">
          Log out
        </button>
        <div className="py-6 text-center text-[11px] text-obsidian/40 font-mono">FTC v1.1.0 · Made in India</div>
      </div>
    </div>
  )
}

export function CampaignsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const campaigns = useAppStore(s => s.campaigns)
  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <SimpleHeader title="Brand Campaigns" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll pb-nav">
        <div className="px-5 py-4 space-y-3">
          {campaigns.map(c => (
            <button
              key={c.id}
              onClick={() => dispatch({ type: 'OPEN_CAMPAIGN', id: c.id })}
              className="tap w-full p-4 rounded-2xl bg-paper border border-line text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <img src={c.posterAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                <div>
                  <div className="text-[12px] font-semibold">{c.posterName}</div>
                  <div className="text-[10px] font-mono uppercase text-obsidian/50">{c.discipline}</div>
                </div>
                <div className="ml-auto text-[11px] font-mono text-obsidian/40">{c.postedAgo}</div>
              </div>
              <p className="text-[13px] leading-snug">{c.title}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-obsidian/60">
                <span className="font-mono">{inr(c.budgetMin)}–{inr(c.budgetMax)}</span>
                <span>· {c.applicants} applicants</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


export function FiltersScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const { filters } = state
  const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur', 'Goa', 'Kolkata', 'Chandigarh', 'Ahmedabad', 'Kochi', 'Indore']
  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <SimpleHeader title="Filters" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll pb-nav">
        <div className="px-5 py-5 space-y-6">
          <div>
            <div className="text-[12px] font-mono uppercase tracking-[0.12em] text-obsidian/50 mb-3">City</div>
            <div className="flex flex-wrap gap-2">
              {['All', ...CITIES].map(city => (
                <button
                  key={city}
                  onClick={() => dispatch({ type: 'SET_FILTER', patch: { city: city === 'All' ? '' : city } })}
                  className={cn('chip', (city === 'All' ? !filters.city : filters.city === city) && 'chip-active')}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-mono uppercase tracking-[0.12em] text-obsidian/50 mb-3">Gender preference</div>
            <div className="flex gap-2">
              {['Any', 'Male', 'Female', 'Non-binary'].map(g => (
                <button
                  key={g}
                  onClick={() => dispatch({ type: 'SET_FILTER', patch: { gender: g } })}
                  className={cn('chip', filters.gender === g && 'chip-active')}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[12px] font-mono uppercase tracking-[0.12em] text-obsidian/50 mb-3">Availability</div>
            <button
              onClick={() => dispatch({ type: 'SET_FILTER', patch: { availableToday: !filters.availableToday } })}
              className={cn('chip', filters.availableToday && 'chip-active')}
            >
              Available today
            </button>
          </div>
          <div>
            <div className="text-[12px] font-mono uppercase tracking-[0.12em] text-obsidian/50 mb-3">Min rating</div>
            <div className="flex gap-2">
              {[0, 4.0, 4.5, 4.8].map(r => (
                <button
                  key={r}
                  onClick={() => dispatch({ type: 'SET_FILTER', patch: { rating: r } })}
                  className={cn('chip', filters.rating === r && 'chip-active')}
                >
                  {r === 0 ? 'Any' : `${r}+`}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-6 flex gap-3">
          <button onClick={() => dispatch({ type: 'RESET_FILTERS' })} className="tap flex-1 py-3.5 rounded-2xl border-2 border-line font-semibold text-[14px]">Reset</button>
          <button onClick={() => dispatch({ type: 'APPLY_FILTERS', filters })} className="tap flex-1 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px]">Apply</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Notifications Screen ─── */
function NotifRow({ n, read, onOpen, onArchive }: { n: typeof SEED_NOTIFS[0]; read: boolean; onOpen: () => void; onArchive: () => void }) {
  const [dx, setDx] = useState(0)
  const startX = useRef(0)
  const meta = NOTIF_META[n.type] || NOTIF_META.booking
  const Icon = meta.icon
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-[110px] bg-danger flex items-center justify-center gap-1 text-paper text-[12px] font-semibold">
        <X size={14} /> Archive
      </div>
      <div
        onTouchStart={e => { startX.current = e.touches[0].clientX }}
        onTouchMove={e => { const d = e.touches[0].clientX - startX.current; if (d < 0) setDx(Math.max(d, -110)) }}
        onTouchEnd={() => { if (dx < -64) onArchive(); setDx(0) }}
        style={{ transform: `translateX(${dx}px)`, transition: dx === 0 ? 'transform .2s ease' : 'none' }}
        className="relative bg-paper"
      >
        <button onClick={onOpen} className={cn('tap w-full text-left flex items-start gap-3 px-5 py-4 border-b border-line active:bg-bone', !read && 'bg-bone/40')}>
          <div className={cn('w-10 h-10 rounded-full grid place-items-center shrink-0', meta.bg)}>
            <Icon size={17} className={meta.fg} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-[13px]', read ? 'font-medium text-obsidian/80' : 'font-bold')}>{n.title}</span>
              {(n as any).urgent && <span className="px-1.5 py-0.5 rounded bg-danger/10 text-danger text-[9px] font-mono font-semibold uppercase">Urgent</span>}
            </div>
            <div className="text-[12px] text-obsidian/60 mt-0.5 leading-relaxed">{n.sub}</div>
            {(n as any).action && (
              <span className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-iris">
                {(n as any).action.label} <ChevronRight size={12} />
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-[10px] font-mono text-obsidian/40">{n.time}</span>
            {!read && <span className="w-2.5 h-2.5 rounded-full bg-iris animate-pulse" />}
          </div>
        </button>
      </div>
    </div>
  )
}

export function NotificationsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [read, setRead] = useState<Record<string, boolean>>({})
  const [archived, setArchived] = useState<Record<string, boolean>>({})
  const list = SEED_NOTIFS.filter(n => !archived[n.id])
  const unread = list.filter(n => !read[n.id]).length
  const open = (n: typeof SEED_NOTIFS[0]) => {
    setRead(r => ({ ...r, [n.id]: true }))
    if ((n as any).action?.screen) dispatch({ type: 'GO', screen: (n as any).action.screen as any })
  }
  const groups: [string, string][] = [['today', 'Today'], ['week', 'This week'], ['earlier', 'Earlier']]

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden min-h-0">
      <SimpleHeader title="Activity" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="px-5 py-2.5 flex items-center justify-between border-b border-line bg-bone/40">
        <span className="text-[12px] text-obsidian/60">
          {unread > 0 ? <span><span className="font-semibold text-obsidian">{unread}</span> new updates</span> : 'You\'re all caught up'}
        </span>
        {unread > 0 && (
          <button onClick={() => setRead(Object.fromEntries(SEED_NOTIFS.map(n => [n.id, true])))} className="tap text-[12px] font-medium text-iris">
            Mark all read
          </button>
        )}
      </div>
      <div className="app-scroll pb-6">
        {list.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 px-10">
            <div className="w-14 h-14 rounded-full bg-bone grid place-items-center mb-3"><Bell size={24} className="text-obsidian/30" /></div>
            <div className="font-display text-lg">No activity</div>
            <p className="text-[13px] text-obsidian/50 mt-1">Booking, payment and review updates show up here.</p>
          </div>
        ) : (
          groups.map(([g, label]) => {
            const items = list.filter(n => n.group === g)
            if (!items.length) return null
            return (
              <div key={g}>
                <div className="px-5 pt-4 pb-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/40">{label}</div>
                {items.map(n => (
                  <NotifRow
                    key={n.id}
                    n={n}
                    read={!!read[n.id]}
                    onOpen={() => open(n)}
                    onArchive={() => setArchived(a => ({ ...a, [n.id]: true }))}
                  />
                ))}
              </div>
            )
          })
        )}
      </div>
      <div className="px-5 py-2 text-center text-[10px] font-mono text-obsidian/35 border-t border-line">Swipe a card left to archive</div>
    </div>
  )
}

/* ─── Saved Screen ─── */
export function SavedScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const savedCreators = CREATORS.filter(c => state.saved.includes(c.id))

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <SimpleHeader title={`Saved · ${savedCreators.length}`} onBack={() => dispatch({ type: 'BACK' })} />
      {savedCreators.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-bone grid place-items-center mb-4"><Heart size={28} className="text-obsidian/30" /></div>
          <div className="font-display text-xl">Nothing saved yet</div>
          <p className="text-[13px] text-obsidian/50 mt-2">Tap the heart icon on any creator to save them here.</p>
          <button onClick={() => dispatch({ type: 'GO_TAB', tab: 'discover' })} className="tap mt-5 px-6 py-3.5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center gap-2">
            Browse creators <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="app-scroll pb-nav">
          {/* Mobile: stacked rows */}
          <div className="md:hidden">
            {savedCreators.map(c => (
              <CreatorCardRow
                key={c.id}
                c={c}
                isSaved={true}
                onOpen={() => dispatch({ type: 'OPEN_CREATOR', id: c.id })}
                onToggleSave={() => dispatch({ type: 'TOGGLE_SAVE', id: c.id })}
              />
            ))}
          </div>
          {/* Tablet/desktop: card grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-5 py-4">
            {savedCreators.map(c => (
              <CreatorCardLarge
                key={c.id}
                c={c}
                onOpen={() => dispatch({ type: 'OPEN_CREATOR', id: c.id })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
