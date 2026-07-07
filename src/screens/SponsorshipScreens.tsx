import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, ArrowRight, Check, Shield, Lock, Clock,
  Plus, X, Star, Bookmark, Share2, Users, MapPin,
  MessageCircle, Upload, Eye,
} from 'lucide-react'
import { StatusBar } from '@/components/ui/StatusBar'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { DEAL_STAGES, inr, pic } from '@/data/constants'
import { cn } from '@/utils'
import type { Deal, Campaign } from '@/types'

/* ─── Helpers ─── */
const stageIdx = (stage: string) => DEAL_STAGES.findIndex(s => s.key === stage)

const splitQuote = (q: number) => [
  { name: '50% advance', amount: Math.round(q * 0.5), status: 'pending' as const },
  { name: '50% on approval', amount: Math.round(q * 0.5), status: 'pending' as const },
]

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

/* ─── SponsorshipCard ─── */
function SponsorshipCard({ campaign, deal, onClick }: { campaign: Campaign; deal?: Deal; onClick: () => void }) {
  const isBrand = campaign.kind === 'brand'
  return (
    <div onClick={onClick} className="tap bg-paper rounded-3xl overflow-hidden border border-line active:scale-[0.99] transition">
      {campaign.hero && (
        <div className="relative h-44 overflow-hidden">
          <img src={campaign.hero} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <span className={cn('px-2 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider', isBrand ? 'bg-acid text-obsidian' : 'bg-iris text-paper')}>
              {isBrand ? 'Brand campaign' : 'Creator post'}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-obsidian/80 text-paper text-[11px] font-mono">
            <Clock size={11} /> {campaign.postedAgo}
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <img src={campaign.posterAvatar} className="w-7 h-7 rounded-full object-cover" alt="" />
          <div className="flex items-center gap-1 text-[12px]">
            <span className="font-semibold">{campaign.posterName}</span>
          </div>
          {!campaign.hero && (
            <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider', isBrand ? 'bg-acid text-obsidian' : 'bg-iris text-paper')}>
              {isBrand ? 'Brand campaign' : 'Creator post'}
            </span>
          )}
        </div>
        <h3 className="font-display text-xl leading-tight tracking-tight">{campaign.title}</h3>
        <p className="mt-2 text-[13px] text-obsidian/70 leading-relaxed line-clamp-2">{campaign.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {campaign.discipline && <span className="px-2 py-0.5 rounded-full bg-bone text-[10px] font-medium">{campaign.discipline}</span>}
          {campaign.city && <span className="px-2 py-0.5 rounded-full bg-bone text-[10px] font-medium flex items-center gap-1"><MapPin size={9} />{campaign.city}</span>}
          {campaign.budgetMin && campaign.budgetMax && <span className="px-2 py-0.5 rounded-full bg-iris-tint text-iris text-[10px] font-semibold">₹{(campaign.budgetMin / 1000).toFixed(0)}K–{(campaign.budgetMax / 1000).toFixed(0)}K</span>}
        </div>
        <div className="mt-3 pt-3 border-t border-line flex items-center justify-between text-[11px] text-obsidian/60">
          <span className="flex items-center gap-1"><Shield size={11} className="text-iris" /> Escrow protected</span>
          {deal
            ? <span className="flex items-center gap-1 font-semibold text-iris">You applied <ArrowRight size={12} /></span>
            : <span className="flex items-center gap-3"><span className="flex items-center gap-1"><Users size={11} /> {campaign.applicants}</span>{campaign.deadline && <span><Clock size={11} className="inline mr-0.5" />{campaign.deadline}</span>}</span>
          }
        </div>
      </div>
    </div>
  )
}

/* ─── DealRow ─── */
function DealRow({ deal, role, onOpen }: { deal: Deal; role: string; onOpen: () => void }) {
  const idx = stageIdx(deal.stage)
  const other = role === 'creator' ? deal.brandName : deal.creatorName
  const avatar = role === 'creator' ? deal.brandAvatar : deal.creatorAvatar
  return (
    <button onClick={onOpen} className="tap w-full text-left p-4 rounded-2xl bg-paper border border-line">
      <div className="flex items-center gap-3">
        <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold truncate">{deal.campaignTitle}</div>
          <div className="text-[11px] text-obsidian/60 mt-0.5">{other} · {inr(deal.quote)}</div>
        </div>
        <span className={cn('px-2 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider shrink-0', deal.stage === 'completed' ? 'bg-obsidian text-acid' : deal.stage === 'active' ? 'bg-acid text-obsidian' : deal.stage === 'contract' ? 'bg-iris text-paper' : 'bg-bone text-obsidian/70 border border-line')}>
          {DEAL_STAGES[idx]?.label ?? deal.stage}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1">
        {DEAL_STAGES.map((s, i) => (
          <div key={s.key} className={cn('h-1 flex-1 rounded-full', i <= idx ? 'bg-iris' : 'bg-obsidian/10')} />
        ))}
      </div>
    </button>
  )
}

/* ─── SignPad ─── */
function SignPad({ who, onDone, onCancel }: { who: string; onDone: (url: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawn = useRef(false)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#141414'
    let drawing = false
    const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height] as [number, number] }
    const down = (e: PointerEvent) => { drawing = true; drawn.current = true; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault() }
    const move = (e: PointerEvent) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault() }
    const up = () => { drawing = false }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  return (
    <div className="absolute inset-0 z-30 bg-obsidian/80 flex flex-col justify-center">
      <div className="bg-paper rounded-3xl mx-5 p-5">
        <div className="font-display text-xl tracking-tight">Sign as {who}</div>
        <div className="text-[11px] text-obsidian/60 mt-1">Draw your signature below. This e-signature is binding for this deal.</div>
        <canvas ref={ref} width={290} height={150} className="mt-3 w-full bg-bone rounded-2xl border-2 border-dashed border-line" style={{ touchAction: 'none', height: 150 }} />
        <div className="mt-4 flex gap-2">
          <button onClick={() => { const cv = ref.current; if (cv) cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height); drawn.current = false }} className="tap flex-1 py-3 rounded-xl bg-bone text-[13px] font-semibold">Clear</button>
          <button onClick={onCancel} className="tap flex-1 py-3 rounded-xl bg-bone text-[13px] font-semibold">Cancel</button>
          <button onClick={() => { if (!drawn.current) return; onDone(ref.current?.toDataURL('image/png') ?? '') }} className="tap flex-1 py-3 rounded-xl bg-obsidian text-acid text-[13px] font-semibold">Sign</button>
        </div>
      </div>
    </div>
  )
}

/* ─── Sponsorships Screen ─── */
export function SponsorshipsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const role = state.sponsorRole
  const [tab, setTab] = useState('feed')
  const [filter, setFilter] = useState('all')
  const feed = role === 'brand'
    ? state.campaigns.filter(c => c.kind === 'brand')
    : state.campaigns.filter(c => filter === 'all' ? true : c.kind === filter)
  const deals = state.deals
  const activeCount = deals.filter(d => d.stage === 'active').length
  const inEscrow = deals.flatMap(d => d.payments).filter(p => p.status === 'escrow').reduce((a, p) => a + p.amount, 0)
  const needsAction = 0

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0">
      <div className="dynamic-island" />
      <StatusBar />
      <div className="px-5 pt-2 pb-3 bg-paper border-b border-line shrink-0">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-iris font-mono font-semibold">Brands × creators</div>
            <h1 className="font-display text-3xl tracking-tight leading-none mt-1">Sponsorships</h1>
          </div>
          <button onClick={() => dispatch({ type: 'GO', screen: 'campaignCompose' })} className="tap w-10 h-10 rounded-full bg-obsidian text-paper grid place-items-center">
            <Plus size={20} />
          </button>
        </div>
        <div className="mt-4 flex gap-2 p-1 bg-bone rounded-2xl">
          {([['creator', "I'm a creator"], ['brand', "I'm a brand"]] as [typeof role, string][]).map(([r, lab]) => (
            <button key={r} onClick={() => dispatch({ type: 'SET_SPONSOR_ROLE', role: r })} className={cn('tap flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition', role === r ? 'bg-paper shadow-sm' : 'text-obsidian/60')}>
              {lab}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          {(role === 'creator'
            ? [['feed', 'Opportunities'], ['deals', 'My deals']]
            : [['feed', 'My campaigns'], ['deals', 'Applicants & deals']]
          ).map(([t, lab]) => (
            <button key={t} onClick={() => setTab(t)} className={cn('tap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition flex items-center gap-1.5', tab === t ? 'bg-obsidian text-paper' : 'bg-bone text-obsidian/70 border border-line')}>
              {lab}
              {t === 'deals' && needsAction > 0 && <span className={cn('min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold grid place-items-center', tab === t ? 'bg-acid text-obsidian' : 'bg-danger text-paper')}>{needsAction}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'feed' ? (
        <div className="app-scroll pb-nav px-5 pt-4 space-y-3">
          {role === 'creator' && (
            <div className="flex gap-2">
              {['all', 'brand', 'creator'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className={cn('tap px-3.5 py-1.5 rounded-full text-[12px] font-medium transition', filter === f ? 'bg-obsidian text-paper' : 'bg-paper text-obsidian/70 border border-line')}>
                  {f === 'all' ? 'All' : f === 'brand' ? 'Brand campaigns' : 'Creator posts'}
                </button>
              ))}
            </div>
          )}
          {feed.map(c => (
            <SponsorshipCard
              key={c.id}
              campaign={c}
              deal={deals.find(d => d.campaignId === c.id)}
              onClick={() => dispatch({ type: 'OPEN_CAMPAIGN', id: c.id })}
            />
          ))}
          <div className="h-6" />
        </div>
      ) : (
        <div className="app-scroll pb-nav px-5 pt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-obsidian">
              <div className="font-display text-2xl text-acid tnum">{activeCount}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-paper/60 mt-0.5">Active</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-iris-tint">
              <div className="font-display text-2xl text-iris tnum">₹{(inEscrow / 1000).toFixed(0)}K</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-obsidian/60 mt-0.5">In escrow</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-paper border border-line">
              <div className="font-display text-2xl tnum">{deals.filter(d => d.stage === 'completed').length}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-obsidian/60 mt-0.5">Done</div>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-iris-tint flex items-center gap-2.5">
            <Shield size={16} className="text-iris shrink-0" />
            <span className="text-[11px] text-obsidian/70 leading-snug">Every deal runs on a standard contract. Payments sit in escrow and release on approval.</span>
          </div>
          {deals.length === 0 && (
            <div className="p-5 rounded-2xl bg-paper border border-line text-center">
              <div className="text-[24px]">💼</div>
              <div className="mt-2 text-[13px] font-semibold">No deals yet</div>
              <div className="text-[11px] text-obsidian/60 mt-1">{role === 'creator' ? 'Apply to a campaign to start your first deal.' : 'Post a campaign and creators will apply.'}</div>
            </div>
          )}
          {deals.map(d => <DealRow key={d.id} deal={d} role={role} onOpen={() => dispatch({ type: 'OPEN_DEAL', id: d.id })} />)}
          <div className="h-6" />
        </div>
      )}
    </div>
  )
}

/* ─── Sponsorship Detail Screen ─── */
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

  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden min-h-0">
      <StatusBar />
      <div className="absolute top-12 inset-x-0 z-10 px-5 pt-2 flex items-center justify-between pointer-events-none">
        <button onClick={() => dispatch({ type: 'BACK' })} className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <button className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow"><Bookmark size={16} /></button>
          <button className="tap pointer-events-auto w-10 h-10 rounded-full bg-paper/90 backdrop-blur grid place-items-center shadow"><Share2 size={16} /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-28 min-h-0">
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

      <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper border-t border-line">
        {existing
          ? <button onClick={() => dispatch({ type: 'OPEN_DEAL', id: existing.id })} className="tap w-full py-4 rounded-2xl bg-iris text-paper font-semibold text-[14px] flex items-center justify-center gap-2">
              {role === 'brand' ? 'Review applicant' : 'Track your deal'} <ArrowRight size={16} />
            </button>
          : role === 'brand'
            ? <button onClick={() => dispatch({ type: 'GO_TAB', tab: 'me' })} className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px]">{c.applicants} applicants · review in your deals</button>
            : <button onClick={() => setShowApply(true)} className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14px] flex items-center justify-center gap-2">Apply — takes 2 minutes <ArrowRight size={16} /></button>
        }
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

/* ─── Deal Screen ─── */
export function DealScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const deal = state.deals.find(d => d.id === state.selectedDealId)
  const [signing, setSigning] = useState<string | null>(null)
  if (!deal) return null
  const role = state.sponsorRole
  const idx = stageIdx(deal.stage)
  const upd = (patch: Partial<Deal>) => dispatch({ type: 'UPDATE_DEAL', id: deal.id, patch })
  const other = role === 'creator' ? deal.brandName : deal.creatorName
  const otherAvatar = role === 'creator' ? deal.brandAvatar : deal.creatorAvatar
  const schedule = deal.payments.length ? deal.payments : splitQuote(deal.quote).map(p => ({ ...p, status: 'pending' as const }))
  const contract = (deal as any).contract ?? { scope: deal.campaignTitle, usage: 'Digital · 12 months', exclusivity: 'None', revisions: '2 rounds', creatorSigned: false, brandSigned: false, creatorSig: null, brandSig: null }
  const finishSign = (dataUrl: string) => {
    const cKey = signing === 'creator' ? 'creatorSigned' : 'brandSigned'
    const sKey = signing === 'creator' ? 'creatorSig' : 'brandSig'
    const newContract = { ...contract, [cKey]: true, [sKey]: dataUrl }
    const both = newContract.creatorSigned && newContract.brandSigned
    upd(both ? { contract: newContract, stage: 'active', payments: splitQuote(deal.quote) } as any : { contract: newContract } as any)
    setSigning(null)
  }
  const setDeliverable = (i: number, patch: any) => {
    const deliverables = deal.deliverables.map((d, j) => j === i ? { ...d, ...patch } : d)
    const allApproved = deliverables.every(d => d.approved)
    const allPaid = deal.payments.every(p => p.status === 'released')
    upd({ deliverables, stage: allApproved && allPaid ? 'completed' : 'active' })
  }
  const setPayment = (i: number, status: any) => {
    const payments = deal.payments.map((p, j) => j === i ? { ...p, status } : p)
    const allApproved = deal.deliverables.every(d => d.approved)
    const allPaid = payments.every(p => p.status === 'released')
    upd({ payments, stage: allApproved && allPaid ? 'completed' : 'active' })
  }

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mx-5 mt-4 p-4 rounded-2xl bg-paper border border-line">
      <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50 mb-3">{label}</div>
      {children}
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-bone relative min-h-0">
      <StatusBar />
      <div className="px-5 pt-2 pb-3 bg-paper border-b border-line shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch({ type: 'BACK' })} className="tap w-10 h-10 -ml-2 grid place-items-center"><ArrowLeft size={20} /></button>
          <img src={otherAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">{deal.campaignTitle}</div>
            <div className="text-[11px] text-obsidian/60">{other} · {inr(deal.quote)}</div>
          </div>
          <button onClick={() => dispatch({ type: 'GO', screen: 'chat' })} className="tap w-10 h-10 rounded-full bg-bone grid place-items-center">
            <MessageCircle size={17} />
          </button>
        </div>
      </div>

      <div className="app-scroll pb-nav">
        {/* Stage tracker */}
        <div className="mx-5 mt-4 p-4 rounded-2xl bg-paper border border-line">
          <div className="flex items-center">
            {DEAL_STAGES.map((s, i) => {
              const done = i < idx; const cur = i === idx
              return (
                <div key={s.key} className="flex items-center flex-1">
                  {i > 0 && <div className={cn('flex-1 h-0.5', i <= idx ? 'bg-iris' : 'bg-obsidian/10')} />}
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn('w-9 h-9 rounded-full grid place-items-center border-2', cur ? 'bg-iris text-paper border-iris' : done ? 'bg-obsidian text-acid border-obsidian' : 'bg-paper text-obsidian/30 border-line')}>
                      {(done || cur) && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className={cn('text-[9px] font-mono uppercase tracking-wider', cur ? 'text-iris font-semibold' : done ? 'text-obsidian' : 'text-obsidian/40')}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* View toggle */}
        <div className="mx-5 mt-3 p-3 rounded-2xl bg-iris-tint flex items-center gap-2">
          <Eye size={14} className="text-iris shrink-0" />
          <span className="flex-1 text-[12px]">Viewing as <span className="font-semibold">{role}</span></span>
          <button onClick={() => dispatch({ type: 'SET_SPONSOR_ROLE', role: role === 'creator' ? 'brand' : 'creator' })} className="tap text-[12px] font-semibold text-iris">See the other side →</button>
        </div>

        {/* Application */}
        <Section label="Application">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">Quote</div>
              <div className="font-display text-2xl tnum">{inr(deal.quote)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50">Applied</div>
              <div className="text-[13px] font-semibold">{(deal as any).appliedAgo ?? 'recently'}</div>
            </div>
          </div>
          <p className="mt-3 text-[13px] text-obsidian/70 leading-relaxed">"{deal.pitch}"</p>
          {deal.stage === 'applied' && (
            role === 'brand'
              ? <div className="mt-4 flex gap-2">
                  <button onClick={() => upd({ stage: 'contract' })} className="tap flex-1 py-3.5 rounded-xl bg-obsidian text-paper text-[13px] font-semibold flex items-center justify-center gap-1.5">
                    <Check size={14} /> Accept — send contract
                  </button>
                  <button onClick={() => dispatch({ type: 'GO', screen: 'chat' })} className="tap px-4 py-3.5 rounded-xl bg-bone text-[13px] font-semibold">Message</button>
                </div>
              : <div className="mt-4 p-3 rounded-xl bg-bone flex items-center gap-2">
                  <Clock size={14} className="text-obsidian/50 shrink-0" />
                  <span className="text-[12px] text-obsidian/60">Waiting for {deal.brandName} to review. You'll be notified.</span>
                </div>
          )}
        </Section>

        {/* Contract */}
        {idx >= 1 && (
          <Section label="Contract · standard terms">
            <div className="space-y-2.5">
              {[['Scope', contract.scope], ['Usage rights', contract.usage], ['Exclusivity', contract.exclusivity], ['Revisions', contract.revisions]].map(([k, v]) => (
                <div key={k as string} className="flex items-start justify-between gap-4 text-[13px]">
                  <span className="text-obsidian/50 shrink-0">{k}</span>
                  <span className="font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-line space-y-2">
              {schedule.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[13px]">
                  <span className="text-obsidian/50">{p.name}</span>
                  <span className="font-semibold tnum">{inr(p.amount)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([['creator', deal.creatorName], ['brand', deal.brandName]] as [string, string][]).map(([side, name]) => {
                const signed = side === 'creator' ? contract.creatorSigned : contract.brandSigned
                const sig = side === 'creator' ? contract.creatorSig : contract.brandSig
                const mine = role === side
                return (
                  <div key={side} className={cn('p-3 rounded-xl border', signed ? 'border-line bg-bone' : 'border-2 border-dashed border-line')}>
                    <div className="text-[9px] font-mono uppercase tracking-wider text-obsidian/50">{side} · {name}</div>
                    {signed
                      ? (sig ? <img src={sig} className="h-12 mt-1 mx-auto" alt="signature" /> : <div className="font-display italic text-lg mt-2 text-center text-obsidian/70">〜 signed 〜</div>)
                      : mine && deal.stage === 'contract'
                        ? <button onClick={() => setSigning(side)} className="tap w-full mt-2 py-2.5 rounded-lg bg-obsidian text-acid text-[12px] font-semibold">Tap to sign</button>
                        : <div className="text-[11px] text-obsidian/40 text-center mt-3 mb-2">Awaiting signature</div>
                    }
                  </div>
                )
              })}
            </div>
            {deal.stage === 'contract' && (
              <div className="mt-3 p-3 rounded-xl bg-iris-tint flex items-center gap-2">
                <Lock size={13} className="text-iris shrink-0" />
                <span className="text-[11px] text-obsidian/70">When both sides sign, the 50% advance moves into escrow automatically.</span>
              </div>
            )}
          </Section>
        )}

        {/* Payments */}
        {idx >= 2 && (
          <Section label="Payments · escrow protected">
            <div className="space-y-2.5">
              {deal.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-medium">{p.name}</div>
                    <div className="text-[11px] text-obsidian/50 tnum">{inr(p.amount)}</div>
                  </div>
                  {p.status === 'released'
                    ? <span className="px-2.5 py-1 rounded-full bg-acid text-obsidian text-[10px] font-mono font-semibold uppercase">Paid</span>
                    : p.status === 'escrow'
                      ? (role === 'brand'
                          ? <button onClick={() => setPayment(i, 'released')} className="tap px-3 py-2 rounded-xl bg-obsidian text-paper text-[11px] font-semibold">Release payment</button>
                          : <span className="px-2.5 py-1 rounded-full bg-iris-tint text-iris text-[10px] font-mono font-semibold uppercase flex items-center gap-1"><Lock size={9} />In escrow</span>)
                      : (role === 'brand'
                          ? <button onClick={() => setPayment(i, 'escrow')} className="tap px-3 py-2 rounded-xl bg-iris text-paper text-[11px] font-semibold">Fund escrow</button>
                          : <span className="px-2.5 py-1 rounded-full bg-bone text-obsidian/50 text-[10px] font-mono font-semibold uppercase">Pending</span>)
                  }
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-obsidian/50 flex items-center gap-1.5">
              <Shield size={12} className="text-iris" /> Funds in escrow release on approval.
            </div>
          </Section>
        )}

        {/* Deliverables */}
        {idx >= 2 && (
          <Section label="Deliverables">
            <div className="space-y-2.5">
              {deal.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('w-5 h-5 rounded-full grid place-items-center shrink-0', d.approved ? 'bg-acid' : d.done ? 'bg-iris' : 'bg-obsidian/10')}>
                    {d.approved ? <Check size={12} className="text-obsidian" strokeWidth={3} /> : d.done ? <Clock size={11} className="text-paper" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[13px]', d.approved ? 'text-obsidian/50' : 'font-medium')}>{d.name}</div>
                    <div className="text-[10px] text-obsidian/50">{d.approved ? 'Approved' : d.done ? 'Submitted · awaiting approval' : 'Not submitted yet'}</div>
                  </div>
                  {deal.stage === 'active' && !d.approved && (
                    role === 'creator' && !d.done
                      ? <button onClick={() => setDeliverable(i, { done: true })} className="tap px-3 py-2 rounded-xl bg-obsidian text-paper text-[11px] font-semibold flex items-center gap-1"><Upload size={11} /> Submit</button>
                      : role === 'brand' && d.done
                        ? <button onClick={() => setDeliverable(i, { approved: true })} className="tap px-3 py-2 rounded-xl bg-acid text-obsidian text-[11px] font-semibold">Approve</button>
                        : null
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Completed */}
        {deal.stage === 'completed' && (
          <div className="mx-5 mt-4 p-5 rounded-3xl bg-obsidian relative overflow-hidden mb-4">
            <div className="absolute top-0 right-0 w-32 h-32 dots-acid opacity-30 pointer-events-none" />
            <div className="w-12 h-12 rounded-full bg-acid grid place-items-center"><Check size={22} className="text-obsidian" strokeWidth={3} /></div>
            <div className="mt-3 font-display text-2xl text-paper tracking-tight">Deal complete 🎉</div>
            <p className="mt-1 text-[13px] text-paper/70 leading-relaxed">{inr(deal.quote)} fully paid · {deal.deliverables.length} deliverables approved.</p>
            <button onClick={() => dispatch({ type: 'GO', screen: 'reviews' })} className="tap w-full mt-4 py-3.5 rounded-xl bg-acid text-obsidian text-[13px] font-semibold flex items-center justify-center gap-1.5">
              <Star size={14} /> Leave a review
            </button>
          </div>
        )}

        <div className="h-6" />
      </div>

      {signing && <SignPad who={signing === 'creator' ? deal.creatorName : deal.brandName} onDone={finishSign} onCancel={() => setSigning(null)} />}
    </div>
  )
}

/* ─── Sponsorship Compose Screen ─── */
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
      <StatusBar />
      <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-line shrink-0">
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
