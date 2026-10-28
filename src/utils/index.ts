export const cn = (...args: (string | boolean | null | undefined)[]): string =>
  args.flat().filter((x): x is string => typeof x === 'string').join(' ')

export const haversineKm = (a: [number, number], b: [number, number]): number => {
  const R = 6371
  const toR = (d: number) => (d * Math.PI) / 180
  const dLat = toR(b[0] - a[0])
  const dLng = toR(b[1] - a[1])
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}

export const fakeDistance = (city: string, area: string): number => {
  const key = (city + area).length + area.charCodeAt(0)
  return +(1.2 + ((key % 37) * 0.4)).toFixed(1)
}

export const zoneOfArea = (area: string): string => {
  const zones: Record<string, string> = {
    'Hauz Khas': 'South Delhi', 'Green Park': 'South Delhi', Saket: 'South Delhi',
    'Defence Colony': 'South Delhi', 'GK II': 'South Delhi', 'Lajpat Nagar': 'South Delhi',
    'Punjabi Bagh': 'West Delhi', 'Rajouri Garden': 'West Delhi', Janakpuri: 'West Delhi',
    'Connaught Place': 'Central Delhi', 'Karol Bagh': 'Central Delhi',
    'Laxmi Nagar': 'East Delhi', 'Preet Vihar': 'East Delhi',
    'Civil Lines': 'North Delhi', 'Model Town': 'North Delhi',
  }
  return zones[area] ?? ''
}

export const formatTime = (date: Date): string =>
  date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: false })

export function formatTime12h(hours: number, minutes: number): string {
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  const mStr = String(minutes).padStart(2, '0')
  return `${h12}:${mStr} ${ampm}`
}

export function formatSlotRange12h(startTime: string, durationMinutes: number): string {
  if (!startTime) return ''
  const [hStr, mStr] = startTime.split(':')
  const sh = parseInt(hStr || '0', 10)
  const sm = parseInt(mStr || '0', 10)
  const startMins = sh * 60 + sm
  const endMins = startMins + durationMinutes

  const eh = Math.floor(endMins / 60) % 24
  const em = endMins % 60

  return `${formatTime12h(sh, sm)} – ${formatTime12h(eh, em)}`
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatIsoSlot12h(
  startIso?: string | null,
  endIso?: string | null,
  options?: { includeYear?: boolean; includeDuration?: boolean }
): string | null {
  if (!startIso) return null
  const s = new Date(startIso)
  if (isNaN(s.getTime())) return null

  const day = s.getUTCDate()
  const month = MONTH_NAMES_SHORT[s.getUTCMonth()]
  const year = s.getUTCFullYear()
  const yearPart = options?.includeYear !== false ? ` ${year}` : ''

  const formatH12 = (d: Date) => {
    const h = d.getUTCHours()
    const m = d.getUTCMinutes()
    return formatTime12h(h, m)
  }

  const startPart = formatH12(s)
  if (endIso) {
    const e = new Date(endIso)
    if (!isNaN(e.getTime())) {
      const endPart = formatH12(e)
      let durLabel = ''
      if (options?.includeDuration) {
        const durHours = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60))
        if (durHours > 0) {
          durLabel = ` (${durHours} ${durHours === 1 ? 'hour' : 'hours'})`
        }
      }
      return `${day} ${month}${yearPart} · ${startPart} – ${endPart}${durLabel}`
    }
  }
  return `${day} ${month}${yearPart} · ${startPart}`
}

export function formatFallbackSession12h(dateStr?: string | null, timeStr?: string | null): string | null {
  if (!dateStr) return null
  if (!timeStr) return dateStr
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr || '0', 10)
  const m = parseInt(mStr || '0', 10)
  if (!isNaN(h)) {
    return `${dateStr} · ${formatTime12h(h, m)}`
  }
  return `${dateStr} · ${timeStr}`
}

/**
 * shareOrCopy — Invokes native Web Share API on mobile (WhatsApp, iMessage, Instagram)
 * with graceful fallback to clipboard copy on desktop.
 */
export async function shareOrCopy(data: { title: string; text?: string; url: string }): Promise<'shared' | 'copied'> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (err: any) {
      if (err.name === 'AbortError') return 'shared'
    }
  }

  // Desktop / Clipboard fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(data.url)
      return 'copied'
    } catch {}
  }
  return 'copied'
}
