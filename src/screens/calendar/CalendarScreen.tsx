import { useState, useEffect } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '@/store/appStore'
import { apiClient } from '@/services/apiClient'
import { SimpleHeader } from '@/components/ui/SimpleHeader'
import { CalendarMonthGrid } from './components/CalendarMonthGrid'
import { DaySlotPreview } from './components/DaySlotPreview'
import { WeeklyScheduleCard } from './components/WeeklyScheduleCard'
import { BookingRulesCard } from './components/BookingRulesCard'
import { DateOverridesCard } from './components/DateOverridesCard'
import type { OverrideStateItem, WeekScheduleMap } from './types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DEFAULT_SCHEDULES: WeekScheduleMap = {
  1: { active: true, start: '09:00', end: '19:00' },
  2: { active: true, start: '09:00', end: '19:00' },
  3: { active: true, start: '09:00', end: '19:00' },
  4: { active: true, start: '09:00', end: '19:00' },
  5: { active: true, start: '09:00', end: '19:00' },
  6: { active: true, start: '10:00', end: '18:00' },
  0: { active: false, start: '10:00', end: '18:00' },
}

export function CalendarScreen() {
  const { state, dispatch } = useAppStore(useShallow(s => ({ state: s, dispatch: s.dispatch })))

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Multi-month calendar state
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1) // 1-12
  const [selectedDay, setSelectedDay] = useState(today.getDate())

  // Scheduling settings state
  const [slotStep, setSlotStep] = useState(60) // 30, 60, 90, 120, 240 mins
  const [buffer, setBuffer] = useState(30) // 0, 15, 30, 60 mins
  const [minNotice, setMinNotice] = useState(24) // 12, 24, 48 hours
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Weekly working hours schedule (1 = Mon, 2 = Tue, ... 6 = Sat, 0 = Sun)
  const [schedules, setSchedules] = useState<WeekScheduleMap>(DEFAULT_SCHEDULES)

  // Date overrides state
  const [overrides, setOverrides] = useState<Array<OverrideStateItem>>([])
  const [showAddOverride, setShowAddOverride] = useState(false)
  const [newOverrideType, setNewOverrideType] = useState<'blocked' | 'custom_hours'>('blocked')
  const [newOverrideDate, setNewOverrideDate] = useState(todayStr)
  const [newOverrideReason, setNewOverrideReason] = useState('')
  const [newOverrideStartTime, setNewOverrideStartTime] = useState('18:00')
  const [newOverrideEndTime, setNewOverrideEndTime] = useState('22:00')
  const storedCid = typeof window !== 'undefined' ? (localStorage.getItem('ftc_creator_id') || '') : ''
  const initialCid = (state.isCreator && (state.supabaseUserId || storedCid))
    ? (state.supabaseUserId || storedCid)
    : (state.selectedCreatorId || storedCid || state.supabaseUserId || '')
  const [creatorId, setCreatorId] = useState<string>(initialCid)

  // Live database load on mount
  useEffect(() => {
    let mounted = true
    apiClient.getCalendarSettings(creatorId || undefined)
      .then(data => {
        if (!mounted) return
        if (data.creator_id) {
          setCreatorId(data.creator_id)
          if (typeof window !== 'undefined') {
            localStorage.setItem('ftc_creator_id', data.creator_id)
          }
        }
        if (data.slot_step_minutes) setSlotStep(data.slot_step_minutes)
        if (data.buffer_minutes !== undefined) setBuffer(data.buffer_minutes)
        if (data.min_notice_hours) setMinNotice(data.min_notice_hours)
        if (data.schedules && data.schedules.length > 0) {
          const nextSched: WeekScheduleMap = {}
          for (const s of data.schedules) {
            nextSched[s.day_of_week] = {
              active: s.is_active,
              start: s.start_time.slice(0, 5),
              end: s.end_time.slice(0, 5),
            }
          }
          setSchedules(prev => ({ ...prev, ...nextSched }))
        }
        if (data.overrides) {
          const parsed: OverrideStateItem[] = data.overrides.map((o: any) => ({
            id: o.id,
            date: o.date || (o.start_datetime ? o.start_datetime.slice(0, 10) : todayStr),
            reason: o.reason || (o.override_type === 'custom_hours' ? 'Custom Working Hours' : 'Blocked by creator'),
            override_type: (o.override_type === 'custom_hours' ? 'custom_hours' : 'blocked'),
            custom_start_time: o.custom_start_time ? o.custom_start_time.slice(0, 5) : null,
            custom_end_time: o.custom_end_time ? o.custom_end_time.slice(0, 5) : null,
          }))
          setOverrides(parsed)
        }
        setLoadingSettings(false)
      })
      .catch(err => {
        console.warn('Failed to load live calendar settings:', err)
        if (mounted) setLoadingSettings(false)
      })
    return () => { mounted = false }
  }, [])

  const [saving, setSaving] = useState(false)
  const [savedToast, setSavedToast] = useState(false)

  const isCurrentOrPastMonth =
    currentYear < today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth <= today.getMonth() + 1)

  const prevMonth = () => {
    if (isCurrentOrPastMonth) return
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

  const selectedDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
  const selectedDow = new Date(currentYear, currentMonth - 1, selectedDay).getDay()
  const selectedOverride = overrides.find(o => o.date === selectedDateStr)
  const isCustomHoursSelected = selectedOverride?.override_type === 'custom_hours'
  const isSelectedDayOff = !isCustomHoursSelected && !schedules[selectedDow]?.active
  const isSelectedBlocked = isSelectedDayOff || (selectedOverride?.override_type === 'blocked')

  // Calculate slots preview for selected day
  const previewSlots: string[] = []
  if (!isSelectedBlocked && (schedules[selectedDow]?.active || isCustomHoursSelected)) {
    let startStr = schedules[selectedDow]?.start || '09:00'
    let endStr = schedules[selectedDow]?.end || '19:00'
    if (isCustomHoursSelected && selectedOverride?.custom_start_time && selectedOverride?.custom_end_time) {
      startStr = selectedOverride.custom_start_time
      endStr = selectedOverride.custom_end_time
    }

    const [sh, sm] = startStr.split(':').map(Number)
    const [eh, em] = endStr.split(':').map(Number)
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

  const handleScheduleTimeChange = (dow: number, field: 'start' | 'end', val: string) => {
    setSchedules(prev => ({
      ...prev,
      [dow]: { ...prev[dow], [field]: val },
    }))
  }

  const handleApplyGlobalHours = () => {
    setSchedules({ ...DEFAULT_SCHEDULES })
  }

  const handleAddOverride = async () => {
    if (!newOverrideDate) return
    const isCustom = newOverrideType === 'custom_hours'
    const defaultReason = isCustom
      ? `Custom Working Hours (${newOverrideStartTime} - ${newOverrideEndTime})`
      : 'Blocked by creator'

    const localId = `ovr-${Date.now()}`
    const newOvr: OverrideStateItem = {
      id: localId,
      date: newOverrideDate,
      reason: newOverrideReason.trim() || defaultReason,
      override_type: newOverrideType,
      custom_start_time: isCustom ? newOverrideStartTime : null,
      custom_end_time: isCustom ? newOverrideEndTime : null,
    }

    setOverrides(prev => [...prev.filter(o => o.date !== newOverrideDate), newOvr])
    setShowAddOverride(false)
    setNewOverrideReason('')

    try {
      const res = await apiClient.createOverride({
        start_datetime: isCustom ? `${newOverrideDate}T${newOverrideStartTime}:00Z` : `${newOverrideDate}T00:00:00Z`,
        end_datetime: isCustom ? `${newOverrideDate}T${newOverrideEndTime}:00Z` : `${newOverrideDate}T23:59:59Z`,
        reason: newOverrideReason.trim() || defaultReason,
        is_full_day: !isCustom,
        override_type: newOverrideType,
        custom_start_time: isCustom ? `${newOverrideStartTime}:00` : null,
        custom_end_time: isCustom ? `${newOverrideEndTime}:00` : null,
      }, creatorId || undefined)
      if (res?.id) {
        setOverrides(prev => prev.map(o => o.id === localId ? { ...o, id: res.id } : o))
      }
    } catch (e) {
      console.error('Failed to persist override to PostgreSQL:', e)
    }
  }

  const handleRemoveOverride = async (id: string) => {
    setOverrides(prev => prev.filter(o => o.id !== id))
    try {
      await apiClient.deleteOverride(id, creatorId || undefined)
    } catch (e) {
      console.error('Failed to delete override from PostgreSQL:', e)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const scheduleItems = Object.entries(schedules).map(([dow, cfg]) => ({
        day_of_week: Number(dow),
        is_active: cfg.active,
        start_time: `${cfg.start}:00`,
        end_time: `${cfg.end}:00`,
      }))

      await apiClient.updateCalendarSettings({
        slot_step_minutes: slotStep,
        buffer_minutes: buffer,
        min_notice_hours: minNotice,
        holiday_mode: false,
        schedules: scheduleItems,
      }, creatorId || undefined)

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
            className="tap px-3.5 py-1.5 rounded-xl bg-obsidian text-paper text-[12px] font-semibold flex items-center gap-1.5 shadow-xs transition hover:bg-obsidian/90 disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            <span>Save</span>
          </button>
        }
      />

      <div className="app-scroll px-5 md:px-6 py-4 md:py-6">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start space-y-4 md:space-y-0">
            {/* Left Column: Calendar & Slots Preview */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-paper border border-line p-4 md:p-5 shadow-xs">
                <CalendarMonthGrid
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onPrevMonth={prevMonth}
                  onNextMonth={nextMonth}
                  isCurrentOrPastMonth={isCurrentOrPastMonth}
                  monthNames={MONTH_NAMES}
                  todayStr={todayStr}
                  overrides={overrides}
                  schedules={schedules}
                />
                <DaySlotPreview
                  monthName={MONTH_NAMES[currentMonth - 1]}
                  selectedDay={selectedDay}
                  selectedOverride={selectedOverride}
                  isSelectedDayOff={isSelectedDayOff}
                  previewSlots={previewSlots}
                  slotStep={slotStep}
                  buffer={buffer}
                  onRemoveOverride={handleRemoveOverride}
                />
              </div>
            </div>

            {/* Right Column: Weekly Schedule, Booking Rules, & Overrides */}
            <div className="space-y-4">
              <WeeklyScheduleCard
                schedules={schedules}
                onToggleDayActive={handleToggleDayActive}
                onScheduleTimeChange={handleScheduleTimeChange}
                onResetGlobalHours={handleApplyGlobalHours}
              />

              <BookingRulesCard
                slotStep={slotStep}
                onSlotStepChange={setSlotStep}
                buffer={buffer}
                onBufferChange={setBuffer}
                minNotice={minNotice}
                onMinNoticeChange={setMinNotice}
                loadingSettings={loadingSettings}
              />

              <DateOverridesCard
                overrides={overrides}
                showAddOverride={showAddOverride}
                newOverrideType={newOverrideType}
                newOverrideDate={newOverrideDate}
                newOverrideReason={newOverrideReason}
                newOverrideStartTime={newOverrideStartTime}
                newOverrideEndTime={newOverrideEndTime}
                todayStr={todayStr}
                onOpenAddOverride={type => {
                  setNewOverrideType(type)
                  setShowAddOverride(true)
                }}
                onCloseAddOverride={() => setShowAddOverride(false)}
                onDateChange={setNewOverrideDate}
                onReasonChange={setNewOverrideReason}
                onStartTimeChange={setNewOverrideStartTime}
                onEndTimeChange={setNewOverrideEndTime}
                onAddOverride={handleAddOverride}
                onRemoveOverride={handleRemoveOverride}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
