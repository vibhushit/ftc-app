import { useState, useRef } from 'react'
import { Check, Upload, BadgeCheck, Clock } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { OnboardShell } from './OnboardShell'

export function CreatorOnboard4() {
  const dispatch = useAppStore(s => s.dispatch)
  const [docs, setDocs] = useState<Record<string, string>>({ aadhaar: 'idle', pan: 'idle', selfie: 'idle' })
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)

  const REQUIRED = [
    { key: 'aadhaar', emoji: '🪪', title: 'Aadhaar Card', sub: 'Front + back. Only the last 4 digits are shown publicly.' },
    { key: 'pan',     emoji: '📄', title: 'PAN Card',     sub: 'For tax purposes — 1% TDS is filed against your PAN.' },
    { key: 'selfie',  emoji: '📸', title: 'Selfie + ID',  sub: 'A live photo holding your Aadhaar, for verification.' },
  ]

  const triggerUpload = (key: string) => {
    if (docs[key] === 'verified' || docs[key] === 'review') return
    setActiveDocKey(key)
    docInputRef.current?.click()
  }

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !activeDocKey) return
    const key = activeDocKey
    setDocs(d => ({ ...d, [key]: 'review' }))
    setTimeout(() => {
      setDocs(d => ({ ...d, [key]: 'verified' }))
      if (docInputRef.current) docInputRef.current.value = ''
      setActiveDocKey(null)
    }, 800)
  }

  const reqDone = REQUIRED.filter(r => docs[r.key] === 'verified').length
  const allReq = reqDone === REQUIRED.length
  const score = Math.min(100, (docs.aadhaar === 'verified' ? 40 : 0) + (docs.selfie === 'verified' ? 20 : 0) + 10 + 5)
  const breakdown: [string, number, boolean][] = [
    ['Government ID',    40, docs.aadhaar === 'verified'],
    ['Face match · selfie', 20, docs.selfie === 'verified'],
    ['Phone',             10, true],
    ['Email',              5, true],
  ]

  return (
    <OnboardShell
      step={4} total={5}
      title="Verify your identity"
      sub="Upload your government IDs to unlock bookings. Documents are encrypted — we only show the last 4 digits."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard3' })}
      cta={allReq ? 'Submit for review' : 'Upload required documents'}
      ctaDisabled={!allReq}
      ctaAction={() => {
        dispatch({ type: 'SET_ONBOARD', patch: { idVerified: true } })
        dispatch({ type: 'GO', screen: 'creatorOnboard5' })
      }}
    >
      <input
        ref={docInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleDocSelect}
        className="hidden"
      />

      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-obsidian relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative flex items-end justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-acid">Your trust score</div>
              <div className="font-display text-5xl text-paper tnum mt-1">{score}<span className="text-xl text-paper/40">/100</span></div>
            </div>
            <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider', score >= 80 ? 'bg-acid text-obsidian' : 'bg-paper/15 text-paper')}>
              {score >= 80 ? '🏆 Verified' : 'Building'}
            </span>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-paper/15 overflow-hidden">
            <div className="h-full bg-acid transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
        </div>

        <div className="rounded-2xl bg-paper border border-line p-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Score breakdown · 75 from verification + 25 from performance</div>
          <div className="space-y-1.5">
            {breakdown.map(([lab, pts, done]) => (
              <div key={lab} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2">
                  <div className={cn('w-4 h-4 rounded-full grid place-items-center', done ? 'bg-success' : 'bg-bone border border-line')}>
                    {done && <Check size={10} className="text-paper" strokeWidth={3} />}
                  </div>
                  <span className={done ? '' : 'text-obsidian/45'}>{lab}</span>
                </span>
                <span className={cn('tnum font-semibold', done ? 'text-success' : 'text-obsidian/35')}>{done ? '+' : ''}{pts}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Required documents</div>
            <div className="text-[11px] font-mono text-obsidian/40">{reqDone}/3 verified</div>
          </div>
          <div className="space-y-2">
            {REQUIRED.map(d => {
              const st = docs[d.key]
              return (
                <div key={d.key} className={cn('rounded-2xl border-2 p-3.5 transition', st === 'verified' ? 'border-success bg-success/10' : st === 'review' ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-paper grid place-items-center text-xl shrink-0">{d.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-semibold">{d.title}</div>
                      <div className="text-[11px] text-obsidian/55 mt-0.5 leading-snug">{d.sub}</div>
                    </div>
                    {st === 'verified'
                      ? <span className="flex items-center gap-1 text-[11px] font-semibold text-success shrink-0"><BadgeCheck size={15} /> Verified</span>
                      : st === 'review'
                        ? <span className="flex items-center gap-1 text-[11px] font-semibold text-iris shrink-0"><Clock size={13} /> Reviewing…</span>
                        : <button onClick={() => triggerUpload(d.key)} className="tap shrink-0 px-3 py-2 rounded-lg bg-obsidian text-paper text-[11.5px] font-semibold flex items-center gap-1.5"><Upload size={13} /> Upload</button>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </OnboardShell>
  )
}
