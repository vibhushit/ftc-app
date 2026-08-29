import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { cn } from '@/utils'
import { supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { isLiveMode } from '@/config/environmentMode'

const POPULAR_CITIES = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Jaipur', 'Goa', 'Other']

const CREATIVE_CATEGORIES = [
  { id: 'photo', label: '📸 Photography', sub: 'Fashion, Portraits, Events' },
  { id: 'video', label: '🎥 Video & Reels', sub: 'Short-form, Commercials' },
  { id: 'wedding', label: '💍 Weddings', sub: 'Pre-wedding & Ceremony' },
  { id: 'styling', label: '👗 Styling & MUA', sub: 'Fashion, Wardrobe, Makeup' },
  { id: 'editing', label: '🎬 Editing & Post', sub: 'Color grading, VFX' },
]

export function ClientOnboardScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [name, setName] = useState(state.user.name || '')
  const [city, setCity] = useState(state.user.city || 'Delhi NCR')
  const [clientType, setClientType] = useState<'individual' | 'brand'>('individual')
  const [interests, setInterests] = useState<string[]>(['photo', 'video'])
  const [saving, setSaving] = useState(false)

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const finishClientOnboarding = async (skip = false) => {
    setSaving(true)
    const finalCity = skip ? (city || 'Delhi NCR') : city
    const finalName = skip ? (name || 'Client') : (name.trim() || 'Client')

    try {
      if (supabaseAvailable && isLiveMode()) {
        await authApi.updateMyProfile({
          name: finalName,
          city: finalCity,
        })
        await authApi.setUserRole('consumer')
      }
    } catch (e) {
      console.warn('[FTC] Client profile update failed:', e)
    }

    // Update filter preferences so the discovery feed pre-selects their city
    dispatch({
      type: 'SET_FILTER',
      patch: { city: finalCity === 'Other' ? 'All' : finalCity },
    })

    // Complete onboarding & open Home Feed
    dispatch({
      type: 'COMPLETE_AUTH',
      isCreator: false,
      name: finalName,
      city: finalCity,
    })
    dispatch({ type: 'GO_TAB', tab: 'home' })
  }

  return (
    <div className="flex-1 relative flex flex-col bg-paper text-obsidian overflow-hidden">
      {/* Top Header with Progress & Skip */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-line shrink-0">
        <button onClick={() => dispatch({ type: 'GO', screen: 'role' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          <div className="h-1.5 rounded-full w-8 bg-obsidian transition-all" />
        </div>
        <button
          type="button"
          onClick={() => finishClientOnboarding(true)}
          className="tap text-[12px] font-medium text-obsidian/60 hover:text-obsidian transition"
        >
          Skip for now →
        </button>
      </div>

      {/* Scrollable Form Body with pb-32 so content is never hidden behind footer */}
      <div className="app-scroll pb-32 px-5 pt-5 max-w-md mx-auto w-full">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-light tracking-tight leading-tight">
            Tell us what you're <span className="italic">looking for</span>
          </h2>
          <p className="text-[13px] text-obsidian/60 mt-1">
            We'll tailor your discovery feed with verified creators in your area.
          </p>
        </div>

        <div className="space-y-6">
          {/* 1. Name or Brand */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 block mb-1.5">
              Your Name or Brand Name
            </label>
            <div className="rounded-2xl border-2 border-obsidian/12 focus-within:border-obsidian px-4 py-3.5 bg-bone/30 transition">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rhea Kapoor or Studio 9"
                className="w-full bg-transparent outline-none text-[14px] placeholder:text-obsidian/40"
              />
            </div>
          </div>

          {/* 2. Client Profile Type */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 block mb-2">
              You are hiring as
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setClientType('individual')}
                className={cn(
                  'tap p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3',
                  clientType === 'individual'
                    ? 'border-obsidian bg-obsidian text-paper shadow-sm'
                    : 'border-line bg-paper text-obsidian hover:border-obsidian/25'
                )}
              >
                <span className="text-xl">👤</span>
                <div>
                  <div className="font-medium text-[13px]">Individual</div>
                  <div className={cn('text-[11px]', clientType === 'individual' ? 'text-paper/70' : 'text-obsidian/50')}>Personal shoots</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setClientType('brand')}
                className={cn(
                  'tap p-3.5 rounded-2xl border-2 text-left transition flex items-center gap-3',
                  clientType === 'brand'
                    ? 'border-obsidian bg-obsidian text-paper shadow-sm'
                    : 'border-line bg-paper text-obsidian hover:border-obsidian/25'
                )}
              >
                <span className="text-xl">🏢</span>
                <div>
                  <div className="font-medium text-[13px]">Brand / Agency</div>
                  <div className={cn('text-[11px]', clientType === 'brand' ? 'text-paper/70' : 'text-obsidian/50')}>Commercial jobs</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Primary City */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 block mb-2">
              Primary City
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CITIES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={cn(
                    'tap px-3.5 py-2.5 rounded-xl text-[12.5px] font-medium border transition',
                    city === c
                      ? 'bg-obsidian text-paper border-obsidian shadow-xs'
                      : 'bg-bone/40 text-obsidian/75 border-line hover:border-obsidian/30'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Creative Needs */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.14em] text-obsidian/60 block mb-2">
              What do you hire most? (Select all that apply)
            </label>
            <div className="space-y-2">
              {CREATIVE_CATEGORIES.map(cat => {
                const active = interests.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={cn(
                      'tap w-full p-3.5 rounded-2xl border-2 text-left transition flex items-center justify-between',
                      active
                        ? 'border-iris bg-iris/5 text-obsidian shadow-xs'
                        : 'border-line bg-paper hover:border-obsidian/20'
                    )}
                  >
                    <div>
                      <div className="font-medium text-[13.5px]">{cat.label}</div>
                      <div className="text-[11.5px] text-obsidian/50">{cat.sub}</div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border grid place-items-center text-paper text-[11px] font-bold transition',
                      active ? 'bg-iris border-iris' : 'border-obsidian/20 bg-paper'
                    )}>
                      {active && '✓'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Bottom Footer Bar - Always 100% visible on all devices */}
      <div className="absolute bottom-0 inset-x-0 px-5 pb-6 pt-4 bg-paper border-t border-line shadow-lg">
        <button
          onClick={() => finishClientOnboarding(false)}
          disabled={saving}
          className="tap w-full py-4 rounded-2xl bg-obsidian text-paper font-semibold text-[14.5px] flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition"
        >
          {saving ? 'Personalizing…' : <><span>Personalize & Browse Creators</span> <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )
}
