import { useState } from 'react'
import {
  CalendarCheck, Bookmark, Bell, MessageCircle, Star, Shield, FileText,
  Settings, Calendar, Wallet, Link2, MapPin, Edit3, Sparkles, Copy,
  Check, LogOut, ChevronRight, ExternalLink, ArrowLeft, X, Zap, User
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn, shareOrCopy, getProfileUrl, normalizeHandle } from '@/utils'
import { signOutCleanly } from '@/lib/api/auth'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

const INBOX: Array<{ id: string; name: string; avatar: string; last: string; time: string; unread: number; online: boolean }> = []

export function InboxList() {
  const drillIntoTab = useAppStore(s => s.drillIntoTab)
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden h-full">
      <div className="px-5 pt-4 pb-3 border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {drillIntoTab && (
            <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 w-9 h-9 grid place-items-center"><ArrowLeft size={18} /></button>
          )}
          <div className="font-display text-3xl tracking-tight leading-none">Inbox</div>
        </div>
        <button disabled title="New conversation coming soon" className="tap w-9 h-9 rounded-full bg-bone grid place-items-center opacity-40 cursor-not-allowed">
          <Edit3 size={15} />
        </button>
      </div>
      <div className="app-scroll pb-nav flex-1">
        {INBOX.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-14 h-14 rounded-full bg-bone grid place-items-center mb-3 text-obsidian/40 mx-auto">
              <MessageCircle size={26} />
            </div>
            <div className="font-display text-lg">No messages yet</div>
            <p className="text-[13px] text-obsidian/50 mt-1 max-w-xs leading-relaxed">
              Conversations will appear here once messaging is live.
            </p>
          </div>
        ) : (
          INBOX.map(m => (
            <button
              key={m.id}
              onClick={() => dispatch({ type: 'OPEN_CLIENT_CHAT', client: { name: m.name, avatar: m.avatar } })}
              className="tap w-full flex items-center gap-3.5 px-5 py-4 border-b border-line text-left hover:bg-bone/40 transition-colors"
            >
              <div className="relative shrink-0">
                <img src={m.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                {m.online && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-paper" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn('text-[14px]', m.unread ? 'font-semibold' : 'font-medium')}>{m.name}</span>
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
          ))
        )}
      </div>
    </div>
  )
}

export function InboxScreen() {
  const isAuthed = useAppStore(s => s.isAuthed)
  const dispatch = useAppStore(s => s.dispatch)

  if (!isAuthed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-paper">
        <div className="w-16 h-16 rounded-full bg-obsidian/5 grid place-items-center mb-4 text-obsidian/60">
          <MessageCircle size={28} />
        </div>
        <h2 className="font-display text-2xl tracking-tight text-obsidian">Sign in to view messages</h2>
        <p className="text-[13px] text-obsidian/60 max-w-sm mt-1.5 leading-relaxed">
          Communicate directly with creators, discuss booking requirements, and review custom proposals.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap flex-1 py-3 px-5 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] hover:bg-obsidian/90 transition shadow-sm cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
            className="tap flex-1 py-3 px-5 rounded-2xl bg-bone border border-line text-obsidian font-semibold text-[14px] hover:bg-bone/80 transition cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    )
  }

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
  const isAuthed = useAppStore(s => s.isAuthed)
  const user = useAppStore(s => s.user)
  const isC = useAppStore(s => s.isCreator)
  const hasCreatorProfile = useAppStore(s => s.hasCreatorProfile)
  const creatorBookingsCount = useAppStore(s => s.creatorBookings.length)
  const lastBooking = useAppStore(s => s.lastBooking)
  const savedCount = useAppStore(s => s.saved.length)
  const supabaseUserId = useAppStore(s => s.supabaseUserId)
  const selectedCreatorId = useAppStore(s => s.selectedCreatorId)
  const dispatch = useAppStore(s => s.dispatch)

  const [copied, setCopied] = useState(false)
  const [showCreatorModal, setShowCreatorModal] = useState(false)
  useBodyScrollLock(showCreatorModal)

  if (!isAuthed) {
    return (
      <div className="flex-1 flex flex-col bg-bone overflow-hidden h-full">
        <div className="app-scroll pb-nav">
          {/* Guest Header Card */}
          <div className="bg-obsidian text-paper relative shrink-0 md:m-6 md:rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
            <div className="relative px-6 py-10 md:p-12 flex flex-col items-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-paper/10 border border-paper/15 grid place-items-center mb-4 text-paper/80">
                <User size={28} />
              </div>
              <h1 className="font-display text-2xl md:text-3xl tracking-tight leading-tight">
                Your Account
              </h1>
              <p className="text-[13px] text-paper/65 mt-2 leading-relaxed">
                Sign in to manage your bookings, save your favorite creators, and securely message professionals.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => dispatch({ type: 'GO', screen: 'login' })}
                  className="tap flex-1 py-3 px-5 rounded-2xl bg-acid text-obsidian font-semibold text-[14px] hover:bg-acid/90 transition shadow-sm cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
                  className="tap flex-1 py-3 px-5 rounded-2xl bg-paper/10 border border-paper/15 text-paper font-semibold text-[14px] hover:bg-paper/20 transition cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info & Support Links for Guests */}
          <div className="px-5 py-4 max-w-2xl mx-auto w-full space-y-3">
            <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/45 px-1">
              Explore & Support
            </div>
            <div className="rounded-2xl border border-line bg-paper overflow-hidden divide-y divide-line/60 shadow-xs">
              <button
                onClick={() => dispatch({ type: 'GO', screen: 'safety' })}
                className="tap w-full flex items-center justify-between p-4 text-left hover:bg-bone/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-bone grid place-items-center text-obsidian/70">
                    <Shield size={17} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-obsidian">Safety Centre</div>
                    <div className="text-[11px] text-obsidian/50">Escrow protection, verification & disputes</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-obsidian/30" />
              </button>
              <button
                onClick={() => dispatch({ type: 'GO', screen: 'legal' })}
                className="tap w-full flex items-center justify-between p-4 text-left hover:bg-bone/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-bone grid place-items-center text-obsidian/70">
                    <FileText size={17} />
                  </div>
                  <div>
                    <div className="text-[13.5px] font-medium text-obsidian">Legal & Terms</div>
                    <div className="text-[11px] text-obsidian/50">Platform agreements and cancellation policies</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-obsidian/30" />
              </button>
            </div>

            {/* Become a creator prompt */}
            <div className="p-4 rounded-2xl bg-paper border border-line flex items-center justify-between gap-3 shadow-xs">
              <div>
                <div className="text-[13.5px] font-semibold text-obsidian">Are you a creative professional?</div>
                <div className="text-[11px] text-obsidian/55 mt-0.5">List your services and get booked on FTC.</div>
              </div>
              <button
                onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
                className="tap shrink-0 px-3.5 py-2 rounded-xl bg-obsidian text-paper text-[12px] font-semibold hover:bg-obsidian/90 transition cursor-pointer"
              >
                Join as Creator
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const u = user ?? {}
  const name: string = (u as any).name || (isC ? 'Creator' : 'Client')
  const handle: string = normalizeHandle((u as any).handle)
  const city: string = (u as any).city || 'Delhi NCR'
  const locality: string = (u as any).locality || ''

  const copyBookingLink = async () => {
    if (!handle) return
    const link = getProfileUrl(handle)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(link)
      } else {
        const el = document.createElement('textarea')
        el.value = link
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const startCreatorOnboarding = () => {
    setShowCreatorModal(false)
    dispatch({ type: 'START_CREATOR_ONBOARD', origin: 'me' })
  }

  const bookingCount = isC ? creatorBookingsCount : lastBooking ? 1 : 0

  const clientMenu = [
    { icon: CalendarCheck, label: 'My Bookings',    sub: bookingCount > 0 ? `${bookingCount} active booking` : 'No upcoming bookings', s: 'bookings' },
    { icon: Bookmark,      label: 'Saved Creators', sub: `${savedCount} creators saved`,       s: 'saved' },
    { icon: Bell,          label: 'Notifications',  sub: 'Account & booking updates',              s: 'notifications' },
    { icon: MessageCircle, label: 'Messages',       sub: 'Client chats & custom quotes',           s: 'inbox' },
    { icon: Star,          label: 'My Reviews',     sub: 'Reviews you\'ve submitted',              s: 'reviews' },
    { icon: Shield,        label: 'Safety Centre',  sub: 'Escrow protection & disputes',           s: 'safety' },
    { icon: FileText,      label: 'Legal & Contracts', sub: 'Booking contract & policies',         s: 'legal' },
    { icon: Settings,      label: 'Account Settings', sub: 'Profile, notifications, security',      s: 'settings' },
  ]

  const creatorMenu = [
    { icon: Calendar,      label: 'Calendar & Slots', sub: 'Manage availability & open dates',       s: 'calendar' },
    { icon: Wallet,        label: 'Payouts & Revenue', sub: 'Direct bank & UPI settlements',         s: 'payouts' },
    { icon: MessageCircle, label: 'Messages & Quotes', sub: 'Client inquiries & proposals',          s: 'inbox' },
    { icon: Star,          label: 'Client Reviews', sub: `${bookingCount} reviews verified`,          s: 'reviews' },
    { icon: Link2,         label: 'Link-in-Bio',    sub: `profile/${handle}`,                                 s: 'linkbio' },
    { icon: Shield,        label: 'Safety Centre',  sub: 'Escrow protection & disputes',           s: 'safety' },
    { icon: FileText,      label: 'Legal & Agreements', sub: 'Your signed agreements',              s: 'legal' },
    { icon: Settings,      label: 'Account Settings', sub: 'Profile, notifications, security',      s: 'settings' },
  ]

  const menu = isC ? creatorMenu : clientMenu
  const stats = isC
    ? [[String(bookingCount), 'Jobs'], [bookingCount > 0 ? '4.9' : '5.0', 'Rating'], [String(bookingCount), 'Reviews']]
    : [[String(bookingCount), 'Bookings'], [String(savedCount), 'Saved'], [String(bookingCount), 'Reviews']]

  const go = (s: string) => dispatch(s === 'inbox' ? { type: 'GO_TAB', tab: 'inbox', viaMenu: true } : { type: 'GO', screen: s as any })

  const handleLogout = async () => {
    await signOutCleanly()
  }

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
                {hasCreatorProfile ? (
                  <button
                    onClick={() => {
                      dispatch({ type: 'SET_ROLE', isCreator: !isC })
                    }}
                    className="tap px-3 py-1.5 rounded-full bg-paper/10 text-paper text-[11px] font-semibold hover:bg-paper/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={12} className="text-acid" />
                    {isC ? 'Switch to Client Mode' : 'Switch to Creator Mode'}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCreatorModal(true)}
                    className="tap px-3 py-1.5 rounded-full bg-acid text-obsidian text-[11px] font-semibold hover:bg-acid/90 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles size={12} className="text-obsidian" />
                    Become a Creator
                  </button>
                )}
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
                    <span>{getProfileUrl(handle).replace(/^https?:\/\//, '')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = handle || supabaseUserId || selectedCreatorId
                        if (targetId) {
                          dispatch({ type: 'OPEN_CREATOR', id: targetId })
                        }
                      }}
                      className="text-paper/40 hover:text-paper transition cursor-pointer"
                      title="Preview client booking page"
                    >
                      <ExternalLink size={16} />
                    </button>
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
            <button onClick={() => setShowCreatorModal(true)} className="tap w-full mt-2 p-5 rounded-2xl bg-acid text-left relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-36 h-36 dots-obsidian opacity-20 pointer-events-none" style={{ transform: 'translate(25%,-25%)' }} />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-obsidian grid place-items-center shrink-0 shadow">
                  <Sparkles size={24} className="text-acid" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl leading-tight text-obsidian">Become an FTC Verified Creator</div>
                  <div className="text-[12.5px] text-obsidian/75 mt-0.5">Build your profile, list packages, and accept escrow-protected bookings in ~3 minutes.</div>
                </div>
                <ChevronRight size={20} className="shrink-0 text-obsidian" />
              </div>
            </button>
          )}

          {/* Menu Cards — Responsive 3-Column Grid on Desktop */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {menu.map(r => {
              const isInbox = r.s === 'inbox'
              return (
                <button
                  key={r.label}
                  disabled={isInbox}
                  onClick={() => go(r.s)}
                  className={cn(
                    'tap w-full flex items-center gap-3.5 p-4 rounded-2xl bg-paper border border-line text-left transition',
                    isInbox
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:border-obsidian/40 hover:shadow-md group cursor-pointer'
                  )}
                  title={isInbox ? 'Messaging coming soon' : undefined}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl bg-bone grid place-items-center shrink-0 transition-colors',
                    !isInbox && 'group-hover:bg-obsidian group-hover:text-paper'
                  )}>
                    <r.icon size={18} className={cn('text-obsidian/75', !isInbox && 'group-hover:text-acid transition-colors')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-obsidian">{r.label}</div>
                    <div className="text-[11.5px] text-obsidian/55 truncate mt-0.5">{r.sub}</div>
                  </div>
                  <ChevronRight size={15} className={cn('text-obsidian/30 shrink-0', !isInbox && 'group-hover:translate-x-0.5 transition-transform')} />
                </button>
              )
            })}
          </div>

          {/* Account Footer & Log Out */}
          <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 pb-8">
            <div className="flex flex-wrap items-center gap-2.5">
              {hasCreatorProfile && (
                <>
                  <button
                    onClick={() => dispatch({ type: 'SET_ROLE', isCreator: !isC })}
                    className="tap px-4 py-2.5 rounded-xl bg-iris text-paper text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-iris/90 transition"
                  >
                    <Sparkles size={14} /> {isC ? 'Switch to Client Mode' : 'Switch to Creator Mode'}
                  </button>
                  {isC && supabaseUserId && (
                    <button
                      onClick={() => {
                        const target = handle || supabaseUserId
                        if (target) {
                          dispatch({ type: 'OPEN_CREATOR', id: target })
                        }
                      }}
                      className="tap px-4 py-2.5 rounded-xl bg-paper border border-line text-[12.5px] font-semibold text-obsidian hover:bg-bone transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Preview how clients see your profile"
                    >
                      <ExternalLink size={14} /> Preview Public Profile
                    </button>
                  )}
                </>
              )}
              {!hasCreatorProfile && (
                <button
                  onClick={() => setShowCreatorModal(true)}
                  className="tap px-4 py-2.5 rounded-xl bg-acid text-obsidian text-[12.5px] font-semibold flex items-center gap-1.5 shadow-sm hover:bg-acid/90"
                >
                  <Sparkles size={14} /> Become a Creator
                </button>
              )}
              <button
                onClick={handleLogout}
                className="tap px-4 py-2.5 rounded-xl bg-paper border border-line text-[12.5px] font-semibold text-danger hover:bg-danger/10 transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
            <div className="text-[11px] text-obsidian/40 font-mono">FTC Creator Marketplace v1.1.0</div>
          </div>
        </div>
      </div>

      {/* Become a Creator Value Sheet / Modal */}
      {showCreatorModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreatorModal(false) }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-obsidian/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-paper border border-line rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom duration-300 pb-[max(24px,env(safe-area-inset-bottom))] overscroll-contain">
            {/* Close Button */}
            <button
              onClick={() => setShowCreatorModal(false)}
              className="tap absolute top-5 right-5 w-8 h-8 rounded-full bg-bone hover:bg-obsidian/10 grid place-items-center text-obsidian/60 hover:text-obsidian transition"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-iris/10 text-iris grid place-items-center mb-4">
              <Sparkles size={28} />
            </div>

            <h2 className="font-display text-2xl font-light tracking-tight text-obsidian">
              Start earning on <span className="italic font-normal">FTC</span>
            </h2>
            <p className="text-[13px] text-obsidian/60 mt-1 leading-relaxed">
              Showcase your creative work, accept bookings directly, and get paid with guaranteed escrow protection.
            </p>

            <div className="my-6 space-y-3.5 bg-bone/40 p-4 rounded-2xl border border-line">
              <div className="flex items-start gap-3 text-[13px]">
                <div className="w-6 h-6 rounded-lg bg-paper border border-line grid place-items-center shrink-0 mt-0.5">
                  <Zap size={13} className="text-iris" />
                </div>
                <div>
                  <span className="font-semibold text-obsidian">0% Commission:</span>
                  <span className="text-obsidian/70"> Keep 100% of your earnings on direct bookings.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-[13px]">
                <div className="w-6 h-6 rounded-lg bg-paper border border-line grid place-items-center shrink-0 mt-0.5">
                  <Shield size={13} className="text-iris" />
                </div>
                <div>
                  <span className="font-semibold text-obsidian">Escrow Security:</span>
                  <span className="text-obsidian/70"> Client funds are locked in escrow before you begin work.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 text-[13px]">
                <div className="w-6 h-6 rounded-lg bg-paper border border-line grid place-items-center shrink-0 mt-0.5">
                  <Link2 size={13} className="text-iris" />
                </div>
                <div>
                  <span className="font-semibold text-obsidian">Personal Booking Link:</span>
                  <span className="text-obsidian/70"> Share your link-in-bio on Instagram for 1-click booking.</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={startCreatorOnboarding}
                className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition"
              >
                <span>Start Creator Profile Setup (3 mins)</span>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="tap w-full py-2.5 text-[13px] font-medium text-obsidian/50 hover:text-obsidian transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
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
  const filters = useAppStore(s => s.filters)
  const dispatch = useAppStore(s => s.dispatch)
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
              className={cn('tap px-3.5 py-2 rounded-xl text-[12.5px] font-medium border transition', filters.discipline === d ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line')}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
