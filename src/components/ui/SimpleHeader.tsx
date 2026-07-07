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
    <div className="px-5 py-3 flex items-center justify-between border-b border-line shrink-0">
      <button onClick={onBack} className="tap w-10 h-10 -ml-2 grid place-items-center">
        <Ic size={20} />
      </button>
      <span className="font-display text-lg tracking-tight">{title}</span>
      <div className="w-10">{right}</div>
    </div>
  )
}
