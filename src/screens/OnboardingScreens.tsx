import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, X, Check, Upload,
  Instagram, Film, Globe, Briefcase, Link2, AtSign,
  Shield, Clock, Home, MapPin, BadgeCheck, ChevronDown,
} from 'lucide-react'
import { StatusBar } from '@/components/ui/StatusBar'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { DISCIPLINE_CONFIG } from '@/data/creators'
import { pic } from '@/data/constants'
import { cn } from '@/utils'
import { useUpsertCreatorProfile } from '@/hooks/useCreators'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'

const ALL_LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu']

const DISC_EMOJI: Record<string, string> = {
  Photography: '📸', Videography: '🎬', 'Graphic Design': '🎨',
  'UI/UX': '💻', Writing: '✍️', Music: '🎵',
  Tattoo: '🖊️', Illustration: '🎭', Editing: '✂️', Dance: '💃',
}

/* ─── Shared shell ─── */
function OnboardShell({ step, total, title, sub, onBack, children, cta, ctaAction, ctaDisabled }: {
  step: number; total: number; title: string; sub: string; onBack: () => void;
  children: React.ReactNode; cta: string; ctaAction: () => void; ctaDisabled?: boolean;
}) {
  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden">
      <StatusBar />
      <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-line shrink-0">
        <button onClick={onBack} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all', i < step ? 'w-6 bg-iris' : i === step - 1 ? 'w-8 bg-obsidian' : 'w-4 bg-obsidian/15')} />
          ))}
        </div>
        <div className="font-mono text-[10px] uppercase text-obsidian/45 tracking-wider">{step}/{total}</div>
      </div>
      <div className="app-scroll pb-28 px-5 pt-5">
        <div className="mb-5">
          <h2 className="font-display text-2xl tracking-tight leading-tight">{title}</h2>
          <p className="text-[13px] text-obsidian/60 mt-1">{sub}</p>
        </div>
        {children}
      </div>
      <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper border-t border-line">
        <button
          disabled={ctaDisabled}
          onClick={ctaAction}
          className={cn('tap w-full py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 transition', ctaDisabled ? 'bg-bone text-obsidian/30' : 'bg-obsidian text-paper')}
        >
          {cta} {!ctaDisabled && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}

/* ─── Step 1 — Basics ─── */
export function CreatorOnboard1() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const ob = state.onboard
  const [name, setName] = useState(ob.name)
  const [city, setCity] = useState(ob.city)
  const [bio, setBio] = useState(ob.bio)
  const [langs, setLangs] = useState<string[]>((ob.languages as string[]) ?? ['Hindi', 'English'])
  const [travelMode, setTravelMode] = useState<'studio' | 'travel' | 'both'>(ob.travelMode ?? 'both')
  const toggleLang = (l: string) => setLangs(langs.includes(l) ? langs.filter(x => x !== l) : [...langs, l])
  const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur', 'Goa', 'Kolkata', 'Chandigarh']

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

/* ─── Step 2 — Craft & Packages ─── */
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
        {/* Discipline picker */}
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
        {/* Sub-skills */}
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
        {/* Years of experience */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Years of experience</label>
          <div className="mt-2 flex items-center gap-3">
            <button onClick={() => setYears(Math.max(0, years - 1))} className="tap w-10 h-10 rounded-xl bg-bone border border-line font-display text-xl">−</button>
            <div className="font-display text-2xl tnum w-10 text-center">{years}</div>
            <button onClick={() => setYears(Math.min(40, years + 1))} className="tap w-10 h-10 rounded-xl bg-bone border border-line font-display text-xl">+</button>
          </div>
        </div>
        {/* 1:1 session toggle */}
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

/* ─── Step 3 — Portfolio ─── */
export function CreatorOnboard3() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [imported, setImported] = useState<string[]>(state.onboard.portfolio ?? [])
  const [uploading, setUploading] = useState(false)
  const addPics = (seeds: string[]) => setImported(cur => [...cur, ...seeds.filter(s => !cur.includes(s))].slice(0, 9))
  const importIG = () => addPics([pic('onb-1', 600, 600), pic('onb-2', 600, 600), pic('onb-3', 600, 600), pic('onb-4', 600, 600)])
  const importBe = () => addPics([pic('onb-be1', 600, 600), pic('onb-be2', 600, 600), pic('onb-be3', 600, 600)])
  const uploadOne = () => {
    if (uploading || imported.length >= 9) return
    setUploading(true)
    setTimeout(() => { addPics([pic('onb-up' + Date.now(), 600, 600)]); setUploading(false) }, 700)
  }
  const left = Math.max(0, 3 - imported.length)

  return (
    <OnboardShell
      step={3} total={5}
      title="Show your craft"
      sub="Add at least 3 pieces — your best work first. Clients decide in the first 5 seconds."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard2' })}
      cta={left > 0 ? `Add ${left} more to continue` : 'Continue'}
      ctaDisabled={imported.length < 3}
      ctaAction={() => {
        dispatch({ type: 'SET_ONBOARD', patch: { portfolio: imported } })
        dispatch({ type: 'GO', screen: 'creatorOnboard4' })
      }}
    >
      <div className="space-y-4">
        {/* Progress */}
        <div className="p-3 rounded-xl bg-bone border border-line">
          <div className="text-[12px] font-semibold">{imported.length} of 9 added {imported.length >= 3 ? '· looking good ✓' : `· ${left} more needed`}</div>
          <div className="mt-1.5 h-1.5 rounded-full bg-paper overflow-hidden">
            <div className={cn('h-full transition-all duration-500', imported.length >= 3 ? 'bg-success' : 'bg-iris')} style={{ width: `${Math.min(imported.length / 3 * 100, 100)}%` }} />
          </div>
        </div>
        {/* Import sources */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={importIG} className="tap p-4 rounded-xl border-2 border-line active:bg-bone text-left">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 grid place-items-center">
              <Instagram size={16} className="text-white" />
            </div>
            <div className="mt-3 text-[13px] font-semibold">Import from Instagram</div>
            <div className="text-[11px] text-obsidian/60 mt-0.5">Pulls your top grid posts</div>
          </button>
          <button onClick={importBe} className="tap p-4 rounded-xl border-2 border-line active:bg-bone text-left">
            <div className="w-8 h-8 rounded-lg bg-[#1769FF] grid place-items-center text-white font-bold text-xs">Bē</div>
            <div className="mt-3 text-[13px] font-semibold">Import from Behance</div>
            <div className="text-[11px] text-obsidian/60 mt-0.5">Pulls project covers</div>
          </button>
        </div>
        <button onClick={uploadOne} className={cn('tap w-full py-4 border-2 border-dashed rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition', uploading ? 'border-iris text-iris bg-iris-tint' : 'border-line text-obsidian/60 active:bg-bone')}>
          <Upload size={16} />
          {uploading ? 'Uploading…' : 'Upload from this device (photo or video)'}
        </button>
        {/* Portfolio grid */}
        {imported.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your portfolio ({imported.length})</div>
              {imported.length >= 3 && <div className="flex items-center gap-1 text-[11px] text-success"><Check size={12} /> Authorship verified</div>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {imported.map((src, i) => (
                <div key={src + i} className="relative aspect-square rounded-lg overflow-hidden bg-bone">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  {i === 0
                    ? <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-acid text-obsidian text-[8px] font-mono font-semibold uppercase">Cover</span>
                    : <button onClick={() => setImported([imported[i], ...imported.filter((_, j) => j !== i)])} className="tap absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-obsidian/70 text-paper text-[8px] font-mono">Make cover</button>
                  }
                  <button onClick={() => setImported(imported.filter((_, j) => j !== i))} className="tap absolute top-1 right-1 w-5 h-5 rounded-full bg-obsidian/80 grid place-items-center">
                    <X size={10} className="text-paper" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-1.5 text-[10px] text-obsidian/40">First image is your cover — tap "Make cover" on any other to swap.</div>
          </div>
        )}
        {/* Verification note */}
        <div className="p-3.5 rounded-xl bg-iris-tint flex items-start gap-2.5">
          <Shield size={16} className="text-iris shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-obsidian/80">
            <span className="font-semibold text-iris">How we verify authorship: </span>
            We hash your portfolio and cross-reference with reverse image search. Disputed images require original RAW files.
          </div>
        </div>
      </div>
    </OnboardShell>
  )
}

/* ─── Step 4 — Identity Verification ─── */
export function CreatorOnboard4() {
  const dispatch = useAppStore(s => s.dispatch)
  const [docs, setDocs] = useState<Record<string, string>>({ aadhaar: 'idle', pan: 'idle', selfie: 'idle' })

  const REQUIRED = [
    { key: 'aadhaar', emoji: '🪪', title: 'Aadhaar Card', sub: 'Front + back. Only the last 4 digits are shown publicly.' },
    { key: 'pan',     emoji: '📄', title: 'PAN Card',     sub: 'For tax purposes — 1% TDS is filed against your PAN.' },
    { key: 'selfie',  emoji: '📸', title: 'Selfie + ID',  sub: 'A live photo holding your Aadhaar, for verification.' },
  ]

  const upload = (key: string) => {
    if (docs[key] === 'verified' || docs[key] === 'review') return
    setDocs(d => ({ ...d, [key]: 'review' }))
    setTimeout(() => setDocs(d => ({ ...d, [key]: 'verified' })), 1300)
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
      <div className="space-y-4">
        {/* Trust score card */}
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

        {/* Score breakdown */}
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

        {/* Required documents */}
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
                        : <button onClick={() => upload(d.key)} className="tap shrink-0 px-3 py-2 rounded-lg bg-obsidian text-paper text-[11.5px] font-semibold flex items-center gap-1.5"><Upload size={13} /> Upload</button>
                    }
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-paper overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', st === 'verified' ? 'bg-success' : 'bg-iris')} style={{ width: st === 'verified' ? '100%' : st === 'review' ? '66%' : '0%' }} />
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-obsidian/40 w-20 text-right">{st === 'verified' ? 'Verified' : st === 'review' ? 'Under review' : 'Pending'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-bone border border-line flex items-start gap-2 text-[11px] text-obsidian/55 leading-relaxed">
          <Shield size={14} className="text-iris shrink-0 mt-0.5" />
          After you submit, your profile enters Under Review. You can't go live until our team approves (usually within a few hours).
        </div>
      </div>
    </OnboardShell>
  )
}

/* ─── Step 5 — Socials & Paperwork ─── */
export function CreatorOnboard5() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const upsert = useUpsertCreatorProfile()
  const [soc, setSoc] = useState({ ig: '', yt: '', be: '', li: '', web: '' })
  const [upi, setUpi] = useState('')
  const [consents, setConsents] = useState({ contract: false, conduct: false, tax: false, cancel: false })
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const allConsent = consents.contract && consents.conduct && consents.tax && consents.cancel

  const submit = async () => {
    if (supabaseAvailable && state.supabaseUserId) {
      const ob = state.onboard
      const handle = `@${ob.name.replace(/\s+/g, '.').toLowerCase()}`
      try {
        await authApi.updateMyProfile({ name: ob.name, city: ob.city })
        await upsert.mutateAsync({
          id:           state.supabaseUserId,
          handle,
          bio:          ob.bio,
          tagline:      '',
          discipline:   ob.discipline,
          sub_skills:   ob.subSkills,
          years_exp:    ob.yearsExp,
          starting_at:  ob.startingPrice,
          city:         ob.city,
          area:         ob.area ?? '',
          languages:    (ob.languages as string[]) ?? ['Hindi', 'English'],
          travel_mode:  ob.travelMode ?? 'both',
          ig_handle:    soc.ig  || null,
          yt_handle:    soc.yt  || null,
          website_url:  soc.web || null,
          upi_id:       upi,
          onboard_step: 'review',
          is_published: false,
        })
      } catch (e) {
        console.error('[FTC] onboard submit failed:', e)
      }
    }
    dispatch({ type: 'GO', screen: 'creatorOnboardReview' })
  }
  type SocKey = keyof typeof soc
  type ConKey = keyof typeof consents

  const SOCIALS: { k: SocKey; icon: typeof Instagram; label: string; ph: string; req: boolean }[] = [
    { k: 'ig',  icon: Instagram, label: 'Instagram',       ph: '@yourhandle',       req: true },
    { k: 'yt',  icon: Film,      label: 'YouTube',         ph: 'youtube.com/@channel', req: false },
    { k: 'be',  icon: Globe,     label: 'Behance / Dribbble', ph: 'behance.net/you', req: false },
    { k: 'li',  icon: Briefcase, label: 'LinkedIn',        ph: 'linkedin.com/in/you', req: false },
    { k: 'web', icon: Link2,     label: 'Website',         ph: 'yoursite.com',      req: false },
  ]

  const AGREEMENTS: { k: ConKey; title: string; points: string[] }[] = [
    { k: 'contract', title: 'Standard Booking Contract', points: ['Provide services exactly as described', 'Complete within agreed timeline', 'All bookings run on FTC Secure escrow'] },
    { k: 'conduct',  title: 'Safety & Conduct Policy',   points: ['No harassment or unsafe behaviour', 'ID-verified sessions only', 'Report incidents within 7 days'] },
    { k: 'tax',      title: 'Tax Declaration',            points: ['I am 18 or older and all details are true', '1% TDS deducted on payouts against PAN', 'GST invoiced where applicable'] },
    { k: 'cancel',   title: 'Cancellation & Refund Policy', points: ['Free cancellation 48h+ before session', '50% charge within 24h', 'Auto-refund if creator no-shows'] },
  ]

  return (
    <OnboardShell
      step={5} total={5}
      title="Socials & paperwork"
      sub="Link every platform you're active on. Then sign four quick agreements that protect both sides."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard4' })}
      cta={upsert.isPending ? 'Submitting…' : 'Submit for review'}
      ctaDisabled={!soc.ig.trim() || !upi.trim() || !allConsent || upsert.isPending}
      ctaAction={submit}
    >
      <div className="space-y-5">
        {/* Social links */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Your platforms</div>
          <div className="space-y-2">
            {SOCIALS.map(s => {
              const filled = soc[s.k].trim().length > 0
              return (
                <div key={s.k} className={cn('rounded-2xl border-2 transition p-3', filled ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
                  <div className="flex items-center gap-2.5">
                    <div className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0 transition', filled ? 'bg-iris text-paper' : 'bg-paper text-obsidian/60')}>
                      <s.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold">{s.label}</span>
                        {s.req
                          ? <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-acid text-obsidian">REQUIRED</span>
                          : <span className="text-[9px] font-mono text-obsidian/40">optional</span>
                        }
                        {filled && <Check size={12} className="text-success" />}
                      </div>
                      <input
                        value={soc[s.k]}
                        onChange={e => setSoc({ ...soc, [s.k]: e.target.value })}
                        placeholder={s.ph}
                        className="w-full bg-transparent text-[13px] outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* UPI */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Payouts & safety</div>
          <div className={cn('rounded-2xl border-2 transition p-3', upi.trim() ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-paper grid place-items-center shrink-0"><AtSign size={16} className="text-obsidian/60" /></div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold">UPI for payouts</span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold bg-acid text-obsidian">REQUIRED</span>
                </div>
                <input value={upi} onChange={e => setUpi(e.target.value)} placeholder="name@upi" className="w-full bg-transparent text-[13px] outline-none mt-0.5" />
              </div>
            </div>
            <div className="mt-1.5 text-[10px] text-obsidian/50">Escrow releases land here within 24h of client approval.</div>
          </div>
        </div>

        {/* Booking link preview */}
        <div className="p-4 rounded-2xl bg-obsidian relative overflow-hidden">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="relative text-[10px] font-mono uppercase tracking-wider text-acid">Your booking link</div>
          <div className="relative font-display text-xl text-paper mt-1">ftc.app/{soc.ig.trim() || '@yourhandle'}</div>
          <div className="relative mt-2 text-[11px] text-paper/60 leading-relaxed">Put this in your Instagram bio. Fans tap it, land on your verified FTC profile, and book with escrow — no DM negotiations.</div>
        </div>

        {/* Agreements */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-2">Agreements · tap to read, then sign</div>
          <div className="space-y-2">
            {AGREEMENTS.map(a => (
              <div key={a.k} className={cn('rounded-2xl border-2 overflow-hidden transition', consents[a.k] ? 'border-iris bg-iris-tint' : 'border-line bg-bone')}>
                <button onClick={() => setOpen(o => ({ ...o, [a.k]: !o[a.k] }))} className="tap w-full flex items-center gap-2.5 px-4 py-3.5 text-left">
                  <span>📋</span>
                  <span className="flex-1 text-[13px] font-semibold">{a.title}</span>
                  {consents[a.k] && <span className="flex items-center gap-1 text-[11px] text-success font-semibold"><Check size={12} /> Agreed</span>}
                  <ChevronDown size={16} className={cn('text-obsidian/40 transition-transform', open[a.k] && 'rotate-180')} />
                </button>
                {open[a.k] && (
                  <div className="px-4 pb-2">
                    <div className="space-y-1.5 mb-3">
                      {a.points.map((p, i) => (
                        <div key={i} className="flex gap-2 text-[12.5px] text-obsidian/75 leading-snug">
                          <span className="text-iris">•</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setConsents(c => ({ ...c, [a.k]: !c[a.k] }))} className="tap w-full flex items-center gap-2.5 px-4 py-3 border-t border-line/60 text-left">
                  <div className={cn('w-5 h-5 rounded-md grid place-items-center shrink-0 border-2', consents[a.k] ? 'bg-iris border-iris' : 'border-obsidian/30')}>
                    {consents[a.k] && <Check size={12} className="text-paper" strokeWidth={3} />}
                  </div>
                  <span className="text-[12.5px] font-medium">I agree to the {a.title}</span>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 p-3 rounded-xl bg-bone border border-line text-[11px] text-obsidian/60 leading-relaxed">
            Signed copies live in Me → Legal & contracts. We'll also email them to you.
          </div>
        </div>
      </div>
    </OnboardShell>
  )
}

/* ─── In Review ─── */
export function CreatorOnboardReview() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-obsidian text-paper relative overflow-hidden">
      <div className="absolute top-20 -right-20 w-80 h-80 dots-acid opacity-20 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 dots-acid opacity-15 pointer-events-none" />
      <StatusBar dark />
      <div className="relative flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-iris grid place-items-center mb-6">
          <Clock size={36} className="text-paper" />
        </div>
        <h1 className="font-display text-4xl tracking-tight leading-none">
          You're<br /><span className="italic">in review</span>.
        </h1>
        <p className="mt-4 text-[14px] text-paper/70 max-w-xs leading-relaxed">
          Our team manually vets every new creator. Expect an answer within 48 hours on WhatsApp.
        </p>
        <div className="mt-8 p-4 rounded-2xl bg-paper/10 w-full max-w-sm text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-acid mb-2">While you wait</div>
          <div className="space-y-2 text-[12px] text-paper/80">
            {[
              'Complete your profile for +10 trust',
              'Share your FTC link on Instagram — earn early bookings',
              'Join your city\'s creator community',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check size={13} className="text-acid mt-0.5 shrink-0" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="relative px-6 pb-10 pt-4">
        <button
          onClick={() => { dispatch({ type: 'MARK_CREATOR' }); dispatch({ type: 'GO_TAB', tab: 'me' }) }}
          className="tap w-full py-4 rounded-2xl bg-acid text-obsidian font-semibold text-[14px]"
        >
          Back to app
        </button>
      </div>
    </div>
  )
}
