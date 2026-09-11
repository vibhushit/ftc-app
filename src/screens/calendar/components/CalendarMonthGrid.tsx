import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils'
import type { OverrideStateItem, WeekScheduleMap } from '../types'

interface CalendarMonthGridProps {
  currentYear: number
  currentMonth: number // 1-12
  selectedDay: number
  onSelectDay: (day: number) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  isCurrentOrPastMonth: boolean
  monthNames: string[]
  todayStr: string
  overrides: OverrideStateItem[]
  schedules: WeekScheduleMap
}

export function CalendarMonthGrid({
  currentYear,
  currentMonth,
  selectedDay,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  isCurrentOrPastMonth,
  monthNames,
  todayStr,
  overrides,
  schedules,
}: CalendarMonthGridProps) {
  // Days in month calculation (leap year safe)
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate()
  // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
  const rawFirstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
  // Monday-first offset: 0 for Mon, 6 for Sun
  const mondayOffset = (rawFirstDay + 6) % 7

  return (
    <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs">
      {/* Month Picker Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="font-display text-xl tracking-tight">
          {monthNames[currentMonth - 1]} {currentYear}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            disabled={isCurrentOrPastMonth}
            className={cn(
              'tap w-8 h-8 rounded-full border border-line bg-bone grid place-items-center transition',
              isCurrentOrPastMonth
                ? 'text-obsidian/20 cursor-not-allowed opacity-50'
                : 'hover:bg-obsidian/10 text-obsidian/70'
            )}
            aria-label="Previous Month"
            title={isCurrentOrPastMonth ? 'Cannot view past months' : 'Previous Month'}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNextMonth}
            className="tap w-8 h-8 rounded-full border border-line bg-bone grid place-items-center hover:bg-obsidian/10 transition text-obsidian/70"
            aria-label="Next Month"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-obsidian/50 mb-3 pb-2.5 border-b border-line">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Open</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-iris" /> Custom Hours</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-obsidian/20" /> Day Off</span>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10.5px] font-mono text-obsidian/45 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Compact Date Grid */}
      <div className="grid grid-cols-7 gap-1.5 place-items-center">
        {Array.from({ length: mondayOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8 md:w-9 md:h-9" />
        ))}
        {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map(d => {
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const dow = new Date(currentYear, currentMonth - 1, d).getDay()
          const override = overrides.find(o => o.date === dateStr)
          const isCustomHours = override?.override_type === 'custom_hours'
          const isBlockedOverride = override?.override_type === 'blocked'
          const isDayOff = !isCustomHours && !schedules[dow]?.active
          const isPast = dateStr < todayStr
          const isToday = dateStr === todayStr
          const isSelected = selectedDay === d

          let statusClass = 'bg-bone text-obsidian hover:bg-obsidian/10'
          if (isBlockedOverride) {
            statusClass = 'bg-rose-100 text-rose-800 font-semibold line-through'
          } else if (isCustomHours) {
            statusClass = 'bg-iris/20 text-iris font-bold border border-iris/40'
          } else if (isDayOff) {
            statusClass = 'bg-obsidian/10 text-obsidian/35'
          } else if (isPast) {
            statusClass = 'bg-bone/40 text-obsidian/25'
          }

          return (
            <button
              key={d}
              onClick={() => onSelectDay(d)}
              className={cn(
                'w-8 h-8 md:w-9 md:h-9 rounded-xl text-[12px] font-medium tnum flex items-center justify-center transition-all relative',
                isSelected
                  ? 'bg-obsidian text-paper font-bold shadow-md ring-2 ring-iris/40'
                  : statusClass,
                isToday && !isSelected && 'ring-1 ring-iris/50 font-bold'
              )}
            >
              {d}
              {isCustomHours && !isSelected && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-iris" title="Custom working hours" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
