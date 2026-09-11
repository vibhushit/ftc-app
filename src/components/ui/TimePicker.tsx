import { useState, useRef, useEffect } from 'react'
import { Clock, Check, X } from 'lucide-react'
import { cn } from '@/utils'

export interface TimePickerProps {
  value: string // "HH:MM" in 24-hour format, e.g. "09:00" or "18:30"
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  id?: string
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  className,
  id,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse 24-hour "HH:MM" into 12-hour components
  const rawParts = (value || '09:00').split(':')
  const rawHour = parseInt(rawParts[0] || '9', 10)
  const rawMinute = parseInt(rawParts[1] || '0', 10)

  const isPM = rawHour >= 12
  const hour12 = rawHour === 0 ? 12 : rawHour > 12 ? rawHour - 12 : rawHour
  const minuteRounded = [0, 15, 30, 45].reduce((prev, curr) =>
    Math.abs(curr - rawMinute) < Math.abs(prev - rawMinute) ? curr : prev
  , 0)

  // Close on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const commitTime = (h12: number, min: number, pm: boolean) => {
    let h24 = h12 % 12
    if (pm) h24 += 12
    const str24 = `${String(h24).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    onChange(str24)
  }

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const minutesList = [0, 15, 30, 45]

  const displayTime = `${String(hour12).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)} id={id}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'tap px-2.5 py-1.5 rounded-xl border bg-paper text-obsidian text-[11.5px] font-mono flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer',
          isOpen ? 'border-obsidian ring-2 ring-iris/20' : 'border-line hover:border-obsidian/30',
          disabled && 'opacity-50 cursor-not-allowed bg-bone/60'
        )}
      >
        <Clock size={12} className={isOpen ? 'text-iris' : 'text-obsidian/40'} />
        <span className="font-semibold tracking-tight">{displayTime}</span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 -left-1 sm:left-0 w-60 rounded-2xl bg-paper border border-line shadow-xl p-3 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-line">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
              Select Time
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="tap p-1 rounded-lg text-obsidian/40 hover:text-obsidian hover:bg-bone transition cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          {/* AM / PM Segmented Control */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-bone rounded-xl mb-3 border border-line/60">
            <button
              type="button"
              onClick={() => commitTime(hour12, minuteRounded, false)}
              className={cn(
                'tap py-1 rounded-lg text-[11px] font-mono font-semibold transition text-center cursor-pointer',
                !isPM ? 'bg-obsidian text-paper shadow-2xs' : 'text-obsidian/60 hover:text-obsidian'
              )}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => commitTime(hour12, minuteRounded, true)}
              className={cn(
                'tap py-1 rounded-lg text-[11px] font-mono font-semibold transition text-center cursor-pointer',
                isPM ? 'bg-obsidian text-paper shadow-2xs' : 'text-obsidian/60 hover:text-obsidian'
              )}
            >
              PM
            </button>
          </div>

          {/* Hour Grid (4 cols x 3 rows - 100% visible, no scrolling) */}
          <div className="mb-2.5">
            <div className="text-[10px] font-mono text-obsidian/40 mb-1 text-center font-semibold uppercase tracking-wider">
              Hour
            </div>
            <div className="grid grid-cols-4 gap-1">
              {hoursList.map(h => (
                <button
                  key={h}
                  type="button"
                  onClick={() => commitTime(h, minuteRounded, isPM)}
                  className={cn(
                    'tap py-1.5 rounded-lg text-[12px] font-mono font-semibold text-center transition cursor-pointer',
                    hour12 === h
                      ? 'bg-obsidian text-paper shadow-2xs'
                      : 'bg-bone text-obsidian/70 hover:bg-obsidian/10'
                  )}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minute Grid (Single row of 4) */}
          <div className="mb-3">
            <div className="text-[10px] font-mono text-obsidian/40 mb-1 text-center font-semibold uppercase tracking-wider">
              Minute
            </div>
            <div className="grid grid-cols-4 gap-1">
              {minutesList.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => commitTime(hour12, m, isPM)}
                  className={cn(
                    'tap py-1.5 rounded-lg text-[11.5px] font-mono font-semibold text-center transition cursor-pointer',
                    minuteRounded === m
                      ? 'bg-obsidian text-paper shadow-2xs'
                      : 'bg-bone text-obsidian/70 hover:bg-obsidian/10'
                  )}
                >
                  :{String(m).padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="tap w-full py-1.5 rounded-xl bg-obsidian text-paper text-[11.5px] font-semibold flex items-center justify-center gap-1.5 hover:bg-obsidian/90 transition shadow-2xs cursor-pointer"
          >
            <Check size={12} className="text-acid" />
            <span>Apply</span>
          </button>
        </div>
      )}
    </div>
  )
}
