import { useState } from 'react'
import { Plus, Trash2, Check, Sparkles, Clock, AlertCircle } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import type { Package } from '@/types'
import { OnboardShell } from './OnboardShell'

const DURATION_OPTIONS = ['1 hour', '2 hours', '3 hours', '4 hours', 'Full day (8 hours)', 'Custom']
const DELIVERY_OPTIONS = [
  { label: '48 hours (2 days)', val: '2' },
  { label: '3 to 5 days', val: '5' },
  { label: '7 days (1 week)', val: '7' },
  { label: '14 days (2 weeks)', val: '14' },
]

const DISCIPLINE_SUGGESTIONS: Record<string, string[]> = {
  Photography: [
    '15 edited high-res photos',
    'All original RAW images',
    'Online digital gallery',
    'Color grading included',
    '2 outfit changes',
    '48-hour preview delivery',
  ],
  Videography: [
    '1 edited cinematic reel (60s)',
    '4K Ultra HD delivery',
    'Sound design & licensed music',
    'Full event highlight video',
    '2 revision rounds included',
    'Color graded final cut',
  ],
  'Graphic Design': [
    'Primary & secondary logo marks',
    'Vector source files (.AI, .EPS)',
    'Brand color palette & typography',
    'High-res PNG & SVG assets',
    'Full commercial usage rights',
  ],
  'UI/UX': [
    'Complete Figma design source file',
    'Mobile & desktop responsive screens',
    'Interactive clickable prototype',
    'Component design system & tokens',
    'Developer handoff documentation',
  ],
}

interface PackageDraft {
  id: string
  name: string
  price: string
  duration: string
  delivery: string
  inclusions: string[]
}

export function CreatorOnboardPackages() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const ob = state.onboard
  const discipline = ob.discipline || 'Photography'

  const initialPackages: PackageDraft[] = (ob.builtPackages && ob.builtPackages.length > 0)
    ? ob.builtPackages.map(p => ({
        id: p.id || Math.random().toString(36).slice(2, 9),
        name: p.name || 'Standard Session',
        price: p.price ? String(p.price) : '8000',
        duration: p.duration || '2 hours',
        delivery: p.delivery || '7',
        inclusions: p.inclusions && p.inclusions.length > 0
          ? p.inclusions
          : ['High-resolution edited deliverables', 'Commercial usage license'],
      }))
    : [
        {
          id: 'pkg-1',
          name: discipline === 'Videography' ? 'Standard Reel & Video Shoot' : 'Standard Session',
          price: '8000',
          duration: '2 hours',
          delivery: '7',
          inclusions: (DISCIPLINE_SUGGESTIONS[discipline] || DISCIPLINE_SUGGESTIONS.Photography).slice(0, 3),
        },
      ]

  const [packages, setPackages] = useState<PackageDraft[]>(initialPackages)
  const [customInclusionInputs, setCustomInclusionInputs] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState(false)

  const suggestions = DISCIPLINE_SUGGESTIONS[discipline] || DISCIPLINE_SUGGESTIONS.Photography

  const updatePackage = (idx: number, patch: Partial<PackageDraft>) => {
    setPackages(cur => cur.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }

  const addPackage = () => {
    if (packages.length >= 3) return
    const tierNum = packages.length + 1
    const newTier: PackageDraft = {
      id: `pkg-${Date.now()}`,
      name: tierNum === 2 ? 'Extended / Half-Day' : 'Full Commercial Production',
      price: tierNum === 2 ? '15000' : '28000',
      duration: tierNum === 2 ? '4 hours' : 'Full day (8 hours)',
      delivery: '7',
      inclusions: suggestions.slice(0, tierNum + 2),
    }
    setPackages([...packages, newTier])
  }

  const removePackage = (idx: number) => {
    if (packages.length <= 1) return
    setPackages(cur => cur.filter((_, i) => i !== idx))
  }

  const addInclusion = (pkgId: string, item: string) => {
    const trimmed = item.trim()
    if (!trimmed) return
    setPackages(cur =>
      cur.map(p => {
        if (p.id !== pkgId) return p
        if (p.inclusions.includes(trimmed)) return p
        return { ...p, inclusions: [...p.inclusions, trimmed] }
      })
    )
    setCustomInclusionInputs(cur => ({ ...cur, [pkgId]: '' }))
  }

  const removeInclusion = (pkgId: string, item: string) => {
    setPackages(cur =>
      cur.map(p => {
        if (p.id !== pkgId) return p
        return { ...p, inclusions: p.inclusions.filter(x => x !== item) }
      })
    )
  }

  // Validation
  const isPackageValid = (p: PackageDraft) => {
    const priceNum = Number(p.price)
    return p.name.trim().length >= 2 && !isNaN(priceNum) && priceNum >= 500 && p.inclusions.length >= 1
  }

  const allValid = packages.every(isPackageValid)

  const handleContinue = () => {
    setTouched(true)
    if (!allValid) return

    const built: Package[] = packages.map(p => ({
      id: p.id,
      name: p.name.trim(),
      desc: `${p.duration} • Delivery within ${p.delivery} days`,
      price: Number(p.price),
      duration: p.duration,
      inclusions: p.inclusions,
      revisions: 2,
      delivery: p.delivery,
    }))

    const minPrice = Math.min(...built.map(p => Number(p.price)))

    dispatch({
      type: 'SET_ONBOARD',
      patch: {
        builtPackages: built,
        startingPrice: minPrice,
      },
    })

    dispatch({ type: 'GO', screen: 'creatorOnboard3' })
  }

  return (
    <OnboardShell
      step={3}
      total={5}
      title="Define your services & pricing"
      sub="Clients hire you by selecting a package. Define at least one clear offering with pricing and deliverables."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard2' })}
      cta="Continue to Portfolio"
      ctaDisabled={!allValid}
      ctaAction={handleContinue}
    >
      <div className="space-y-6">
        {packages.map((pkg, idx) => {
          const isValid = isPackageValid(pkg)
          const customInput = customInclusionInputs[pkg.id] || ''

          return (
            <div
              key={pkg.id}
              className={cn(
                'rounded-3xl p-5 border-2 bg-bone transition-all relative',
                isValid ? 'border-line focus-within:border-iris/60' : touched ? 'border-danger/60' : 'border-line'
              )}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-obsidian text-paper font-semibold">
                    Package {idx + 1} {idx === 0 && '• Primary'}
                  </span>
                  {isValid && (
                    <span className="text-[10px] text-success font-medium flex items-center gap-1">
                      <Check size={11} strokeWidth={3} /> Ready
                    </span>
                  )}
                </div>

                {packages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePackage(idx)}
                    className="tap text-obsidian/40 hover:text-danger p-1 text-[11px] flex items-center gap-1 transition"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>

              {/* Package Name */}
              <div className="mb-4">
                <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-1.5 block">
                  Package Name *
                </label>
                <input
                  value={pkg.name}
                  onChange={e => updatePackage(idx, { name: e.target.value })}
                  placeholder="e.g. Standard Portrait Session"
                  className="w-full py-2.5 px-4 rounded-xl bg-paper border border-line text-[14px] font-medium outline-none focus:ring-2 focus:ring-iris/20"
                />
              </div>

              {/* Price & Duration Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-1.5 block">
                    Price in ₹ *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-obsidian/40 font-mono text-[14px]">₹</span>
                    <input
                      type="number"
                      value={pkg.price}
                      onChange={e => updatePackage(idx, { price: e.target.value })}
                      placeholder="8000"
                      min={500}
                      className="w-full py-2.5 pl-8 pr-3 rounded-xl bg-paper border border-line text-[14px] font-mono font-semibold outline-none focus:ring-2 focus:ring-iris/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-1.5 block">
                    Session Duration
                  </label>
                  <select
                    value={pkg.duration}
                    onChange={e => updatePackage(idx, { duration: e.target.value })}
                    className="w-full py-2.5 px-3 rounded-xl bg-paper border border-line text-[13px] font-medium outline-none focus:ring-2 focus:ring-iris/20 cursor-pointer"
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery Turnaround */}
              <div className="mb-4">
                <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50 mb-1.5 flex items-center gap-1.5">
                  <Clock size={12} className="text-obsidian/50" />
                  Delivery Turnaround
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {DELIVERY_OPTIONS.map(del => (
                    <button
                      key={del.val}
                      type="button"
                      onClick={() => updatePackage(idx, { delivery: del.val })}
                      className={cn(
                        'tap py-2 px-2.5 rounded-xl border text-[11px] font-medium transition text-center',
                        pkg.delivery === del.val
                          ? 'bg-obsidian text-paper border-obsidian'
                          : 'bg-paper text-obsidian border-line hover:border-obsidian/30'
                      )}
                    >
                      {del.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deliverables / Inclusions */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">
                    What's included in this package? * ({pkg.inclusions.length})
                  </label>
                  {pkg.inclusions.length === 0 && (
                    <span className="text-[10px] text-danger font-medium flex items-center gap-1">
                      <AlertCircle size={10} /> Add at least 1 deliverable
                    </span>
                  )}
                </div>

                {/* Selected Deliverables Chips */}
                {pkg.inclusions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pkg.inclusions.map(inc => (
                      <span
                        key={inc}
                        className="inline-flex items-center gap-1.5 py-1 pl-3 pr-2 rounded-full bg-paper border border-line text-[11.5px] font-medium text-obsidian shadow-2xs"
                      >
                        {inc}
                        <button
                          type="button"
                          onClick={() => removeInclusion(pkg.id, inc)}
                          className="tap w-4 h-4 rounded-full hover:bg-danger/10 hover:text-danger grid place-items-center text-obsidian/40"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom Inclusion Input */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    value={customInput}
                    onChange={e =>
                      setCustomInclusionInputs({ ...customInclusionInputs, [pkg.id]: e.target.value })
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addInclusion(pkg.id, customInput)
                      }
                    }}
                    placeholder="Add deliverable (e.g. 20 edited images, raw video)..."
                    className="flex-1 py-2 px-3.5 rounded-xl bg-paper border border-line text-[12.5px] outline-none focus:ring-2 focus:ring-iris/20"
                  />
                  <button
                    type="button"
                    onClick={() => addInclusion(pkg.id, customInput)}
                    disabled={!customInput.trim()}
                    className={cn(
                      'tap px-3.5 py-2 rounded-xl text-[12px] font-semibold transition',
                      customInput.trim()
                        ? 'bg-obsidian text-paper cursor-pointer'
                        : 'bg-obsidian/10 text-obsidian/30 cursor-not-allowed'
                    )}
                  >
                    Add
                  </button>
                </div>

                {/* Quick Add Suggestions */}
                <div className="bg-paper/70 rounded-2xl p-3 border border-line">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-obsidian/40 mb-2 flex items-center gap-1">
                    <Sparkles size={11} className="text-iris" /> Quick suggestions for {discipline}:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions
                      .filter(s => !pkg.inclusions.includes(s))
                      .slice(0, 4)
                      .map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addInclusion(pkg.id, s)}
                          className="tap px-2.5 py-1 rounded-lg bg-bone hover:bg-iris/10 hover:text-iris text-[11px] font-medium text-obsidian/70 transition border border-line/60 flex items-center gap-1"
                        >
                          <Plus size={11} /> {s}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Add Tier Button */}
        {packages.length < 3 && (
          <button
            type="button"
            onClick={addPackage}
            className="tap w-full py-3.5 rounded-2xl border-2 border-dashed border-obsidian/20 hover:border-obsidian/50 bg-bone/50 text-[13px] font-semibold text-obsidian/70 hover:text-obsidian flex items-center justify-center gap-2 transition"
          >
            <Plus size={16} /> Add Package Tier {packages.length + 1} (e.g. Pro or Extended)
          </button>
        )}
      </div>
    </OnboardShell>
  )
}
