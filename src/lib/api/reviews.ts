import { supabase } from '../supabase'
import type { ReviewRow } from '../database.types'

export interface CreateReviewInput {
  booking_id:     string
  reviewee_id:    string
  rating:         number
  quality?:       number
  communication?: number
  timeliness?:    number
  value?:         number
  text?:          string
  is_public?:     boolean
  photo_urls?:    string[]
}

// ─── Submit review ────────────────────────────────────────────────────────────
export async function submitReview(input: CreateReviewInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase.from('reviews') as any)
    .insert({ reviewer_id: user.id, ...input })
    .select()
    .single()

  if (error) throw error

  // Trigger trust score recalculation (best-effort)
  supabase.functions.invoke('trust-score', { body: { user_id: input.reviewee_id } }).catch(console.warn)

  return data as ReviewRow
}

// ─── Reviews for a creator ────────────────────────────────────────────────────
export async function getCreatorReviews(creatorId: string, limit = 20, offset = 0) {
  const { data, error } = await (supabase.from('reviews') as any)
    .select('*, reviewer:reviewer_id(name, avatar_url)')
    .eq('reviewee_id', creatorId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

// ─── Reviews I've given ───────────────────────────────────────────────────────
export async function getMyGivenReviews() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (supabase.from('reviews') as any)
    .select('*, reviewee:reviewee_id(name, avatar_url)')
    .eq('reviewer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ─── Rating breakdown for a creator ──────────────────────────────────────────
export async function getRatingBreakdown(creatorId: string) {
  const { data, error } = await (supabase.from('reviews') as any)
    .select('rating')
    .eq('reviewee_id', creatorId)
    .eq('is_public', true)

  if (error) throw error

  const list = (data ?? []) as { rating: number }[]
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: list.filter(r => r.rating === star).length,
    pct:   list.length ? Math.round(list.filter(r => r.rating === star).length / list.length * 100) : 0,
  }))
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0
  return { counts, avg: parseFloat(avg.toFixed(2)), total: list.length }
}
