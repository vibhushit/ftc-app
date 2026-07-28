import { useState, useRef } from 'react'
import { Upload, Instagram, Check, X, Shield } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { pic } from '@/data/constants'
import { cn } from '@/utils'
import { OnboardShell } from './OnboardShell'

export function CreatorOnboard3() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [imported, setImported] = useState<string[]>(state.onboard.portfolio ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const addPics = (seeds: string[]) => setImported(cur => [...cur, ...seeds.filter(s => !cur.includes(s))].slice(0, 9))
  
  const importIG = () => addPics([pic('onb-1', 600, 600), pic('onb-2', 600, 600), pic('onb-3', 600, 600), pic('onb-4', 600, 600)])
  const importBe = () => addPics([pic('onb-be1', 600, 600), pic('onb-be2', 600, 600), pic('onb-be3', 600, 600)])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)

    const newUrls: string[] = []
    Array.from(files).forEach(file => {
      const blobUrl = URL.createObjectURL(file)
      newUrls.push(blobUrl)
    })

    setTimeout(() => {
      addPics(newUrls)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }, 400)
  }

  const triggerUpload = () => {
    if (uploading || imported.length >= 9) return
    fileInputRef.current?.click()
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-bone border border-line">
          <div className="text-[12px] font-semibold">{imported.length} of 9 added {imported.length >= 3 ? '· looking good ✓' : `· ${left} more needed`}</div>
          <div className="mt-1.5 h-1.5 rounded-full bg-paper overflow-hidden">
            <div className={cn('h-full transition-all duration-500', imported.length >= 3 ? 'bg-success' : 'bg-iris')} style={{ width: `${Math.min(imported.length / 3 * 100, 100)}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={importIG} className="tap p-4 rounded-xl border-2 border-line active:bg-bone text-left">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-500 grid place-items-center">
              <Instagram size={16} className="text-white" />
            </div>
            <div className="mt-3 text-[13px] font-semibold">Import from Instagram</div>
            <div className="text-[11px] text-obsidian/60 mt-0.5">Pulls sample grid posts</div>
          </button>
          <button onClick={importBe} className="tap p-4 rounded-xl border-2 border-line active:bg-bone text-left">
            <div className="w-8 h-8 rounded-lg bg-[#1769FF] grid place-items-center text-white font-bold text-xs">Bē</div>
            <div className="mt-3 text-[13px] font-semibold">Import from Behance</div>
            <div className="text-[11px] text-obsidian/60 mt-0.5">Pulls project covers</div>
          </button>
        </div>
        <button onClick={triggerUpload} className={cn('tap w-full py-4 border-2 border-dashed rounded-xl text-[13px] font-medium flex items-center justify-center gap-2 transition', uploading ? 'border-iris text-iris bg-iris-tint' : 'border-line text-obsidian/60 active:bg-bone')}>
          <Upload size={16} />
          {uploading ? 'Uploading…' : 'Upload from this device (photo or video)'}
        </button>
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
