import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Shield, Lock, Star, Bookmark, Share2, Users, X } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { pic } from '@/data/constants'
import { cn } from '@/utils'

const DEFAULT_DELIVERABLES = (disc: string) => {
  const map: Record<string, string[]> = {
    Photography: ['Shot list planning', 'Shoot day', 'Edited selects (40+)'],
    Videography: ['Pre-production call', 'Shoot day', 'Rough cut review', 'Final film delivery'],
    'Graphic Design': ['Concept directions (3)', 'First round designs', 'Final files (AI/PDF)'],
    Illustration: ['Moodboard + style frames', 'First batch', 'Final batch + source files'],
    Writing: ['Brief + outline', 'First draft', 'Revised final copy'],
    Music: ['Rough mix', 'Revised mix', 'Master + stems delivery'],
  }
  return (map[disc] ?? ['Deliverable 1', 'Deliverable 2', 'Deliverable 3']).map(name => ({ name, done: false, approved: false }))
}

export function SponsorshipDetailScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const c = state.campaigns.find(x => x.id === state.selectedCampaignId)
  const role = state.sponsorRole
  const existing = state.deals.find(d => d.campaignId === state.selectedCampaignId)
  const [showApply, setShowApply] = useState(false)
  const [pitch, setPitch] = useState('')
  const [quote, setQuote] = useState('')
  if (!c) return null
  const isBrand = c.kind === 'brand'
  const deliverableNames = DEFAULT_DELIVERABLES(c.discipline).map(d => d.name)

  const submitApplication = () => {
    const q = parseInt(String(quote).replace(/[^0-9]/g, ''), 10) || c.budgetMin || 25000
    dispatch({
      type: 'APPLY_SPONSORSHIP',
      deal: {
        id: 'deal' + Date.now(), campaignId: c.id, campaignTitle: c.title,
        brandName: c.posterName, brandAvatar: c.posterAvatar,
        creatorName: state.user?.name ?? 'You', creatorAvatar: pic('you-av', 200, 200), creatorId: 'c1',
        quote: q, pitch: pitch || 'Excited about this one — portfolio attached.', stage: 'applied',
        deliverables: DEFAULT_DELIVERABLES(c.discipline), payments: [],
      } as any,
    })
  }

  const statsBlock = (
    <div className="mt-5 grid grid-cols-2 gap-3">
      {[
        ['Budget', c.budgetMin && c.budgetMax ? `₹${(c.budgetMin / 1000).toFixed(0)}–${(c.budgetMax / 1000).toFixed(0)}K` : 'On request'],
        ['Closes', c.deadline || 'Open'],
        ['Location', (c as any).city || 'Remote'],
        ['Discipline', c.discipline || '—'],
      ].map(([label, val]) => (
        <div key={label as string} className="p-3.5 rounded-2xl bg-bone">
          <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">{label}</div>
          <div className="font-display text-xl mt-0.5">{val}</div>
        </div>
      ))}
    </div>
  )

  const applyCtaBlock = existing
    ? <button onClick={() => dispatch({ type: 'OPEN_DEAL', id: existing.id })} className="tap w-full py-4 rounded-2xl bg-iris text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
        {role === 'brand' ? 'Review applicant' : 'Track your deal'} <ArrowRight size={16} />
      </button>
    : role === 'brand'
      ? <button onClick={() => dispatch({ type: 'GO_TAB', tab: 'me' })} className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px]">{c.applicants} applicants · review in your deals</button>
      : <button onClick={() => setShowApply(true)} className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2">Apply — takes 2 minutes <ArrowRight size={16} /></button>

  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden min-h-0">
      <div className="absolute top-0 inset-x-0 z-10 px-5 pt-2 flex items-center justify-between pointer-events-none">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <button className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow"><Bookmark size={16} /></button>
          <button className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow"><Share2 size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-28 md:pb-8 min-h-0">
      <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start md:px-6 md:pt-6">
      <div className="md:min-w-0">
        {c.hero
          ? <div className="relative h-72"><img src={c.hero} className="w-full h-full object-cover" alt="" /><div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/30 to-transparent" /></div>
          : <div className="h-32 bg-bone" />
        }
        <div className="px-5 -mt-10 relative">
          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider', isBrand ? 'bg-acid text-obsidian' : 'bg-iris text-paper')}>
            {isBrand ? 'Brand campaign' : 'Creator post'}
          </span>
          <h1 className="mt-3 font-display text-3xl tracking-tight leading-[1.05]">{c.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <img src={c.posterAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div>
              <div className="text-[13px] font-semibold">{c.posterName}</div>
              <div className="text-[11px] text-obsidian/60">Posted {c.postedAgo}</div>
            </div>
          </div>
          <div className="md:hidden">{statsBlock}</div>
          <div className="mt-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">The brief</div>
            <p className="text-[14px] leading-relaxed text-obsidian/80">{c.description}</p>
          </div>
          <div className="mt-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50 mb-3">Deliverables</div>
            <div className="space-y-2">
              {deliverableNames.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px]">
                  <div className="w-4 h-4 rounded-full bg-acid grid place-items-center shrink-0 mt-0.5"><Check size={10} className="text-obsidian" strokeWidth={3} /></div>
                  <span className="text-obsidian/80">{r}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-bone space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">How the deal works</div>
            {([[Check, 'Standard contract', 'Scope, usage rights & revisions agreed upfront. Both sides e-sign in the app.'], [Lock, 'Escrow payment', '50% advance held safely at signing. Nobody chases invoices.'], [Star, 'Release on approval', 'Final 50% releases when deliverables are approved.']] as any[]).map(([I, t, d], i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-iris-tint grid place-items-center shrink-0"><I size={14} className="text-iris" /></div>
                <div><div className="text-[12px] font-semibold">{t}</div><div className="text-[11px] text-obsidian/60 mt-0.5 leading-snug">{d}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-iris-tint flex items-center gap-3">
            <Users size={20} className="text-iris shrink-0" />
            <div className="flex-1">
              <div className="text-[12px] font-semibold">{c.applicants} creators applied</div>
              <div className="text-[11px] text-obsidian/60 mt-0.5">Average response time: under 2 hours</div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block md:sticky md:top-6">
        <div className="rounded-2xl border border-line bg-paper p-5">
          {statsBlock}
          <div className="mt-5">{applyCtaBlock}</div>
        </div>
      </div>
      </div>
      </div>

      <div className="md:hidden absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper border-t border-line">
        {applyCtaBlock}
      </div>

      {showApply && (
        <div className="absolute inset-0 z-20 bg-obsidian/80 flex flex-col justify-end">
          <div className="bg-paper rounded-3xl mx-5 mb-6 p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-xl tracking-tight">Apply to this campaign</div>
              <button onClick={() => setShowApply(false)} className="tap p-2 -mr-2"><X size={18} /></button>
            </div>
            <div className="mt-4">
              <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your quote (₹)</label>
              <input value={quote} onChange={e => setQuote(e.target.value)} inputMode="numeric" placeholder={c.budgetMin ? `${c.budgetMin.toLocaleString('en-IN')} – ${c.budgetMax.toLocaleString('en-IN')}` : 'e.g. 50,000'} className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
            </div>
            <div className="mt-4">
              <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Why you?</label>
              <textarea value={pitch} onChange={e => setPitch(e.target.value)} rows={3} placeholder="One short pitch — your style, your relevant work, your plan…" className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30 resize-none" />
            </div>
            <div className="mt-3 p-3 rounded-xl bg-bone flex items-center gap-2">
              <Shield size={14} className="text-iris shrink-0" />
              <span className="text-[11px] text-obsidian/60">If selected, a standard contract + escrow payment is set up automatically.</span>
            </div>
            <button onClick={() => { submitApplication(); setShowApply(false) }} className="tap w-full mt-4 py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
              Send application <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
