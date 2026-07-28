import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/utils'

export function OnboardShell({
  step,
  total,
  title,
  sub,
  onBack,
  children,
  cta,
  ctaAction,
  ctaDisabled,
}: {
  step: number
  total: number
  title: string
  sub: string
  onBack: () => void
  children: React.ReactNode
  cta: string
  ctaAction: () => void
  ctaDisabled?: boolean
}) {
  return (
    <div className="flex-1 relative flex flex-col bg-paper overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-line shrink-0">
        <button onClick={onBack} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i < step ? 'w-6 bg-iris' : i === step - 1 ? 'w-8 bg-obsidian' : 'w-4 bg-obsidian/15'
              )}
            />
          ))}
        </div>
        <div className="font-mono text-[10px] uppercase text-obsidian/45 tracking-wider">
          {step}/{total}
        </div>
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
          className={cn(
            'tap w-full py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 transition',
            ctaDisabled ? 'bg-bone text-obsidian/30' : 'bg-obsidian text-paper'
          )}
        >
          {cta} {!ctaDisabled && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
