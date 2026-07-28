import { useState } from 'react'
import {
  CalendarCheck, Bookmark, Bell, MessageCircle, Star, Shield, FileText,
  Settings, Calendar, Wallet, Link2, MapPin, Edit3, Sparkles, Copy,
  Check, LogOut, ChevronRight, Share2, ExternalLink, ArrowLeft, Edit3 as EditIcon, SlidersHorizontal, Trash2
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS } from '@/data/creators'
import { cn } from '@/utils'

const INBOX = [
  { id: 'ib1', cid: 'c1',  last: 'Done! Uploaded 42 edited selects in full-res.', time: '2m',  unread: 1, online: true },
  { id: 'ib2', cid: 'c2',  last: 'Drone permit for South Goa beach session ready.', time: '1h',  unread: 2, online: false },
  { id: 'ib3', cid: 'c4',  last: 'Hey! Are you free for a 4h event in Hauz Khas?', time: '4h',  unread: 0, online: true },
  { id: 'ib4', cid: 'c5',  last: 'Invoice #FTC-8472 generated · ₹35,000 paid.', time: '1d',  unread: 0, online: false },
  { id: 'ib5', cid: 'c7',  last: 'Sent custom quote: ₹45,000 (pre-wedding).',   time: '2d',  unread: 0, online: false },
  { id: 'ib6', cid: 'c10', last: 'Booking confirmed ✨',                        time: '3d',  unread: 0, online: false },
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
          <EditIcon size={15} />
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

/* ─── Me Screen (Profile) ─── */
export function MeScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [copied, setCopied] = useState(false)
  const u = state.user ?? {}
  const name: string = (u as any).name ?? 'Rhea Kapoor'
  const handle: string = (u as any).handle ?? '@rhea'
  const city: string = (u as any).city ?? 'Delhi'
  const locality: string = (u as any).locality ?? 'Hauz Khas'
  const isC = state.isCreator

  const copyBookingLink = () => {
    const link = `https://ftc.app/${handle.replace(/^@/, '')}`
    try {
      navigator.clipboard.writeText(link)
    } catch {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clientMenu = [
    { icon: CalendarCheck, label: 'My Bookings',    sub: '2 upcoming · 5 completed',              s: 'bookings' },
    { icon: Bookmark,      label: 'Saved Creators', sub: `${state.saved.length} creators saved`,       s: 'saved' },
    { icon: Bell,          label: 'Notifications',  sub: '3 unread updates',                       s: 'notifications' },
    { icon: MessageCircle, label: 'Messages',       sub: 'Client chats & quotes',                  s: 'inbox' },
    { icon: Star,          label: 'My Reviews',     sub: 'Reviews you\'ve submitted',              s: 'reviews' },
    { icon: Shield,        label: 'Safety Centre',  sub: 'Escrow protection & disputes',           s: 'safety' },
    { icon: FileText,      label: 'Legal & Contracts', sub: 'Booking contract & policies',         s: 'legal' },
    { icon: Settings,      label: 'Account Settings', sub: 'Profile, notifications, security',      s: 'settings' },
  ]

  const creatorMenu = [
    { icon: CalendarCheck, label: 'My Bookings',    sub: `${state.creatorBookings.length} jobs in pipeline`, s: 'bookings' },
    { icon: Calendar,      label: 'Calendar & Slots', sub: 'Manage availability & open dates',       s: 'calendar' },
    { icon: Wallet,        label: 'Payouts & Revenue', sub: '₹43,000 available in escrow',           s: 'payouts' },
    { icon: MessageCircle, label: 'Messages & Quotes', sub: 'Client inquiries & proposals',          s: 'inbox' },
    { icon: Star,          label: 'Client Reviews', sub: '12 reviews · 4.8 average',                 s: 'reviews' },
    { icon: Link2,         label: 'Link-in-Bio',    sub: `ftc.app/${handle.replace(/^@/, '')}`,      s: 'linkbio' },
    { icon: Shield,        label: 'Safety Centre',  sub: 'Escrow protection & disputes',           s: 'safety' },
    { icon: FileText,      label: 'Legal & Agreements', sub: 'Your signed agreements',              s: 'legal' },
    { icon: Settings,      label: 'Account Settings', sub: 'Profile, notifications, security',      s: 'settings' },
  ]

  const menu = isC ? creatorMenu : clientMenu
  const stats = isC
    ? [['7', 'Jobs'], ['4.8', 'Rating'], ['12', 'Reviews']]
    : [['7', 'Bookings'], [String(state.saved.length), 'Saved'], ['12', 'Reviews']]

  const go = (s: string) => dispatch(s === 'inbox' ? { type: 'GO_TAB', tab: 'inbox', viaMenu: true } : { type: 'GO', screen: s as any })

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden h-full">
      <div className="app-scroll pb-nav">
        {/* Dark Header Banner */}
        <div className="bg-obsidian text-paper relative shrink-0 md:m-6 md:rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative px-5 pt-5 pb-6 md:p-8">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-acid bg-acid/15 px-2.5 py-1 rounded-full border border-acid/20 font-semibold">
                  {isC ? 'Creator Account' : 'Client Account'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dispatch({ type: 'SET_ROLE', isCreator: !isC })}
                  className="tap px-3 py-1.5 rounded-full bg-paper/10 text-paper text-[11px] font-semibold hover:bg-paper/20 transition flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-acid" />
                  {isC ? 'Switch to Client View' : 'Switch to Creator View'}
                </button>
                <button onClick={() => go('settings')} className="tap w-8 h-8 rounded-full bg-paper/10 grid place-items-center hover:bg-paper/20 transition">
                  <Settings size={14} />
                </button>
              </div>
            </div>

            {/* Profile Info & Stats */}
            <div className="mt-6 md:flex md:items-center md:justify-between md:gap-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-acid grid place-items-center font-display text-3xl md:text-4xl text-obsidian shrink-0 shadow-md">
                  {name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-2xl md:text-3xl tracking-tight leading-none truncate">{name}</div>
                  <div className="text-[12px] text-paper/60 mt-1.5 flex items-center gap-1.5">
                    <MapPin size={12} className="text-acid shrink-0" />
                    <span>{locality ? locality + ', ' : ''}{city}</span>
                    <span className="text-paper/30">·</span>
                    <span className="font-mono text-paper/70">{handle}</span>
                  </div>
                  <button onClick={() => go('settings')} className="tap mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper/10 text-[11px] font-semibold hover:bg-paper/20 transition">
                    <Edit3 size={11} /> Edit profile
                  </button>
                </div>
              </div>

              {/* Stats Block */}
              <div className="mt-6 md:mt-0 grid grid-cols-3 gap-3 md:min-w-[340px]">
                {stats.map(([val, lbl], i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-paper/10 border border-paper/5 text-center">
                    <div className="font-display text-2xl md:text-3xl tnum leading-none">{val}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-paper/60 mt-1">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-6">
          {/* Booking Link / Become Creator Card */}
          {isC ? (
            <div className="mt-2 p-5 rounded-2xl bg-obsidian text-paper relative overflow-hidden shadow-md">
              <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-acid font-semibold">Your Personal Booking Link</span>
                    <span className="px-1.5 py-0.5 rounded bg-acid/20 text-acid text-[9px] font-mono uppercase">Instant Escrow</span>
                  </div>
                  <div className="font-display text-xl md:text-2xl text-paper tracking-tight mt-1 truncate flex items-center gap-1.5">
                    <span>ftc.app/{handle.replace(/^@/, '')}</span>
                    <a href={`#creator=${state.selectedCreatorId || 'c1'}`} className="text-paper/40 hover:text-paper transition"><ExternalLink size={16} /></a>
                  </div>
                  <p className="text-[11.5px] text-paper/60 mt-0.5">Share this link in your Instagram bio for 1-tap client bookings.</p>
                </div>
                <button
                  onClick={copyBookingLink}
                  className={cn(
                    'tap shrink-0 px-5 py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition shadow',
                    copied ? 'bg-success text-paper' : 'bg-acid text-obsidian hover:bg-acid/90'
                  )}
                >
                  {copied ? <><Check size={14} /> Link Copied!</> : <><Copy size={14} /> Copy Booking Link</>}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => go('creatorOnboard1')} className="tap w-full mt-2 p-5 rounded-2xl bg-acid text-left relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-36 h-36 dots-obsidian opacity-20 pointer-events-none" style={{ transform: 'translate(25%,-25%)' }} />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-obsidian grid place-items-center shrink-0 shadow">
                  <Sparkles size={24} className="text-acid" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl leading-tight">Become an FTC Verified Creator</div>
                  <div className="text-[12.5px] text-obsidian/75 mt-0.5">Build your profile, list packages, and accept escrow-protected bookings in ~7 minutes.</div>
                </div>
                <ChevronRight size={20} className="shrink-0" />
              </div>
            </button>
          )}

          {/* Menu Cards — Responsive 3-Column Grid on Desktop */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {menu.map(r => (
              <button
                key={r.label}
                onClick={() => go(r.s)}
                className="tap w-full flex items-center gap-3.5 p-4 rounded-2xl bg-paper border border-line hover:border-obsidian/40 hover:shadow-md transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-bone grid place-items-center shrink-0 group-hover:bg-obsidian group-hover:text-paper transition-colors">
                  <r.icon size={18} className="text-obsidian/75 group-hover:text-acid transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-obsidian">{r.label}</div>
                  <div className="text-[11.5px] text-obsidian/55 truncate mt-0.5">{r.sub}</div>
                </div>
                <ChevronRight size={15} className="text-obsidian/30 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>

          {/* Account Footer & Log Out */}
          <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch({ type: 'SET_ROLE', isCreator: !isC })}
                className="tap px-4 py-2.5 rounded-xl bg-iris text-paper text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} /> {isC ? 'Switch to Client View' : 'Switch to Creator View'}
              </button>
              <button
                onClick={() => dispatch({ type: 'RESET' })}
                className="tap px-4 py-2.5 rounded-xl bg-paper border border-line text-[12.5px] font-semibold text-danger hover:bg-danger/10 transition flex items-center gap-1.5"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
            <div className="text-[11px] text-obsidian/40 font-mono">FTC Creator Marketplace v1.1.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CampaignsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Campaigns</h1>
      </div>
    </div>
  )
}

export function NotificationsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Notifications</h1>
      </div>
    </div>
  )
}

export function SavedScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Saved Creators</h1>
      </div>
    </div>
  )
}

export function ReviewsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Reviews</h1>
      </div>
    </div>
  )
}

export function SafetyScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl font-light">Safety & Escrow Protection</h1>
      </div>
    </div>
  )
}

export function LegalScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl font-light">Legal & Contracts</h1>
      </div>
    </div>
  )
}

export function CompareScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl font-light">Compare Creators</h1>
      </div>
    </div>
  )
}

export function LinkBioScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Link-in-Bio</h1>
      </div>
    </div>
  )
}

export function CalendarScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Calendar & Availability</h1>
      </div>
    </div>
  )
}

export function PayoutsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Revenue & Payouts</h1>
      </div>
    </div>
  )
}

export function PayoutSetupScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Payout Setup</h1>
      </div>
    </div>
  )
}

export function WalletScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Wallet</h1>
      </div>
    </div>
  )
}

export function ReferralScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">Referrals</h1>
      </div>
    </div>
  )
}

export function OnboardKycScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => dispatch({ type: 'BACK' })}><ArrowLeft size={20} /></button>
        <h1 className="font-display text-2xl">KYC Verification</h1>
      </div>
    </div>
  )
}

export function FiltersScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-line flex items-center justify-between">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 p-2"><ArrowLeft size={20} /></button>
        <div className="font-display text-lg">Filters</div>
        <button onClick={() => dispatch({ type: 'RESET_FILTERS' })} className="tap text-[12px] font-semibold text-iris">Reset</button>
      </div>
      <div className="app-scroll px-5 pt-4 pb-28">
        <div className="font-mono text-[10px] uppercase tracking-wider text-obsidian/50 mb-2">Discipline</div>
        <div className="flex flex-wrap gap-2 mb-6">
          {['All', 'Photography', 'Videography', 'Graphic Design', 'UI/UX', 'Writing', 'Music', 'Tattoo', 'Illustration'].map(d => (
            <button
              key={d}
              onClick={() => dispatch({ type: 'SET_FILTER', patch: { discipline: d } })}
              className={cn('tap px-3.5 py-2 rounded-xl text-[12.5px] font-medium border transition', state.filters.discipline === d ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line')}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
