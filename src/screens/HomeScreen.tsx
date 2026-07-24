import { Heart, Bell, Search, SlidersHorizontal, ChevronRight, Sparkles, MessageCircle } from 'lucide-react'
import { CreatorCardLarge } from '@/components/creator/CreatorCardLarge'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { CREATORS, DISCIPLINE_CONFIG } from '@/data/creators'
import { CAMPAIGNS, pic, inr } from '@/data/constants'
import { CreatorPipelineHome } from './CreatorPipelineHome'

export function HomeScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  if (state.isCreator) return <CreatorPipelineHome />

  const featured = CREATORS.filter(c => c.tier === 'Platinum').slice(0, 5)
  const rising = CREATORS.filter(c => c.tier === 'Rising').slice(0, 4)
  const liveCampaigns = CAMPAIGNS.slice(0, 3)

  return (
    <div className="flex-1 flex flex-col bg-paper overflow-hidden">
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/50">Mumbai · Thursday</div>
          <div className="font-display text-xl tracking-tight mt-0.5">
            Good morning, <span className="italic">{state.user.name.split(' ')[0]}</span>.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => dispatch({ type: 'GO', screen: 'saved' })} className="tap w-10 h-10 rounded-full border border-line grid place-items-center relative">
            <Heart size={18} />
            {state.saved.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-acid text-obsidian text-[9px] font-bold rounded-full grid place-items-center">
                {state.saved.length}
              </span>
            )}
          </button>
          <button onClick={() => dispatch({ type: 'GO', screen: 'notifications' })} className="tap w-10 h-10 rounded-full border border-line grid place-items-center relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-danger text-paper text-[9px] font-bold rounded-full grid place-items-center">3</span>
          </button>
        </div>
      </div>

      <div className="app-scroll pb-nav">
        {/* Search bar */}
        <div className="px-5 mb-6">
          <button onClick={() => dispatch({ type: 'GO', screen: 'discover' })} className="tap w-full flex items-center gap-3 bg-bone border border-line rounded-2xl px-4 py-4 text-left">
            <Search size={18} className="text-obsidian/40" />
            <span className="flex-1 text-[14px] text-obsidian/40">Search for a tattoo artist in Bandra…</span>
            <div className="w-8 h-8 rounded-xl bg-obsidian grid place-items-center">
              <SlidersHorizontal size={14} className="text-paper" />
            </div>
          </button>
        </div>

        {/* Category pills */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-2">
            {Object.keys(DISCIPLINE_CONFIG).slice(0, 8).map(d => (
              <button
                key={d}
                onClick={() => { dispatch({ type: 'SET_FILTER', patch: { discipline: d } }); dispatch({ type: 'GO', screen: 'discover' }) }}
                className="tap flex flex-col items-center gap-1.5 shrink-0 w-16"
              >
                <div className="w-14 h-14 rounded-2xl bg-bone border border-line grid place-items-center">
                  <span className="text-xl">
                    {d === 'Photography' ? '📸' : d === 'Videography' ? '🎬' : d === 'UI/UX' ? '💻' : d === 'Music' ? '🎵' : d === 'Tattoo' ? '🖊️' : d === 'Illustration' ? '🎨' : d === 'Writing' ? '✍️' : '💃'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-obsidian/70 text-center leading-tight">{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming session card */}
        <div className="px-5 mb-8">
          <div className="rounded-3xl bg-obsidian text-paper p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 dots-acid opacity-20 pointer-events-none" style={{ transform: 'translate(25%, -25%)' }} />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.14em] text-acid mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
                Your next session · in 3 days
              </div>
              <div className="font-display text-2xl tracking-tight">Portrait shoot with Ananya</div>
              <div className="text-[12px] text-paper/70 mt-1">Sun, Apr 27 · 10:00 AM · Bandra studio</div>
              <div className="flex items-center gap-3 mt-5">
                <img src={pic('Ananya Desai-av', 200, 200)} className="w-10 h-10 rounded-full object-cover border-2 border-paper" alt="" />
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => { dispatch({ type: 'OPEN_CREATOR', id: 'c1' }); dispatch({ type: 'GO', screen: 'chat' }) }}
                    className="tap flex-1 py-2.5 rounded-xl bg-paper/10 text-paper text-[12px] font-medium flex items-center justify-center gap-1"
                  >
                    <MessageCircle size={13} /> Message
                  </button>
                  <button onClick={() => dispatch({ type: 'GO', screen: 'bookings' })} className="tap flex-1 py-2.5 rounded-xl bg-acid text-obsidian text-[12px] font-medium flex items-center justify-center gap-1">
                    Details <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured creators */}
        <div className="mb-8">
          <div className="flex items-end justify-between px-5 mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">Platinum tier · Mumbai</div>
              <div className="font-display text-xl tracking-tight mt-0.5">Top-booked <span className="italic">this month</span></div>
            </div>
            <button onClick={() => dispatch({ type: 'GO', screen: 'discover' })} className="tap flex items-center gap-0.5 text-[12px] font-medium text-iris">
              See all <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 md:overflow-visible md:px-5">
            {featured.map(c => (
              <CreatorCardLarge key={c.id} c={c} onOpen={() => dispatch({ type: 'OPEN_CREATOR', id: c.id })} />
            ))}
          </div>
        </div>

        {/* Rising stars */}
        <div className="mb-8">
          <div className="flex items-end justify-between px-5 mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">Rising stars · 30d</div>
              <div className="font-display text-xl tracking-tight mt-0.5">New & <span className="italic">climbing fast</span></div>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4 md:overflow-visible md:px-5">
            {rising.map(c => (
              <CreatorCardLarge key={c.id} c={c} onOpen={() => dispatch({ type: 'OPEN_CREATOR', id: c.id })} />
            ))}
          </div>
        </div>

        {/* Active campaigns preview */}
        <div className="px-5 mb-8">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50">Open briefs</div>
              <div className="font-display text-xl tracking-tight mt-0.5">Brand <span className="italic">campaigns</span></div>
            </div>
            <button onClick={() => dispatch({ type: 'GO', screen: 'campaigns' })} className="tap flex items-center gap-0.5 text-[12px] font-medium text-iris">
              See all <ChevronRight size={13} />
            </button>
          </div>
          <div className="space-y-3">
            {liveCampaigns.map(c => (
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
                  <div className="ml-auto text-[11px] font-mono text-obsidian/50">{c.postedAgo}</div>
                </div>
                <p className="text-[13px] leading-snug line-clamp-2">{c.title}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-obsidian/60">
                  <span>{inr(c.budgetMin)}–{inr(c.budgetMax)}</span>
                  <span>· {c.applicants} applicants</span>
                  {c.city && <span>· {c.city}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Creator CTA */}
        <div className="px-5 mb-6">
          <button onClick={() => dispatch({ type: 'SET_ROLE', isCreator: true })} className="tap w-full p-5 rounded-3xl bg-acid relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 w-40 h-40 dots-obsidian opacity-30 pointer-events-none" style={{ transform: 'translate(25%, -25%)' }} />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-obsidian grid place-items-center">
                <Sparkles size={26} className="text-acid" />
              </div>
              <div className="flex-1">
                <div className="font-display text-xl tracking-tight">Are you a <span className="italic">creator?</span></div>
                <div className="text-[12px] text-obsidian/70">Switch to creator view — manage your pipeline, quotes & calendar.</div>
              </div>
              <ChevronRight size={18} />
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
