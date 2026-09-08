import { useState } from 'react'
import {
  Check,
  Clock,
  Lock,
  Zap,
  Loader2,
  LogOut,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Copy,
  Plus,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { inr } from '@/data/constants'
import { cn, shareOrCopy } from '@/utils'
import { supabase, supabaseAvailable } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import { apiClient } from '@/services/apiClient'

/* ─── Settings Screen ─── */
export function SettingsScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const u = state.user ?? {}
  const [name, setName] = useState(u.name ?? '')
  const [city, setCity] = useState(u.city ?? '')
  const [handle, setHandle] = useState(u.handle ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      if (supabaseAvailable) {
        await authApi.updateMyProfile({ name: name.trim(), city: city.trim() })
      }
      dispatch({ type: 'UPDATE_USER', patch: { name: name.trim(), city: city.trim(), handle: handle.trim() } })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      console.error('[FTC] Failed to update profile:', e)
      setError(e?.message || 'Failed to save changes to database')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (supabaseAvailable) {
        await supabase.auth.signOut()
      }
    } catch (e) {
      console.warn('[FTC] signOut error:', e)
    }
    try {
      localStorage.removeItem('ftc_saved_session')
    } catch {}
    dispatch({ type: 'RESET' })
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Settings" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">Profile details</div>
          <div>
            <label className="text-[11px] text-obsidian/60">Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rhea Kapoor"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>
          <div>
            <label className="text-[11px] text-obsidian/60">City</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Delhi NCR, Mumbai"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>
          <div>
            <label className="text-[11px] text-obsidian/60">Handle</label>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="e.g. @rhea.kapoor"
              className="mt-1 w-full py-2.5 px-3 bg-bone rounded-xl text-[13px] outline-none focus:ring-1 focus:ring-obsidian"
            />
          </div>

          {error && <p className="text-[12px] text-danger font-medium">{error}</p>}

          <button
            onClick={save}
            disabled={saving}
            className={cn(
              'tap w-full mt-2 py-3 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition shadow-sm cursor-pointer',
              saved ? 'bg-success text-paper' : 'bg-obsidian text-paper hover:bg-obsidian/90 disabled:opacity-50'
            )}
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving to database…</>
            ) : saved ? (
              <><Check size={14} /> Saved to Database ✓</>
            ) : (
              'Save changes'
            )}
          </button>
        </div>

        {/* Account & Session Box */}
        <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-1">Account & Session</div>
          <p className="text-[12px] text-obsidian/60">
            Signed in as <span className="font-mono text-obsidian font-semibold">{u.email || u.phone || u.name || 'User'}</span>
          </p>
          <button
            onClick={handleLogout}
            className="tap w-full py-2.5 rounded-xl border border-danger/30 text-danger text-[12.5px] font-semibold hover:bg-danger/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Log out of this device
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Calendar Screen (Comprehensive Creator Management & Sync) ─── */
export function CalendarScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))

  // Multi-month calendar state
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(5) // 1-12 (May 2026)
  const [selectedDay, setSelectedDay] = useState(18)

  // Scheduling settings state
  const [slotStep, setSlotStep] = useState(60) // 30, 60, 90, 120, 240 mins
  const [buffer, setBuffer] = useState(30) // 0, 15, 30, 60 mins
  const [minNotice, setMinNotice] = useState(24) // 12, 24, 48 hours
  const [instant, setInstant] = useState(false)
  const [holiday, setHoliday] = useState(false)

  // Weekly working hours schedule (1 = Mon, 2 = Tue, ... 6 = Sat, 0 = Sun)
  const [schedules, setSchedules] = useState<Record<number, { active: boolean; start: string; end: string }>>({
    1: { active: true, start: '09:00', end: '19:00' },
    2: { active: true, start: '09:00', end: '19:00' },
    3: { active: true, start: '09:00', end: '19:00' },
    4: { active: true, start: '09:00', end: '19:00' },
    5: { active: true, start: '09:00', end: '19:00' },
    6: { active: true, start: '10:00', end: '18:00' },
    0: { active: false, start: '10:00', end: '18:00' },
  })

  // Date overrides (one-off leaves / blocks)
  const [overrides, setOverrides] = useState<Array<{ id: string; date: string; reason: string }>>([
    { id: 'ovr-1', date: '2026-05-20', reason: 'Personal Leave / Traveling' },
    { id: 'ovr-2', date: '2026-05-25', reason: 'Studio Maintenance' },
  ])
  const [newOverrideDate, setNewOverrideDate] = useState('2026-05-22')
  const [newOverrideReason, setNewOverrideReason] = useState('Out of station')
  const [showAddOverride, setShowAddOverride] = useState(false)

  // iCal & sync state
  const [copiedIcal, setCopiedIcal] = useState(false)
  const [showIcalGuide, setShowIcalGuide] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  // Days in month calculation (leap year safe)
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate()
  // Day of week for 1st of month: 0 (Sun) to 6 (Sat)
  const rawFirstDay = new Date(currentYear, currentMonth - 1, 1).getDay()
  // Monday-first offset: 0 for Mon, 6 for Sun
  const mondayOffset = (rawFirstDay + 6) % 7

  const selectedDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const selectedDow = new Date(currentYear, currentMonth - 1, selectedDay).getDay()
  const isSelectedDayOff = !schedules[selectedDow]?.active
  const selectedOverride = overrides.find(o => o.date === selectedDateStr)
  const isSelectedBlocked = isSelectedDayOff || !!selectedOverride || holiday

  // Calculate slots preview for selected day
  const previewSlots: string[] = []
  if (!isSelectedBlocked && schedules[selectedDow]?.active) {
    const [sh, sm] = schedules[selectedDow].start.split(':').map(Number)
    const [eh, em] = schedules[selectedDow].end.split(':').map(Number)
    let currentMins = sh * 60 + sm
    const endMins = eh * 60 + em
    while (currentMins + slotStep <= endMins) {
      const h = Math.floor(currentMins / 60)
      const m = currentMins % 60
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 === 0 ? 12 : h % 12
      previewSlots.push(`${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`)
      currentMins += slotStep + buffer
    }
  }

  const handleToggleDayActive = (dow: number) => {
    setSchedules(prev => ({
      ...prev,
      [dow]: { ...prev[dow], active: !prev[dow].active },
    }))
  }

  const handleApplyGlobalHours = () => {
    setSchedules({
      1: { active: true, start: '09:00', end: '19:00' },
      2: { active: true, start: '09:00', end: '19:00' },
      3: { active: true, start: '09:00', end: '19:00' },
      4: { active: true, start: '09:00', end: '19:00' },
      5: { active: true, start: '09:00', end: '19:00' },
      6: { active: true, start: '10:00', end: '18:00' },
      0: { active: false, start: '10:00', end: '18:00' },
    })
  }

  const handleAddOverride = async () => {
    if (!newOverrideDate) return
    const newOvr = {
      id: `ovr-${Date.now()}`,
      date: newOverrideDate,
      reason: newOverrideReason || 'Blocked by creator',
    }
    setOverrides(prev => [...prev.filter(o => o.date !== newOverrideDate), newOvr])
    setShowAddOverride(false)
    try {
      await apiClient.createOverride({
        start_datetime: `${newOverrideDate}T00:00:00Z`,
        end_datetime: `${newOverrideDate}T23:59:59Z`,
        reason: newOverrideReason || 'Blocked by creator',
        is_full_day: true,
      })
    } catch {}
  }

  const handleRemoveOverride = async (id: string) => {
    setOverrides(prev => prev.filter(o => o.id !== id))
    try {
      await apiClient.deleteOverride(id)
    } catch {}
  }

  const creatorId = state.selectedCreatorId || 'c1'
  const icalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar/${creatorId}/calendar.ics`
    : `https://ftc.co/api/calendar/${creatorId}/calendar.ics`

  const handleCopyIcal = async () => {
    await shareOrCopy({
      title: 'FTC Calendar Subscription',
      text: 'Subscribe to my FTC shoot calendar',
      url: icalUrl,
    })
    setCopiedIcal(true)
    setTimeout(() => setCopiedIcal(false), 3000)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const scheduleItems = Object.entries(schedules).map(([dow, val]) => ({
        day_of_week: Number(dow),
        is_active: val.active,
        start_time: val.start,
        end_time: val.end,
      }))

      await apiClient.updateCalendarSettings({
        slot_step_minutes: slotStep,
        buffer_minutes: buffer,
        min_notice_hours: minNotice,
        holiday_mode: holiday,
        schedules: scheduleItems,
      })

      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 3500)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bone min-h-0 h-full relative">
      {/* Toast Feedback */}
      {savedToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-obsidian text-paper text-[12px] font-medium px-4 py-2.5 rounded-full shadow-lg border border-paper/10 flex items-center gap-2 animate-fade-in">
          <ShieldCheck size={14} className="text-acid shrink-0" />
          <span>Availability schedule saved & synced to live engine!</span>
        </div>
      )}

      <SimpleHeader
        title="Calendar & Availability"
        onBack={() => dispatch({ type: 'BACK' })}
        right={
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="tap px-3 py-1.5 rounded-xl bg-obsidian text-paper text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition hover:bg-obsidian/90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} className="text-acid" />}
            <span>Save</span>
          </button>
        }
      />

      <div className="app-scroll px-5 md:px-6 py-4 md:py-6">
        <div className="max-w-4xl mx-auto w-full space-y-4">

          {/* Holiday Mode Emergency Banner */}
          {holiday && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-950">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <div className="text-[12px] leading-snug">
                <span className="font-bold">Holiday Mode is Active:</span> Your public profile shows you are away. New client booking slots are temporarily hidden. Existing confirmed shoots remain locked in escrow.
              </div>
            </div>
          )}

          <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-4 md:space-y-0">

            {/* Left Column: Interactive Multi-Month Calendar & Slots Preview */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs">
                {/* Month Picker Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-iris font-semibold">Interactive calendar</div>
                    <div className="font-display text-xl tracking-tight mt-0.5">
                      {monthNames[currentMonth - 1]} {currentYear}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevMonth}
                      className="tap w-8 h-8 rounded-full border border-line bg-bone grid place-items-center hover:bg-obsidian/10 transition"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft size={16} className="text-obsidian/70" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="tap w-8 h-8 rounded-full border border-line bg-bone grid place-items-center hover:bg-obsidian/10 transition"
                      aria-label="Next Month"
                    >
                      <ChevronRight size={16} className="text-obsidian/70" />
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] font-mono text-obsidian/50 mb-3 pb-2.5 border-b border-line">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Open</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-acid border border-obsidian/20" /> Booked</span>
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
                    const isDayOff = !schedules[dow]?.active
                    const hasOverride = overrides.some(o => o.date === dateStr)
                    const isBooked = d === 27 || d === 29 // Sample bookings
                    const isSelected = selectedDay === d

                    let statusClass = 'bg-bone text-obsidian hover:bg-obsidian/10'
                    if (holiday) {
                      statusClass = 'bg-amber-100 text-amber-800'
                    } else if (hasOverride) {
                      statusClass = 'bg-rose-100 text-rose-800 font-semibold'
                    } else if (isBooked) {
                      statusClass = 'bg-acid text-obsidian font-bold shadow-xs'
                    } else if (isDayOff) {
                      statusClass = 'bg-obsidian/10 text-obsidian/35'
                    }

                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={cn(
                          'w-8 h-8 md:w-9 md:h-9 rounded-xl text-[12px] font-medium tnum flex items-center justify-center transition-all',
                          isSelected
                            ? 'bg-obsidian text-paper font-bold shadow-md ring-2 ring-iris/40'
                            : statusClass
                        )}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>

                {/* Day Slot Detail Drawer */}
                <div className="mt-4 pt-4 border-t border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] font-semibold">
                      <Clock size={14} className="text-iris" />
                      <span>{monthNames[currentMonth - 1]} {selectedDay} Preview</span>
                    </div>
                    {selectedOverride ? (
                      <button
                        onClick={() => handleRemoveOverride(selectedOverride.id)}
                        className="tap px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                      >
                        Unblock Date
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setNewOverrideDate(selectedDateStr)
                          setShowAddOverride(true)
                        }}
                        className="tap px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-bone text-obsidian/70 hover:bg-obsidian/10 border border-line transition"
                      >
                        Block Date
                      </button>
                    )}
                  </div>

                  {holiday ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11.5px] text-amber-900 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span>Holiday mode active — no slots available on this date.</span>
                    </div>
                  ) : selectedOverride ? (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-[11.5px] text-rose-800 flex items-center gap-2">
                      <Lock size={14} className="text-rose-600 shrink-0" />
                      <span>Blocked: {selectedOverride.reason}</span>
                    </div>
                  ) : isSelectedDayOff ? (
                    <div className="rounded-xl bg-bone border border-line p-3 text-[11.5px] text-obsidian/60 flex items-center gap-2">
                      <Lock size={14} className="text-obsidian/40 shrink-0" />
                      <span>Regular day off. Turn on in Weekly Working Hours to open slots.</span>
                    </div>
                  ) : previewSlots.length === 0 ? (
                    <div className="rounded-xl bg-bone border border-line p-3 text-[11.5px] text-obsidian/60">
                      No slots fit into configured hours with {slotStep}m cadence and {buffer}m buffer.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="text-[10.5px] font-mono text-obsidian/50">
                        {previewSlots.length} Bookable Slots ({slotStep}m cadence · {buffer}m buffer):
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
              </div>

              {/* 1-Way RFC 5545 iCalendar Sync Card */}
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-iris" />
                    <div className="text-[13px] font-semibold">1-Way Calendar Sync (iCal)</div>
                  </div>
                  <span className="text-[10px] font-mono bg-iris/10 text-iris px-2 py-0.5 rounded-full font-semibold">
                    RFC 5545 Feed
                  </span>
                </div>
                <p className="text-[11.5px] text-obsidian/65 leading-relaxed">
                  Subscribe to your live FTC shoot calendar in Google Calendar, Apple Calendar, or Outlook. All confirmed shoots and client shoot notes appear automatically.
                </p>

                <div className="p-2.5 rounded-xl bg-bone border border-line flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-obsidian/75 truncate select-all">
                    {icalUrl}
                  </span>
                  <button
                    onClick={handleCopyIcal}
                    className="tap shrink-0 px-2.5 py-1 rounded-lg bg-obsidian text-paper text-[11px] font-semibold flex items-center gap-1.5 hover:bg-obsidian/90 transition"
                  >
                    {copiedIcal ? <Check size={12} className="text-acid" /> : <Copy size={12} />}
                    <span>{copiedIcal ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowIcalGuide(!showIcalGuide)}
                  className="tap text-[11.5px] font-semibold text-iris flex items-center gap-1 hover:underline"
                >
                  <HelpCircle size={13} />
                  <span>{showIcalGuide ? 'Hide subscription instructions' : 'How to add to Google or Apple Calendar'}</span>
                </button>

                {showIcalGuide && (
                  <div className="p-3 rounded-xl bg-bone border border-line text-[11.5px] text-obsidian/80 space-y-2 animate-fade-in leading-relaxed">
                    <div>
                      <strong className="text-obsidian">Google Calendar:</strong> Go to Settings → "Add calendar" → "From URL" → Paste the link above → Click "Add calendar".
                    </div>
                    <div>
                      <strong className="text-obsidian">Apple Calendar (iOS / Mac):</strong> On Mac: File → "New Calendar Subscription". On iPhone: Settings → Calendar → Accounts → "Add Subscribed Calendar" → Paste the link above.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Cadence, Working Hours, Holiday Mode, & Overrides */}
            <div className="space-y-4">

              {/* Time Granularity & Buffer Settings */}
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
                    Time Granularity & Cadence
                  </div>
                </div>

                {/* Slot Step Cadence */}
                <div>
                  <div className="text-[12px] font-medium text-obsidian mb-1.5">
                    Slot Step Cadence
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
                        onClick={() => setSlotStep(Number(mins))}
                        className={cn(
                          'tap py-1.5 rounded-xl text-[11px] font-semibold border transition text-center',
                          slotStep === mins
                            ? 'bg-obsidian text-paper border-obsidian'
                            : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10.5px] text-obsidian/50 mt-1">
                    Controls the interval between selectable shoot start times on client booking screens.
                  </div>
                </div>

                {/* Buffer between sessions */}
                <div className="pt-2 border-t border-line">
                  <div className="text-[12px] font-medium text-obsidian mb-1.5">
                    Buffer Between Shoots
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      [0, '0m'],
                      [15, '15m'],
                      [30, '30m (Rec)'],
                      [60, '60m'],
                    ].map(([mins, label]) => (
                      <button
                        key={mins}
                        onClick={() => setBuffer(Number(mins))}
                        className={cn(
                          'tap py-1.5 rounded-xl text-[11px] font-semibold border transition text-center',
                          buffer === mins
                            ? 'bg-obsidian text-paper border-obsidian'
                            : 'bg-bone border-line text-obsidian/70 hover:bg-obsidian/10'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10.5px] text-obsidian/50 mt-1">
                    Automatic breathing room added after every confirmed booking for equipment pack-up & travel.
                  </div>
                </div>

                {/* Minimum Notice Hours */}
                <div className="pt-2 border-t border-line">
                  <div className="text-[12px] font-medium text-obsidian mb-1.5">
                    Minimum Advance Notice
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      [12, '12 Hours'],
                      [24, '24 Hours (Rec)'],
                      [48, '48 Hours'],
                    ].map(([hrs, label]) => (
                      <button
                        key={hrs}
                        onClick={() => setMinNotice(Number(hrs))}
                        className={cn(
                          'tap py-1.5 rounded-xl text-[11px] font-semibold border transition text-center',
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

              {/* Weekly Working Hours Schedule */}
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
                      Weekly Working Hours
                    </div>
                    <div className="text-[11.5px] text-obsidian/60 mt-0.5">
                      Toggle active shoot days and configure operating hours.
                    </div>
                  </div>
                  <button
                    onClick={handleApplyGlobalHours}
                    className="tap text-[11px] font-semibold text-iris hover:underline"
                  >
                    Reset standard
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {[
                    { dow: 1, label: 'Monday' },
                    { dow: 2, label: 'Tuesday' },
                    { dow: 3, label: 'Wednesday' },
                    { dow: 4, label: 'Thursday' },
                    { dow: 5, label: 'Friday' },
                    { dow: 6, label: 'Saturday' },
                    { dow: 0, label: 'Sunday' },
                  ].map(({ dow, label }) => {
                    const cfg = schedules[dow] || { active: false, start: '09:00', end: '18:00' }
                    return (
                      <div
                        key={dow}
                        className={cn(
                          'p-2 rounded-xl border flex items-center justify-between gap-2 text-[12px] transition-all',
                          cfg.active ? 'bg-bone border-line' : 'bg-bone/40 border-line/50 opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleDayActive(dow)}
                            className={cn(
                              'tap w-5 h-5 rounded-md flex items-center justify-center transition',
                              cfg.active ? 'bg-obsidian text-paper' : 'bg-obsidian/15 text-transparent'
                            )}
                          >
                            <Check size={12} />
                          </button>
                          <span className={cn('font-medium', cfg.active ? 'text-obsidian' : 'text-obsidian/50')}>
                            {label}
                          </span>
                        </div>

                        {cfg.active ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={cfg.start}
                              onChange={e =>
                                setSchedules(s => ({
                                  ...s,
                                  [dow]: { ...s[dow], start: e.target.value },
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-paper border border-line text-[11px] font-mono outline-none"
                            />
                            <span className="text-obsidian/40 text-[10px]">to</span>
                            <input
                              type="time"
                              value={cfg.end}
                              onChange={e =>
                                setSchedules(s => ({
                                  ...s,
                                  [dow]: { ...s[dow], end: e.target.value },
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-paper border border-line text-[11px] font-mono outline-none"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-obsidian/45">Day Off</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Holiday Mode & Booking Approval */}
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Zap size={14} className="text-iris" />
                      <span>Instant Booking</span>
                    </div>
                    <div className="text-[11px] text-obsidian/55 mt-0.5">
                      {instant ? 'Clients book open slots immediately' : 'Request to Book: 24h SLA to accept/decline (Default)'}
                    </div>
                  </div>
                  <button
                    onClick={() => setInstant(!instant)}
                    className={cn(
                      'tap relative w-11 h-6 rounded-full transition shrink-0',
                      instant ? 'bg-success' : 'bg-obsidian/15'
                    )}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-sm transition-all"
                      style={{ left: instant ? 22 : 2 }}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-line">
                  <div>
                    <div className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-600" />
                      <span>Holiday Mode</span>
                    </div>
                    <div className="text-[11px] text-obsidian/55 mt-0.5">
                      {holiday ? 'Profile marked "Away" — no new bookings accepted' : 'Accepting new bookings normally'}
                    </div>
                  </div>
                  <button
                    onClick={() => setHoliday(!holiday)}
                    className={cn(
                      'tap relative w-11 h-6 rounded-full transition shrink-0',
                      holiday ? 'bg-amber-600' : 'bg-obsidian/15'
                    )}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-paper shadow-sm transition-all"
                      style={{ left: holiday ? 22 : 2 }}
                    />
                  </button>
                </div>
              </div>

              {/* Date Overrides & Specific Leaves */}
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 font-semibold">
                      Blocked Dates & Leaves
                    </div>
                    <div className="text-[11.5px] text-obsidian/60 mt-0.5">
                      Block specific single days without altering regular weekly schedules.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddOverride(true)}
                    className="tap text-[11px] font-semibold text-iris flex items-center gap-1 hover:underline"
                  >
                    <Plus size={13} />
                    <span>Add Date</span>
                  </button>
                </div>

                {showAddOverride && (
                  <div className="p-3 rounded-xl bg-bone border border-line space-y-2.5 animate-fade-in">
                    <div className="text-[11.5px] font-bold text-obsidian">Block a specific date:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newOverrideDate}
                        onChange={e => setNewOverrideDate(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-paper border border-line text-[12px] font-mono outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Reason (e.g. Out of town)"
                        value={newOverrideReason}
                        onChange={e => setNewOverrideReason(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-paper border border-line text-[12px] outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setShowAddOverride(false)}
                        className="tap px-2.5 py-1 rounded-lg text-[11px] text-obsidian/60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddOverride}
                        className="tap px-3 py-1 rounded-lg bg-obsidian text-paper text-[11px] font-semibold"
                      >
                        Confirm Block
                      </button>
                    </div>
                  </div>
                )}

                {overrides.length === 0 ? (
                  <div className="text-[11px] text-obsidian/45 italic py-1">
                    No custom dates blocked. Click "Add Date" to block holidays or personal leave.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {overrides.map(o => (
                      <div
                        key={o.id}
                        className="p-2 rounded-xl bg-bone border border-line flex items-center justify-between gap-2 text-[12px]"
                      >
                        <div>
                          <div className="font-mono font-semibold text-obsidian">{o.date}</div>
                          <div className="text-[11px] text-obsidian/60">{o.reason}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveOverride(o.id)}
                          className="tap p-1.5 rounded-lg hover:bg-rose-50 text-obsidian/40 hover:text-rose-600 transition"
                          title="Remove block"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

/* ─── Payouts Screen ─── */
const PAYOUT_TXNS = [
  { id: 't1', who: 'Priya Joshi job', amount: 30000, dir: 'in' as const, when: 'Apr 22', status: 'released' },
  { id: 't2', who: 'Withdrawal to HDFC ••4821', amount: 28000, dir: 'out' as const, when: 'Apr 20', status: 'paid' },
  { id: 't3', who: 'Karan Bhalla advance', amount: 25000, dir: 'in' as const, when: 'Apr 18', status: 'escrow' },
  { id: 't4', who: 'Nisha Reddy job', amount: 10000, dir: 'in' as const, when: 'Apr 12', status: 'released' },
]

export function PayoutsScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  const [stmt, setStmt] = useState(false)

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Revenue & payouts" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        <div className="p-5 rounded-3xl bg-obsidian text-paper relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-acid">Available balance</div>
          <div className="font-display text-4xl tnum mt-1 font-light">₹43,000</div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => dispatch({ type: 'GO', screen: 'payoutSetup' })} className="tap flex-1 py-3 rounded-xl bg-acid text-obsidian text-[12.5px] font-semibold">
              Withdraw to bank
            </button>
            <button onClick={() => setStmt(true)} className="tap px-4 py-3 rounded-xl bg-paper/10 text-paper text-[12.5px] font-semibold">
              {stmt ? 'Sent ✓' : 'Statement'}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-paper border border-line overflow-hidden p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-3">Transaction history</div>
          <div className="space-y-3">
            {PAYOUT_TXNS.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 text-[13px]">
                <div>
                  <div className="font-medium">{t.who}</div>
                  <div className="text-[11px] text-obsidian/45">{t.when}</div>
                </div>
                <div className="text-right">
                  <div className={cn('font-semibold tnum', t.dir === 'in' ? 'text-success' : 'text-obsidian')}>{t.dir === 'in' ? '+' : '-'}{inr(t.amount)}</div>
                  <span className="text-[10px] font-mono text-obsidian/40 uppercase">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LinkBioScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))
  const [copied, setCopied] = useState(false)
  const u = state.user ?? {}
  const handle = (u as any).handle ? (u as any).handle.replace(/^@/, '') : 'rhea'
  const name = u.name || 'Creator'
  const bioUrl = `https://ftc.app/${handle}`

  const handleShare = async () => {
    const res = await shareOrCopy({
      title: `${name}'s Link-in-Bio on FTC`,
      text: `Book verified photography & videography services directly with ${name}`,
      url: bioUrl,
    })
    if (res === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-bone overflow-hidden min-h-0">
      <SimpleHeader title="Link-in-Bio" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll px-5 py-4 pb-10 space-y-4 max-w-xl mx-auto w-full">
        {/* Active Link Banner */}
        <div className="p-6 rounded-3xl bg-obsidian text-paper relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 dots-acid opacity-10 pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-acid/20 text-acid border border-acid/30 font-semibold">
              Live & Accepting Bookings
            </span>
            <Sparkles size={16} className="text-acid" />
          </div>

          <div className="font-display text-2xl font-light tracking-tight text-paper">
            Your Personal Booking Link
          </div>
          <p className="text-[12.5px] text-paper/70 mt-1 leading-relaxed">
            Put this in your Instagram bio or send it to clients. They can browse your packages, check availability, and pay with 100% escrow protection.
          </p>

          <div className="mt-5 p-3 rounded-2xl bg-paper/10 border border-paper/15 flex items-center justify-between gap-3">
            <span className="font-mono text-[13px] text-acid truncate font-medium">{bioUrl}</span>
            <button
              onClick={handleShare}
              className="tap px-4 py-2 rounded-xl bg-acid text-obsidian font-semibold text-[12px] flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer hover:bg-acid/90 transition"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? 'Copied ✓' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Benefits Breakdown */}
        <div className="rounded-2xl bg-paper border border-line p-5 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-obsidian/50 mb-2">Why use your FTC link</div>
          <div className="flex items-start gap-3 text-[13px]">
            <span className="text-base leading-none shrink-0">⚡</span>
            <div>
              <div className="font-semibold text-obsidian">0% Commission on Direct Clients</div>
              <div className="text-obsidian/60 text-[12px]">When clients book via your link-in-bio, you keep 100% of your listed rate.</div>
            </div>
          </div>
          <div className="flex items-start gap-3 text-[13px] pt-2 border-t border-line/60">
            <span className="text-base leading-none shrink-0">🛡️</span>
            <div>
              <div className="font-semibold text-obsidian">Guaranteed Escrow Advance</div>
              <div className="text-obsidian/60 text-[12px]">No more chasing invoices or phantom cancellations. Funds are held safely before the shoot.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PayoutSetupScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="flex-1 flex flex-col bg-bone p-5 overflow-hidden">
      <SimpleHeader title="Payout Setup" onBack={() => dispatch({ type: 'BACK' })} />
      <div className="app-scroll p-5">
        <div className="p-6 rounded-2xl bg-paper border border-line">
          <div className="font-display text-xl">Bank Account & UPI</div>
          <div className="text-sm text-obsidian/60 mt-1">HDFC Bank •••• 4821 (Verified)</div>
        </div>
      </div>
    </div>
  )
}
