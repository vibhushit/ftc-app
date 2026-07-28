import { useState } from 'react'
import { ArrowLeft, Check, Shield, Lock, Clock, MessageCircle, Upload, Eye, Star } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { DEAL_STAGES, inr } from '@/data/constants'
import { cn } from '@/utils'
import type { Deal } from '@/types'
import { SignPad } from './SignPad'

const stageIdx = (stage: string) => DEAL_STAGES.findIndex(s => s.key === stage)

const splitQuote = (q: number) => [
  { name: '50% advance', amount: Math.round(q * 0.5), status: 'pending' as const },
  { name: '50% on approval', amount: Math.round(q * 0.5), status: 'pending' as const },
]

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
      <div className="px-5 pt-4 pb-3 bg-paper border-b border-line shrink-0">
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

        <div className="mx-5 mt-3 p-3 rounded-2xl bg-iris-tint flex items-center gap-2">
          <Eye size={14} className="text-iris shrink-0" />
          <span className="flex-1 text-[12px]">Viewing as <span className="font-semibold">{role}</span></span>
          <button onClick={() => dispatch({ type: 'SET_SPONSOR_ROLE', role: role === 'creator' ? 'brand' : 'creator' })} className="tap text-[12px] font-semibold text-iris">See the other side →</button>
        </div>

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
