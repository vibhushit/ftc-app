export interface OverrideStateItem {
  id: string
  date: string
  reason: string
  override_type: 'blocked' | 'custom_hours'
  custom_start_time?: string | null
  custom_end_time?: string | null
}

export interface DaySchedule {
  active: boolean
  start: string
  end: string
}

export type WeekScheduleMap = Record<number, DaySchedule>
