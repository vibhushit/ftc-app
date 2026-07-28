import { useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { DISCIPLINE_CONFIG } from '@/data/creators'
import { cn } from '@/utils'
import { OnboardShell } from './OnboardShell'

const DISC_EMOJI: Record<string, string> = {
  Photography: '📸', Videography: '🎬', 'Graphic Design': '🎨',
  'UI/UX': '💻', Writing: '✍️', Music: '🎵',
  Tattoo: '🖊️', Illustration: '🎭', Editing: '✂️', Dance: '💃',
}

export function CreatorOnboard2() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const ob = state.onboard
  const [discipline, setDiscipline] = useState(ob.discipline)
  const [subs, setSubs] = useState<string[]>(ob.subSkills ?? [])
  const [years, setYears] = useState(ob.yearsExp ?? 3)
  const [ooOn, setOoOn] = useState(false)
  const [ooName, setOoName] = useState('1:1 Strategy Call')
  const [ooMins, setOoMins] = useState(30)
  const [ooPrice, setOoPrice] = useState(999)
  const subOptions = discipline ? (DISCIPLINE_CONFIG[discipline]?.sub ?? []) : []
  const ready = !!discipline && subs.length > 0

  return (
    <OnboardShell
      step={2} total={5}
      title="Your craft & packages"
      sub="Pick what you do and tell us your experience level."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard1' })}
      cta="Continue"
      ctaDisabled={!ready}
      ctaAction={() => {
        const oo = ooOn ? { name: ooName, mins: ooMins, price: ooPrice, type: 'Video call', today: false } : null
        dispatch({ type: 'SET_ONBOARD', patch: { discipline, subSkills: subs, yearsExp: years, oneOnOne: oo } })
        dispatch({ type: 'GO', screen: 'creatorOnboard3' })
      }}
    >
      <div className="space-y-5">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">What do you do?</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.keys(DISCIPLINE_CONFIG).map(k => {
              const active = discipline === k
              return (
                <button key={k} onClick={() => { setDiscipline(k); setSubs([]) }} className={cn('tap p-3 rounded-xl border text-left transition', active ? 'border-obsidian bg-obsidian text-paper' : 'border-line bg-bone')}>
                  <span className="text-xl">{DISC_EMOJI[k] ?? '🎯'}</span>
                  <div className="mt-2 text-[12px] font-semibold">{k}</div>
                </button>
              )
            })}
          </div>
        </div>
        {discipline && (
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your specialities <span className="text-obsidian/30 normal-case">({subs.length}/5)</span></label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {subOptions.map(s => {
                const active = subs.includes(s)
                return (
                  <button key={s} onClick={() => setSubs(active ? subs.filter(x => x !== s) : subs.length < 5 ? [...subs, s] : subs)} className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', active ? 'bg-iris text-paper border-iris' : 'bg-bone border-line text-obsidian/70')}>
                    {active ? '✓ ' : ''}{s}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Years of experience</label>
          <div className="mt-2 flex items-center gap-3">
            <button onClick={() => setYears(Math.max(0, years - 1))} className="tap w-10 h-10 rounded-xl bg-bone border border-line font-display text-xl">−</button>
            <div className="font-display text-2xl tnum w-10 text-center">{years}</div>
            <button onClick={() => setYears(Math.min(40, years + 1))} className="tap w-10 h-10 rounded-xl bg-bone border border-line font-display text-xl">+</button>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Offer a 1:1 session</label>
              <div className="text-[11px] text-obsidian/45">A paid consult shown near the top of your profile</div>
            </div>
            <button onClick={() => setOoOn(!ooOn)} className={cn('tap relative w-11 h-6 rounded-full transition-colors', ooOn ? 'bg-success' : 'bg-obsidian/15')}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-sm transition-all" style={{ left: ooOn ? 22 : 2 }} />
            </button>
          </div>
          {ooOn && (
            <div className="rounded-2xl border-2 border-iris bg-iris-tint/40 p-3.5 space-y-3">
              <input value={ooName} onChange={e => setOoName(e.target.value)} placeholder="Session name" className="w-full py-2.5 px-3 rounded-xl bg-paper text-[14px] outline-none" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50 mb-1">Minutes</div>
                  <input type="number" value={ooMins} onChange={e => setOoMins(+e.target.value)} className="w-full py-2.5 px-3 rounded-xl bg-paper text-[14px] tnum outline-none" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/50 mb-1">Price (₹)</div>
                  <input type="number" value={ooPrice} onChange={e => setOoPrice(+e.target.value)} className="w-full py-2.5 px-3 rounded-xl bg-paper text-[14px] tnum outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </OnboardShell>
  )
}
