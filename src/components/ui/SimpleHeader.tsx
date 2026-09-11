import { ArrowLeft, X } from 'lucide-react'

interface SimpleHeaderProps {
  title: string
  onBack: () => void
  useX?: boolean
  right?: React.ReactNode
}

export function SimpleHeader({ title, onBack, useX = false, right }: SimpleHeaderProps) {
  const Ic = useX ? X : ArrowLeft
  return (
    <div className="px-5 py-3 flex items-center justify-between border-b border-line shrink-0 gap-2">
      <div className="shrink-0 flex items-center justify-start">
        <button onClick={onBack} className="tap w-10 h-10 -ml-2 grid place-items-center" aria-label="Back">
          <Ic size={20} />
        </button>
      </div>
      <span className="font-display text-lg tracking-tight truncate text-center flex-1">{title}</span>
      <div className="shrink-0 flex items-center justify-end">{right}</div>
    </div>
  )
}
