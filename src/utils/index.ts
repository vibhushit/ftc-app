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
