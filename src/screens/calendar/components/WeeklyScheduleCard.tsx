import { Check } from 'lucide-react'
import { TimePicker } from '@/components/ui/TimePicker'
import { cn } from '@/utils'
import type { WeekScheduleMap } from '../types'

interface WeeklyScheduleCardProps {
  schedules: WeekScheduleMap
  onToggleDayActive: (dow: number) => void
  onScheduleTimeChange: (dow: number, field: 'start' | 'end', val: string) => void
  onResetGlobalHours: () => void
}

const DAYS_OF_WEEK = [
  { dow: 1, label: 'Monday' },
  { dow: 2, label: 'Tuesday' },
  { dow: 3, label: 'Wednesday' },
  { dow: 4, label: 'Thursday' },
  { dow: 5, label: 'Friday' },
  { dow: 6, label: 'Saturday' },
  { dow: 0, label: 'Sunday' },
]

export function WeeklyScheduleCard({
  schedules,
  onToggleDayActive,
  onScheduleTimeChange,
  onResetGlobalHours,
}: WeeklyScheduleCardProps) {
  return (
    <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-1 border-b border-line">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
          Weekly Schedule
        </div>
        <button
          type="button"
          onClick={onResetGlobalHours}
          className="tap text-[11px] font-semibold text-iris hover:underline cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div className="space-y-1.5 pt-0.5">
        {DAYS_OF_WEEK.map(({ dow, label }) => {
          const cfg = schedules[dow] || { active: false, start: '09:00', end: '18:00' }
          return (
            <div
              key={dow}
              className={cn(
                'p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px] transition-all',
                cfg.active ? 'bg-bone border-line' : 'bg-bone/40 border-line/50 opacity-60'
              )}
            >
              <div className="flex items-center justify-between sm:justify-start gap-2 min-w-[100px]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleDayActive(dow)}
                    className={cn(
                      'tap w-5 h-5 rounded-md flex items-center justify-center transition cursor-pointer shrink-0',
                      cfg.active ? 'bg-obsidian text-paper' : 'bg-obsidian/15 text-transparent'
                    )}
                    aria-label={`Toggle ${label}`}
                  >
                    <Check size={12} />
                  </button>
                  <span className={cn('font-medium', cfg.active ? 'text-obsidian font-semibold' : 'text-obsidian/50')}>
                    {label}
                  </span>
                </div>
                {!cfg.active && (
                  <span className="sm:hidden text-[11px] font-mono text-obsidian/40">Day Off</span>
                )}
              </div>

              {cfg.active ? (
                <div className="flex flex-col items-end self-end sm:self-auto">
                  <div className="flex items-center gap-1.5">
                    <TimePicker
                      value={cfg.start}
                      onChange={val => onScheduleTimeChange(dow, 'start', val)}
                    />
                    <span className="text-obsidian/40 text-[11px] font-mono">–</span>
                    <TimePicker
                      value={cfg.end}
                      align="right"
                      onChange={val => onScheduleTimeChange(dow, 'end', val)}
                    />
                  </div>
                  {cfg.start >= cfg.end && (
                    <span className="text-[10px] text-rose-600 font-mono mt-0.5 animate-fade-in">
                      End must be after start
                    </span>
                  )}
                </div>
              ) : (
                <span className="hidden sm:inline text-[11px] font-mono text-obsidian/40 pr-2">Day Off</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
