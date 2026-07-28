import { useState } from 'react'
import { Home, MapPin, Globe } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { OnboardShell } from './OnboardShell'

const ALL_LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu']
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur', 'Goa', 'Kolkata', 'Chandigarh']

export function CreatorOnboard1() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const ob = state.onboard
  const [name, setName] = useState(ob.name)
  const [city, setCity] = useState(ob.city)
  const [bio, setBio] = useState(ob.bio)
  const [langs, setLangs] = useState<string[]>((ob.languages as string[]) ?? ['Hindi', 'English'])
  const [travelMode, setTravelMode] = useState<'studio' | 'travel' | 'both'>(ob.travelMode ?? 'both')
  const toggleLang = (l: string) => setLangs(langs.includes(l) ? langs.filter(x => x !== l) : [...langs, l])

  return (
    <OnboardShell
      step={1} total={5}
      title="Let's start with the basics"
      sub="This is what clients see first. Keep it real."
      onBack={() => dispatch({ type: 'BACK' })}
      cta="Continue"
      ctaDisabled={!name.trim() || !city.trim() || langs.length === 0}
      ctaAction={() => {
        dispatch({ type: 'SET_ONBOARD', patch: { name, city, bio, languages: langs, travelMode } })
        dispatch({ type: 'GO', screen: 'creatorOnboard2' })
      }}
    >
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Full name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ananya Desai" className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-iris/30" />
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your city</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CITIES.map(c => (
              <button key={c} onClick={() => setCity(c)} className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', city === c ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line')}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Short bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Cinematic wedding photographer based in Bandra, 5 years in…" rows={3} className="mt-1.5 w-full py-3 px-4 bg-bone rounded-xl text-[14px] outline-none resize-none focus:ring-2 focus:ring-iris/30 leading-relaxed" />
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Languages you speak <span className="text-obsidian/30 normal-case">({langs.length})</span></label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {ALL_LANGUAGES.map(l => (
              <button key={l} onClick={() => toggleLang(l)} className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', langs.includes(l) ? 'bg-iris text-paper border-iris' : 'bg-bone border-line')}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Where do you work?</label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {([['studio', Home, 'My studio', 'Clients visit you'], ['travel', MapPin, 'I travel', 'You go to them'], ['both', Globe, 'Both', 'Flexible']] as [typeof travelMode, typeof Home, string, string][]).map(([k, Ic, t, s]) => (
              <button key={k} onClick={() => setTravelMode(k)} className={cn('tap p-3 rounded-2xl border-2 text-center transition', travelMode === k ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
                <Ic size={18} className={cn('mx-auto mb-1', travelMode === k ? 'text-iris' : 'text-obsidian/50')} />
                <div className="text-[12px] font-semibold">{t}</div>
                <div className="text-[10px] text-obsidian/50 mt-0.5">{s}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </OnboardShell>
  )
}
