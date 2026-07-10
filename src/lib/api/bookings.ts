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
export async function createBooking(input: CreateBookingInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bookings')
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
export async function getMyBookings(status?: BookingRow['status'][]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let q = supabase
    .from('bookings')
    .select('*, creator:creator_id(id, name, avatar_url), service:service_id(name, price, duration)')
    .eq('consumer_id', user.id)
    .order('created_at', { ascending: false })

  if (status?.length) q = q.in('status', status)

  const { data, error } = await q
  if (error) throw error
  return data as BookingWithParties[]
}

// ─── My jobs (creator) ────────────────────────────────────────────────────────
export async function getMyJobs(status?: BookingRow['status'][]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let q = supabase
    .from('bookings')
    .select('*, consumer:consumer_id(id, name, avatar_url), service:service_id(name, price, duration)')
    .eq('creator_id', user.id)
    .order('session_date', { ascending: true, nullsFirst: false })

  if (status?.length) q = q.in('status', status)

  const { data, error } = await q
  if (error) throw error
  return data as BookingWithParties[]
}

// ─── Get booking by ID ────────────────────────────────────────────────────────
export async function getBookingById(id: string): Promise<BookingWithParties | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, creator:creator_id(id, name, avatar_url), consumer:consumer_id(id, name, avatar_url), service:service_id(name, price, duration)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as BookingWithParties
}

// ─── Status transitions ───────────────────────────────────────────────────────
export async function updateBookingStatus(id: string, status: BookingRow['status'], extra?: Partial<BookingRow>) {
  const patch: Partial<BookingRow> = { status, ...extra }
  if (status === 'confirmed')  patch.confirmed_at  = new Date().toISOString()
  if (status === 'completed')  patch.completed_at  = new Date().toISOString()
  if (status === 'cancelled')  patch.cancelled_at  = new Date().toISOString()

  const { data, error } = await supabase
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Subscribe to booking changes (realtime) ─────────────────────────────────
export function subscribeToBooking(bookingId: string, onUpdate: (row: BookingRow) => void) {
  return supabase
    .channel(`booking-${bookingId}`)
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'bookings',
      filter: `id=eq.${bookingId}`,
    }, payload => onUpdate(payload.new as BookingRow))
    .subscribe()
}
