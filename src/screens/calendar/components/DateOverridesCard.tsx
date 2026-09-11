import { Plus, X, Trash2 } from 'lucide-react'
import { TimePicker } from '@/components/ui/TimePicker'
import { cn } from '@/utils'
import type { OverrideStateItem } from '../types'

interface DateOverridesCardProps {
  overrides: OverrideStateItem[]
  showAddOverride: boolean
  newOverrideType: 'blocked' | 'custom_hours'
  newOverrideDate: string
  newOverrideReason: string
  newOverrideStartTime: string
  newOverrideEndTime: string
  todayStr: string
  onOpenAddOverride: (type: 'blocked' | 'custom_hours') => void
  onCloseAddOverride: () => void
  onDateChange: (date: string) => void
  onReasonChange: (reason: string) => void
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  onAddOverride: () => void
  onRemoveOverride: (id: string) => void
}

export function DateOverridesCard({
  overrides,
  showAddOverride,
  newOverrideType,
  newOverrideDate,
  newOverrideReason,
  newOverrideStartTime,
  newOverrideEndTime,
  todayStr,
  onOpenAddOverride,
  onCloseAddOverride,
  onDateChange,
  onReasonChange,
  onStartTimeChange,
  onEndTimeChange,
  onAddOverride,
  onRemoveOverride,
}: DateOverridesCardProps) {
  return (
    <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
          Date Overrides
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenAddOverride('blocked')}
            className={cn(
              'tap text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1',
              showAddOverride && newOverrideType === 'blocked'
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
            )}
          >
            <Plus size={12} />
            <span>Block Day</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAddOverride('custom_hours')}
            className={cn(
              'tap text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1',
              showAddOverride && newOverrideType === 'custom_hours'
                ? 'bg-iris/10 border-iris/30 text-iris'
                : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
            )}
          >
            <Plus size={12} />
            <span>Custom Hours</span>
          </button>
        </div>
      </div>

      {showAddOverride && (
        <div className="p-3 rounded-xl bg-bone border border-line space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-bold text-obsidian flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', newOverrideType === 'blocked' ? 'bg-rose-500' : 'bg-iris')} />
              {newOverrideType === 'blocked' ? 'Block Date / Mark Unavailable' : 'Set Custom Working Hours'}
            </span>
            <button
              type="button"
              onClick={onCloseAddOverride}
              className="tap text-[11px] text-obsidian/40 hover:text-obsidian p-1"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[9.5px] font-mono text-obsidian/50 mb-1">Date</label>
              <input
                type="date"
                value={newOverrideDate}
                min={todayStr}
                onChange={e => onDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-paper border border-line text-[12px] font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-[9.5px] font-mono text-obsidian/50 mb-1">Reason / Label</label>
              <input
                type="text"
                placeholder={newOverrideType === 'blocked' ? 'Day off, vacation' : 'e.g. Evening shoot only'}
                value={newOverrideReason}
                onChange={e => onReasonChange(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-paper border border-line text-[12px] outline-none"
              />
            </div>
          </div>

          {newOverrideType === 'custom_hours' && (
            <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-line/60">
              <div>
                <label className="block text-[9.5px] font-mono text-obsidian/50 mb-1">Start Time</label>
                <TimePicker
                  value={newOverrideStartTime}
                  onChange={onStartTimeChange}
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-mono text-obsidian/50 mb-1">End Time</label>
                <TimePicker
                  value={newOverrideEndTime}
                  onChange={onEndTimeChange}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCloseAddOverride}
              className="tap px-2.5 py-1 rounded-lg text-[11px] text-obsidian/60 hover:bg-paper cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onAddOverride}
              disabled={!newOverrideDate}
              className={cn(
                'tap px-3 py-1 rounded-lg text-paper text-[11px] font-semibold cursor-pointer disabled:opacity-40 transition',
                newOverrideType === 'blocked' ? 'bg-rose-700 hover:bg-rose-800' : 'bg-obsidian hover:bg-obsidian/90'
              )}
            >
              {newOverrideType === 'blocked' ? 'Block Date' : 'Save Custom Hours'}
            </button>
          </div>
        </div>
      )}

      {overrides.length === 0 ? (
        <div className="text-[11.5px] text-obsidian/40 py-1">
          No date overrides scheduled.
        </div>
      ) : (
        <div className="space-y-1.5">
          {overrides.map(o => (
            <div
              key={o.id}
              className="p-2.5 rounded-xl bg-bone border border-line flex items-center justify-between gap-2 text-[12px]"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-semibold text-obsidian text-[12px]">{o.date}</span>
                {o.override_type === 'custom_hours' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-iris/15 text-iris border border-iris/20">
                    {o.custom_start_time?.slice(0, 5) || '10:00'} – {o.custom_end_time?.slice(0, 5) || '18:00'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    Blocked
                  </span>
                )}
                {o.reason && (
                  <span className="text-[11px] text-obsidian/50 truncate max-w-[200px]">
                    {o.reason}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemoveOverride(o.id)}
                className="tap p-1.5 rounded-lg hover:bg-rose-50 text-obsidian/40 hover:text-rose-600 transition cursor-pointer shrink-0"
                title="Remove override"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
