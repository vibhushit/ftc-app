import { useState } from 'react'
import { X, Shield } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { pic } from '@/data/constants'
import { cn } from '@/utils'

export function SponsorComposeScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [kind, setKind] = useState<'brand' | 'creator'>(state.sponsorRole === 'brand' ? 'brand' : 'creator')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [budget, setBudget] = useState('')
  const [discipline, setDiscipline] = useState('Photography')

  const post = () => {
    const nums = String(budget).replace(/[^0-9\-–]/g, ' ').split(/[\-–\s]+/).filter(Boolean).map(Number)
    const bMin = nums[0] || 25000, bMax = nums[1] || Math.round(bMin * 1.8)
    dispatch({
      type: 'ADD_CAMPAIGN',
      campaign: {
        id: 'cp' + Date.now(), kind,
        posterName: kind === 'brand' ? 'Your Brand' : (state.user?.name ?? 'You'),
        posterAvatar: pic('you-brand', 200, 200), posterHandle: '@you', posterVerified: true,
        title: title || (kind === 'brand' ? 'Untitled campaign' : 'Available for work'),
        description: desc || 'Details to be discussed in chat.',
        discipline, city: state.user?.city ?? 'Mumbai', budgetMin: bMin, budgetMax: bMax,
        deadline: 'Open', applicants: 0, saves: 0, hero: pic('camp' + Date.now(), 1200, 700), postedAgo: 'just now',
      },
    })
  }

  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden min-h-0">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-line shrink-0">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap -ml-2 p-2"><X size={22} /></button>
        <div className="font-display text-lg">New sponsorship post</div>
        <div className="w-8" />
      </div>
      <div className="app-scroll px-5 pt-5 pb-28">
        <div className="flex gap-2 p-1 bg-bone rounded-2xl">
          <button onClick={() => setKind('brand')} className={cn('tap flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition', kind === 'brand' ? 'bg-paper shadow-sm' : 'text-obsidian/60')}>I'm hiring creators</button>
          <button onClick={() => setKind('creator')} className={cn('tap flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition', kind === 'creator' ? 'bg-paper shadow-sm' : 'text-obsidian/60')}>I'm offering services</button>
        </div>
        <div className="mt-6 space-y-5">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'brand' ? 'e.g. Reel creators for our summer launch' : 'e.g. Available for brand shoots this month'} className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={5} placeholder={kind === 'brand' ? "What's the product, what content do you need?" : 'What do you offer, your style, the kind of brands you want to work with…'} className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30 resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">{kind === 'brand' ? 'Budget range (₹)' : 'Your rate (₹)'}</label>
            <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="25,000 – 75,000" className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Discipline</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {['Photography', 'Videography', 'Illustration', 'Graphic Design', 'Writing', 'Music'].map(d => (
                <button key={d} onClick={() => setDiscipline(d)} className={cn('tap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition', discipline === d ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/70 border border-line')}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-iris-tint flex items-center gap-2">
            <Shield size={14} className="text-iris shrink-0" />
            <span className="text-[11px] text-obsidian/70">{kind === 'brand' ? 'Applicants come with quotes. Accept one and the contract + escrow is set up for you.' : 'Brands who pick you get a standard contract + escrow payment automatically.'}</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper border-t border-line">
        <button onClick={post} className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px]">
          Post {kind === 'brand' ? 'campaign' : 'availability'}
        </button>
      </div>
    </div>
  )
}
