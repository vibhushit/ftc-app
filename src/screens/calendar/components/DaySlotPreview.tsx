import { Clock, Lock, Sparkles } from 'lucide-react'
import type { OverrideStateItem } from '../types'

interface DaySlotPreviewProps {
  monthName: string
  selectedDay: number
  selectedOverride?: OverrideStateItem
  isSelectedDayOff: boolean
  previewSlots: string[]
  slotStep: number
  buffer: number
  onRemoveOverride: (id: string) => void
}

export function DaySlotPreview({
  monthName,
  selectedDay,
  selectedOverride,
  isSelectedDayOff,
  previewSlots,
  slotStep,
  buffer,
  onRemoveOverride,
}: DaySlotPreviewProps) {
  const isBlocked = selectedOverride?.override_type === 'blocked'
  const isCustomHours = selectedOverride?.override_type === 'custom_hours'

  return (
    <div className="mt-4 pt-4 border-t border-line space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <Clock size={14} className="text-iris" />
          <span>{monthName} {selectedDay} Preview</span>
        </div>
        {selectedOverride && (
          <button
            onClick={() => onRemoveOverride(selectedOverride.id)}
            className={
              isBlocked
                ? 'tap px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer'
                : 'tap px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-bone text-obsidian/70 border border-line hover:bg-obsidian/10 transition cursor-pointer'
            }
          >
            {isBlocked ? 'Unblock Date' : 'Reset to Weekly Hours'}
          </button>
        )}
      </div>

      {isBlocked ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11.5px] text-rose-800 flex items-center gap-2 animate-fade-in">
          <Lock size={14} className="text-rose-600 shrink-0" />
          <span>Blocked: {selectedOverride?.reason || 'Unavailable'}</span>
        </div>
      ) : isSelectedDayOff && !isCustomHours ? (
        <div className="rounded-xl bg-bone border border-line p-3 text-[11.5px] text-obsidian/60 flex items-center gap-2">
          <Lock size={14} className="text-obsidian/40 shrink-0" />
          <span>Regular day off. Turn on in Weekly Schedule to open slots.</span>
        </div>
      ) : (
        <div className="space-y-2.5 animate-fade-in">
          {isCustomHours && (
            <div className="rounded-xl bg-iris/10 border border-iris/25 p-2.5 text-[11.5px] text-iris flex items-center gap-2">
              <Sparkles size={14} className="text-iris shrink-0" />
              <span>
                <strong className="font-semibold">Custom Hours:</strong>{' '}
                {selectedOverride?.custom_start_time || '10:00'} – {selectedOverride?.custom_end_time || '18:00'}
                {selectedOverride?.reason ? ` · ${selectedOverride.reason}` : ''}
              </span>
            </div>
          )}

          {previewSlots.length === 0 ? (
            <div className="rounded-xl bg-bone border border-line p-3 text-[11.5px] text-obsidian/60">
              No slots fit into configured hours with {slotStep}m interval and {buffer}m buffer.
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-obsidian/60">
                {previewSlots.length} Available Slots
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {previewSlots.map((slot, i) => (
                  <div
                    key={i}
                    className="py-1.5 px-2 rounded-lg text-[10.5px] font-mono font-semibold text-center tnum bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
