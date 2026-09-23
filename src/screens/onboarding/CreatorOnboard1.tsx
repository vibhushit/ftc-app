import { useState } from 'react'
import { Home, MapPin, Globe, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'
import { OnboardShell } from './OnboardShell'

const ALL_LANGUAGES = ['Hindi', 'English', 'Punjabi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Urdu']
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Jaipur', 'Goa', 'Kolkata', 'Chandigarh']

export function CreatorOnboard1() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const ob = state.onboard
  const [name, setName] = useState(ob.name)
  const [handle, setHandle] = useState(ob.handle || (ob.name ? ob.name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : ''))
  const [handleEdited, setHandleEdited] = useState(Boolean(ob.handle))
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>(ob.handle ? 'available' : 'idle')
  const [handleError, setHandleError] = useState<string | null>(null)
  const [city, setCity] = useState(ob.city)
  const [bio, setBio] = useState(ob.bio)
  const [langs, setLangs] = useState<string[]>((ob.languages as string[]) ?? ['Hindi', 'English'])
  const [travelMode, setTravelMode] = useState<'studio' | 'travel' | 'both'>(ob.travelMode ?? 'both')
  const [touched, setTouched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleLang = (l: string) => setLangs(langs.includes(l) ? langs.filter(x => x !== l) : [...langs, l])

  const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase()
  const isNameValid = name.trim().length >= 2
  const isHandleFormatValid = cleanHandle.length >= 3 && cleanHandle.length <= 30 && /^[a-z0-9._]+$/.test(cleanHandle)
  const isBioValid = bio.trim().length >= 15
  const isCityValid = city.trim().length > 0
  const isLangsValid = langs.length > 0
  const isReady = isNameValid && isHandleFormatValid && isCityValid && isBioValid && isLangsValid

  const errors: string[] = []
  if (!isNameValid) errors.push('Full name must be at least 2 characters')
  if (!isHandleFormatValid) errors.push('Handle must be 3-30 valid characters')
  if (handleStatus === 'taken') errors.push('This handle is already taken')
  if (!isCityValid) errors.push('Please select your city')
  if (!isBioValid) errors.push(`Short bio must be at least 15 characters (${bio.trim().length}/15)`)
  if (!isLangsValid) errors.push('Select at least 1 language you speak')

  const onNameChange = (val: string) => {
    setName(val)
    if (!handleEdited) {
      const suggested = val.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      setHandle(suggested)
      setHandleStatus('idle')
      setHandleError(null)
    }
  }

  const verifyHandle = async (targetHandle: string): Promise<boolean> => {
    const clean = targetHandle.trim().replace(/^@/, '').toLowerCase()
    if (clean.length < 3 || clean.length > 30) {
      setHandleStatus('invalid')
      setHandleError('Handle must be between 3 and 30 characters')
      return false
    }
    if (!/^[a-z0-9._]+$/.test(clean) || clean.startsWith('.') || clean.endsWith('.') || clean.startsWith('_') || clean.endsWith('_')) {
      setHandleStatus('invalid')
      setHandleError('Only lowercase letters, numbers, _, and . (no leading/trailing . or _)')
      return false
    }

    setHandleStatus('checking')
    setHandleError(null)
    try {
      const res = await apiClient.checkHandle(clean)
      if (res.available) {
        setHandleStatus('available')
        return true
      } else {
        setHandleStatus('taken')
        setHandleError(res.reason || 'That handle is already taken')
        return false
      }
    } catch {
      setHandleStatus('available')
      return true
    }
  }

  return (
    <OnboardShell
      step={1} total={5}
      title="Let's start with the basics"
      sub="This is what clients see first. Keep it real."
      onBack={() => dispatch(state.onboardOrigin === 'me' ? { type: 'GO_TAB', tab: 'me' } : { type: 'GO', screen: 'role' })}
      cta={isSubmitting ? "Checking handle..." : "Continue"}
      ctaDisabled={!isReady || isSubmitting}
      ctaAction={async () => {
        setTouched(true)
        if (!isReady || isSubmitting) return

        setIsSubmitting(true)
        try {
          // Option 4: Ensure handle is checked and available on Continue click
          let isAvailable = handleStatus === 'available'
          if (!isAvailable) {
            isAvailable = await verifyHandle(cleanHandle)
          }

          if (!isAvailable) {
            setIsSubmitting(false)
            return
          }

          dispatch({
            type: 'SET_ONBOARD',
            patch: {
              name,
              handle: `@${cleanHandle}`,
              city,
              bio,
              languages: langs,
              travelMode,
            }
          })
          dispatch({ type: 'GO', screen: 'creatorOnboard2' })
        } finally {
          setIsSubmitting(false)
        }
      }}
    >
      <div className="space-y-4">
        {/* Draft Notice if draft is present */}
        {(ob.name || ob.handle || ob.bio) && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-acid/10 border border-acid/25">
            <span className="text-[12px] text-obsidian/75">
              Draft restored from your session
            </span>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && state.supabaseUserId) {
                  try {
                    localStorage.removeItem(`ftc_creator_draft_${state.supabaseUserId}`)
                  } catch {}
                }
                dispatch({
                  type: 'SET_ONBOARD',
                  patch: {
                    name: '', handle: '', city: '', area: '', bio: '',
                    discipline: '', subSkills: [], yearsExp: 3, startingPrice: 8000,
                    portfolio: [], idVerified: false, socialProof: false,
                  }
                })
                setName('')
                setHandle('')
                setHandleEdited(false)
                setHandleStatus('idle')
                setHandleError(null)
                setCity('')
                setBio('')
                setLangs(['Hindi', 'English'])
                setTouched(false)
              }}
              className="text-[11px] font-semibold text-danger hover:underline cursor-pointer"
            >
              Start fresh
            </button>
          </div>
        )}

        {/* Name input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Full name *</label>
            {name.length > 0 && (
              isNameValid
                ? <span className="text-[10px] text-success font-medium flex items-center gap-1"><CheckCircle2 size={11} /> Valid</span>
                : <span className="text-[10px] text-danger font-medium flex items-center gap-1"><AlertCircle size={11} /> Min 2 characters</span>
            )}
          </div>
          <input
            value={name}
            onChange={e => onNameChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Ananya Desai"
            className={cn(
              'w-full py-3 px-4 rounded-xl text-[14px] outline-none transition',
              touched && !isNameValid ? 'bg-danger/10 border-2 border-danger focus:ring-2 focus:ring-danger/30' : 'bg-bone focus:ring-2 focus:ring-iris/30 border border-line'
            )}
          />
        </div>

        {/* Handle input (Option 4: Inline Check Button + Auto on Continue) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your handle / username *</label>
            {handleStatus === 'available' && (
              <span className="text-[10px] text-success font-medium flex items-center gap-1">
                <CheckCircle2 size={11} /> @{cleanHandle} available
              </span>
            )}
            {handleError && (
              <span className="text-[10px] text-danger font-medium flex items-center gap-1">
                <AlertCircle size={11} /> {handleError}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-obsidian/40 font-mono text-[14px] select-none pointer-events-none">@</div>
            <input
              value={cleanHandle}
              onChange={e => {
                setHandleEdited(true)
                setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))
                setHandleStatus('idle')
                setHandleError(null)
              }}
              onBlur={() => {
                if (cleanHandle.length >= 3 && handleStatus === 'idle') {
                  verifyHandle(cleanHandle)
                }
              }}
              placeholder="username"
              className={cn(
                'w-full py-3 pl-8 pr-28 rounded-xl text-[14px] font-mono outline-none transition',
                handleStatus === 'taken' || handleStatus === 'invalid'
                  ? 'bg-danger/10 border-2 border-danger focus:ring-2 focus:ring-danger/30'
                  : handleStatus === 'available'
                    ? 'bg-success/5 border-2 border-success/40 focus:ring-2 focus:ring-success/30'
                    : 'bg-bone focus:ring-2 focus:ring-iris/30 border border-line'
              )}
            />
            <div className="absolute right-2">
              {handleStatus === 'available' ? (
                <div className="px-2.5 py-1 rounded-lg bg-success/15 text-success text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Available
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => verifyHandle(cleanHandle)}
                  disabled={!isHandleFormatValid || handleStatus === 'checking'}
                  className={cn(
                    'tap px-3 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1',
                    isHandleFormatValid && handleStatus !== 'checking'
                      ? 'bg-obsidian text-paper hover:bg-obsidian/90 cursor-pointer'
                      : 'bg-obsidian/10 text-obsidian/30 cursor-not-allowed'
                  )}
                >
                  {handleStatus === 'checking' && <Loader2 size={12} className="animate-spin" />}
                  Check
                </button>
              )}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-obsidian/40 font-mono">
            findtoconnect.com/@{cleanHandle || 'username'}
          </div>
        </div>

        {/* City selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your city *</label>
            {!isCityValid && touched && <span className="text-[10px] text-danger font-medium">Required</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CITIES.map(c => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', city === c ? 'bg-obsidian text-paper border-obsidian' : 'bg-bone border-line')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Bio textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Short bio *</label>
            <span className={cn('text-[10px] font-mono', isBioValid ? 'text-success font-medium' : bio.length > 0 ? 'text-danger font-medium' : 'text-obsidian/40')}>
              {bio.trim().length}/15 min chars {isBioValid && '✓'}
            </span>
          </div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Cinematic wedding photographer based in Bandra, 5 years experience creating high-impact visuals…"
            rows={3}
            className={cn(
              'w-full py-3 px-4 rounded-xl text-[14px] outline-none resize-none leading-relaxed transition',
              touched && !isBioValid ? 'bg-danger/10 border-2 border-danger focus:ring-2 focus:ring-danger/30' : 'bg-bone focus:ring-2 focus:ring-iris/30 border border-line'
            )}
          />
        </div>

        {/* Languages */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Languages you speak * <span className="text-obsidian/30 normal-case">({langs.length})</span></label>
            {!isLangsValid && touched && <span className="text-[10px] text-danger font-medium">Pick at least 1</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => toggleLang(l)}
                className={cn('tap px-3 py-1.5 rounded-full text-[12px] font-medium border transition', langs.includes(l) ? 'bg-iris text-paper border-iris' : 'bg-bone border-line')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Mode */}
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

        {/* Validation Errors Box */}
        {!isReady && (
          <div className="p-3.5 rounded-2xl bg-danger/10 border border-danger/30 space-y-1">
            <div className="text-[11px] font-semibold text-danger flex items-center gap-1.5">
              <AlertCircle size={14} /> Complete required fields to continue:
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
