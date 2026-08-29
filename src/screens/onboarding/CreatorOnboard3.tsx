import { useState, useRef } from 'react'
import { Check, X, Shield, Loader2, Camera } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { cn } from '@/utils'
import { apiClient } from '@/services/apiClient'
import { OnboardShell } from './OnboardShell'

export function CreatorOnboard3() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [imported, setImported] = useState<string[]>(state.onboard.portfolio ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    const remainingSlots = Math.max(0, 5 - imported.length)
    const selectedFiles = Array.from(files).slice(0, remainingSlots)

    try {
      const uploadedUrls = await Promise.all(
        selectedFiles.map(file => apiClient.uploadPortfolioImage(file))
      )
      setImported(cur => [...cur, ...uploadedUrls.filter(u => u && !cur.includes(u))].slice(0, 5))
    } catch (err: any) {
      console.warn('Portfolio upload failed:', err)
      setUploadError('Failed to upload image. Please try again with a JPG or PNG.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const triggerUpload = () => {
    if (uploading || imported.length >= 5) return
    fileInputRef.current?.click()
  }

  const left = Math.max(0, 1 - imported.length)

  return (
    <OnboardShell
      step={3} total={5}
      title="Show your craft"
      sub="Upload 1 to 5 of your best photos. Images are automatically compressed for ultra-fast client loading."
      onBack={() => dispatch({ type: 'GO', screen: 'creatorOnboard2' })}
      cta={left > 0 ? `Add ${left} photo to continue` : 'Continue'}
      ctaDisabled={imported.length < 1}
      ctaAction={() => {
        dispatch({ type: 'SET_ONBOARD', patch: { portfolio: imported } })
        dispatch({ type: 'GO', screen: 'creatorOnboard4' })
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-4">
        {/* Progress header */}
        <div className="p-3 rounded-xl bg-bone border border-line flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold">
              {imported.length} of 5 photos added {imported.length >= 1 ? '· looking good ✓' : '· min 1 required'}
            </div>
            <div className="text-[11px] text-obsidian/50 mt-0.5">High-resolution JPG, PNG, or WebP</div>
          </div>
          <span className={cn('px-2.5 py-1 rounded-full text-[10.5px] font-mono font-semibold', imported.length >= 1 ? 'bg-success/15 text-success' : 'bg-obsidian/10 text-obsidian/60')}>
            {imported.length}/5
          </span>
        </div>

        {uploadError && (
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[12px]">
            {uploadError}
          </div>
        )}

        {/* Upload Dropzone */}
        {imported.length < 5 && (
          <div
            onClick={triggerUpload}
            className={cn(
              'tap group relative p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition',
              uploading ? 'border-iris bg-iris-tint/30 pointer-events-none' : 'border-line hover:border-obsidian/40 bg-bone/40 active:bg-bone'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center py-2">
                <Loader2 size={28} className="text-iris animate-spin mb-2" />
                <div className="text-[13px] font-semibold text-iris">Compressing & uploading photos…</div>
                <div className="text-[11px] text-obsidian/50 mt-0.5">Securing to your portfolio</div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-paper border border-line grid place-items-center shadow-xs mb-3 group-hover:scale-105 transition">
                  <Camera size={22} className="text-obsidian/70" />
                </div>
                <div className="text-[13.5px] font-semibold text-obsidian">
                  Tap to choose from Camera Roll or Files
                </div>
                <div className="text-[11.5px] text-obsidian/55 mt-1">
                  Select up to 5 best images ({5 - imported.length} remaining)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Previews */}
        {imported.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-obsidian/50">Your portfolio ({imported.length})</div>
              {imported.length >= 1 && <div className="flex items-center gap-1 text-[11px] text-success"><Check size={12} /> Ready for client review</div>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {imported.map((src, i) => (
                <div key={src + i} className="relative aspect-square rounded-xl overflow-hidden bg-bone border border-line shadow-xs group">
                  <img src={src} className="w-full h-full object-cover" alt="Portfolio thumbnail" />
                  {i === 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-acid text-obsidian text-[8.5px] font-mono font-bold uppercase shadow-sm">
                      Cover
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setImported([imported[i], ...imported.filter((_, j) => j !== i)])}
                      className="tap absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-obsidian/80 text-paper text-[8px] font-mono hover:bg-obsidian"
                    >
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setImported(imported.filter((_, j) => j !== i))}
                    className="tap absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-obsidian/80 text-paper grid place-items-center hover:bg-danger transition cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-obsidian/50">
              The first image is your main profile cover shown in discovery feeds.
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-iris-tint flex items-start gap-2.5">
          <Shield size={16} className="text-iris shrink-0 mt-0.5" />
          <div className="text-[12px] leading-relaxed text-obsidian/80">
            <span className="font-semibold text-iris">Original work only: </span>
            Upload only images captured or edited by you. You can update or replace portfolio photos anytime from your settings.
          </div>
        </div>
      </div>
    </OnboardShell>
  )
}

