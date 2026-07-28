import { useRef, useEffect } from 'react'

export function SignPad({ who, onDone, onCancel }: { who: string; onDone: (url: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawn = useRef(false)
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#141414'
    let drawing = false
    const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height] as [number, number] }
    const down = (e: PointerEvent) => { drawing = true; drawn.current = true; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault() }
    const move = (e: PointerEvent) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); e.preventDefault() }
    const up = () => { drawing = false }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
    return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [])
  return (
    <div className="absolute inset-0 z-30 bg-obsidian/80 flex flex-col justify-center">
      <div className="bg-paper rounded-3xl mx-5 p-5">
        <div className="font-display text-xl tracking-tight">Sign as {who}</div>
        <div className="text-[11px] text-obsidian/60 mt-1">Draw your signature below. This e-signature is binding for this deal.</div>
        <canvas ref={ref} width={290} height={150} className="mt-3 w-full bg-bone rounded-2xl border-2 border-dashed border-line" style={{ touchAction: 'none', height: 150 }} />
        <div className="mt-4 flex gap-2">
          <button onClick={() => { const cv = ref.current; if (cv) cv.getContext('2d')?.clearRect(0, 0, cv.width, cv.height); drawn.current = false }} className="tap flex-1 py-3 rounded-xl bg-bone text-[13px] font-semibold">Clear</button>
          <button onClick={onCancel} className="tap flex-1 py-3 rounded-xl bg-bone text-[13px] font-semibold">Cancel</button>
          <button onClick={() => { if (!drawn.current) return; onDone(ref.current?.toDataURL('image/png') ?? '') }} className="tap flex-1 py-3 rounded-xl bg-obsidian text-acid text-[13px] font-semibold">Sign</button>
        </div>
      </div>
    </div>
  )
}
