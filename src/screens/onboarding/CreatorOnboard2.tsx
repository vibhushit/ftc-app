import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
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

  const subOptions = discipline ? (DISCIPLINE_CONFIG[discipline]?.sub ?? []) : []
  const isDiscValid = !!discipline
  const isSubValid = subs.length > 0
  const ready = isDiscValid && isSubValid

  const errors: string[] = []
  if (!isDiscValid) errors.push('Select your main discipline')
  if (isDiscValid && !isSubValid) errors.push('Select at least 1 speciality/sub-skill')

  return (
    <OnboardShell
      step={2} total={5}
      title="Your craft & packages"
      sub="Pick what you do and tell us your experience level."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard1' })}
      cta="Continue"
      ctaDisabled={!ready}
      ctaAction={() => {
        if (!ready) return
        dispatch({ type: 'SET_ONBOARD', patch: { discipline, subSkills: subs, yearsExp: years } })
        dispatch({ type: 'GO', screen: 'creatorOnboard3' })
      }}
    >
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">What do you do? *</label>
            {!isDiscValid && <span className="text-[10px] text-danger font-medium">Select 1</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(DISCIPLINE_CONFIG).map(k => {
              const active = discipline === k
              return (
                <button
                  key={k}
                  onClick={() => { setDiscipline(k); setSubs([]) }}
                  className={cn('tap p-3 rounded-xl border text-left transition', active ? 'border-obsidian bg-obsidian text-paper' : 'border-line bg-bone')}
                >
                  <span className="text-xl">{DISC_EMOJI[k] ?? '🎯'}</span>
                  <div className="mt-2 text-[12px] font-semibold">{k}</div>
                </button>
              )
            })}
          </div>
        </div>

        {discipline ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your specialities * <span className="text-obsidian/30 normal-case">({subs.length}/5)</span></label>
              {!isSubValid && <span className="text-[10px] text-danger font-medium">Pick at least 1</span>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {subOptions.map(s => {
                const active = subs.includes(s)
                return (
                  <button
                    key={s}
                    onClick={() => setSubs(active ? subs.filter(x => x !== s) : subs.length < 5 ? [...subs, s] : subs)}
                    className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', active ? 'bg-iris text-paper border-iris' : 'bg-bone border-line')}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-bone border border-line text-[12.5px] text-obsidian/60">
            👈 Select a discipline above to see available specialities.
          </div>
        )}

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Years of professional experience</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={15}
              value={years}
              onChange={e => setYears(Number(e.target.value))}
              className="flex-1 accent-obsidian"
            />
            <span className="font-display text-2xl tnum w-12 text-right">{years}y</span>
          </div>
        </div>

        {!ready && (
          <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/30 space-y-1">
            <div className="text-[11px] font-semibold text-danger flex items-center gap-1.5">
              <AlertCircle size={14} /> Please complete the following to continue:
            </div>
            <ul className="list-disc list-inside text-[11.5px] text-danger/80 space-y-0.5">
              {errors.map(err => <li key={err}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>
    </OnboardShell>
  )
}
