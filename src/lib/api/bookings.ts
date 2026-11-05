import { supabase } from '../supabase'
import type { BookingRow, BookingWithParties } from '../database.types'

export interface CreateBookingInput {
  creator_id:       string
  service_id?:      string
  session_date?:    string
  session_time?:    string
  location_type:    'studio' | 'local' | 'outstation'
  location_address?: string
  occasion?:        string
  notes?:           string
  base_price:       number
  travel_fee?:      number
  accommodation_fee?: number
  platform_fee:     number
  total_price:      number
  advance_amount:   number
  balance_amount:   number
  advance_pct?:     number
}

// ─── Create booking ───────────────────────────────────────────────────────────
export async function createBooking(input: CreateBookingInput): Promise<BookingWithParties> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase.from('bookings') as any)
    .insert({
      consumer_id: user.id,
      ...input,
      travel_fee:        input.travel_fee        ?? 0,
      accommodation_fee: input.accommodation_fee ?? 0,
      advance_pct:       input.advance_pct       ?? 30,
    })
    .select('*, creator:creator_id(id, name, avatar_url), consumer:consumer_id(id, name, avatar_url)')
    .single()

  if (error) throw error
  return data as BookingWithParties
}

// ─── My bookings (consumer) ───────────────────────────────────────────────────
export async function getMyBookings(status?: BookingRow['status'][]): Promise<BookingWithParties[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let q = (supabase.from('bookings') as any)
    .select('*, creator:creator_id(id, name, avatar_url), service:service_id(name, price, duration), reviews(id, rating, comment)')
    .eq('consumer_id', user.id)
    .order('created_at', { ascending: false })

  if (status?.length) q = q.in('status', status)

  const { data, error } = await q
  if (error) throw error
  return (data || []).map((b: any) => {
    const rev = Array.isArray(b.reviews) ? b.reviews[0] : b.reviews
    return {
      ...b,
      review_rating: rev?.rating ?? b.review_rating ?? null,
      review_comment: rev?.comment ?? b.review_comment ?? null,
    }
  }) as BookingWithParties[]
}

// ─── My jobs (creator) ────────────────────────────────────────────────────────
export async function getMyJobs(status?: BookingRow['status'][]): Promise<BookingWithParties[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let q = (supabase.from('bookings') as any)
    .select('*, consumer:consumer_id(id, name, avatar_url), service:service_id(name, price, duration), reviews(id, rating, comment)')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false })

  if (status?.length) q = q.in('status', status)

  const { data, error } = await q
  if (error) throw error
  return (data || []).map((b: any) => {
    const rev = Array.isArray(b.reviews) ? b.reviews[0] : b.reviews
    return {
      ...b,
      review_rating: rev?.rating ?? b.review_rating ?? null,
      review_comment: rev?.comment ?? b.review_comment ?? null,
    }
  }) as BookingWithParties[]
}

// ─── Get booking by ID ────────────────────────────────────────────────────────
export async function getBookingById(id: string): Promise<BookingWithParties | null> {
  const { data, error } = await (supabase.from('bookings') as any)
    .select('*, creator:creator_id(id, name, avatar_url), consumer:consumer_id(id, name, avatar_url), service:service_id(name, price, duration), reviews(id, rating, comment)')
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) return null
  const rev = Array.isArray(data.reviews) ? data.reviews[0] : data.reviews
  return {
    ...data,
    review_rating: rev?.rating ?? data.review_rating ?? null,
    review_comment: rev?.comment ?? data.review_comment ?? null,
  } as BookingWithParties
}

// ─── Status transitions ───────────────────────────────────────────────────────
export async function updateBookingStatus(id: string, status: BookingRow['status'], extra?: Partial<BookingRow>) {
  const patch: Partial<BookingRow> = { status, ...extra }
  if (status === 'confirmed')  patch.confirmed_at  = new Date().toISOString()
  if (status === 'completed')  patch.completed_at  = new Date().toISOString()
  if (status === 'cancelled')  patch.cancelled_at  = new Date().toISOString()

  const { data, error } = await (supabase.from('bookings') as any)
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Subscribe to booking changes (realtime) ─────────────────────────────────
export function subscribeToBooking(bookingId: string, onUpdate: (row: BookingRow) => void) {
  const channel = supabase
    .channel(`booking-${bookingId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'bookings',
      filter: `id=eq.${bookingId}`,
    }, payload => onUpdate(payload.new as BookingRow))
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    }
  }
}
