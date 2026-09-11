import { Loader2 } from 'lucide-react'
import { cn } from '@/utils'

interface BookingRulesCardProps {
  slotStep: number
  onSlotStepChange: (step: number) => void
  buffer: number
  onBufferChange: (buf: number) => void
  minNotice: number
  onMinNoticeChange: (notice: number) => void
  loadingSettings: boolean
}

export function BookingRulesCard({
  slotStep,
  onSlotStepChange,
  buffer,
  onBufferChange,
  minNotice,
  onMinNoticeChange,
  loadingSettings,
}: BookingRulesCardProps) {
  return (
    <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
          Booking Rules
        </div>
        {loadingSettings && (
          <div className="flex items-center gap-1 text-[11px] text-obsidian/45">
            <Loader2 size={12} className="animate-spin text-iris" />
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Slot Interval */}
      <div>
        <div className="text-[12px] font-medium text-obsidian mb-1.5">
          Slot Interval
        </div>
        <div className="grid grid-cols-5 gap-1">
          {[
            [30, '30m'],
            [60, '60m'],
            [90, '90m'],
            [120, '2h'],
            [240, '4h'],
          ].map(([mins, label]) => (
            <button
              key={mins}
              type="button"
              onClick={() => onSlotStepChange(Number(mins))}
              className={cn(
                'tap py-1.5 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer',
                slotStep === mins
                  ? 'bg-obsidian text-paper border-obsidian'
                  : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Buffer Time */}
      <div className="pt-2 border-t border-line">
        <div className="text-[12px] font-medium text-obsidian mb-1.5">
          Buffer Time
        </div>
        <div className="grid grid-cols-4 gap-1">
          {[
            [0, '0m'],
            [15, '15m'],
            [30, '30m'],
            [60, '60m'],
          ].map(([mins, label]) => (
            <button
              key={mins}
              type="button"
              onClick={() => onBufferChange(Number(mins))}
              className={cn(
                'tap py-1.5 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer',
                buffer === mins
                  ? 'bg-obsidian text-paper border-obsidian'
                  : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notice Required */}
      <div className="pt-2 border-t border-line">
        <div className="text-[12px] font-medium text-obsidian mb-1.5">
          Notice Required
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            [12, '12h'],
            [24, '24h'],
            [48, '48h'],
          ].map(([hrs, label]) => (
            <button
              key={hrs}
              type="button"
              onClick={() => onMinNoticeChange(Number(hrs))}
              className={cn(
                'tap py-1.5 rounded-xl text-[11px] font-semibold border transition text-center cursor-pointer',
                minNotice === hrs
                  ? 'bg-obsidian text-paper border-obsidian'
                  : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
