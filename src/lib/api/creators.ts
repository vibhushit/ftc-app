import { supabase } from '../supabase'
import type { CreatorProfileRow, CreatorWithUser, OnboardStep } from '../database.types'

export interface CreatorSearchParams {
  query?:      string
  discipline?: string
  city?:       string
  minPrice?:   number
  maxPrice?:   number
  minRating?:  number
  available?:  boolean
  limit?:      number
  offset?:     number
}

import { apiClient } from '@/services/apiClient'

// ─── Discovery ────────────────────────────────────────────────────────────────
export async function searchCreators(params: CreatorSearchParams = {}) {
  try {
    const list = await apiClient.getCreators()
    if (params.discipline && params.discipline !== 'All') {
      return list.filter(c => c.discipline === params.discipline)
    }
    return list
  } catch (err) {
    console.warn('Failed to fetch creators from API client:', err)
    return []
  }
}

function apiCreatorToWithUser(fromApi: any): CreatorWithUser {
  return {
    id: fromApi.id,
    handle: (fromApi.handle || '').trim().replace(/^@+/, ''),
    discipline: fromApi.discipline,
    sub_skills: fromApi.sub_skills || [],
    city: fromApi.city,
    area: fromApi.locality || '',
    starting_at: fromApi.starting_at,
    avg_rating: fromApi.rating,
    review_count: fromApi.review_count,
    completed_jobs: fromApi.completed_jobs ?? 0,
    bio: fromApi.bio || '',
    portfolio_urls: fromApi.portfolio_urls || [],
    tier: 'Rising',
    verification: fromApi.verified ? 'vetted' : 'phone',
    is_pro: fromApi.verified,
    response_time: '< 2 hrs',
    next_slot: 'Today',
    languages: ['Hindi', 'English'],
    tagline: '',
    repeat_rate: 90,
    travel_radius: 'city',
    gender: 'prefer_not_to_say',
    trust_score: 85,
    available_today: true,
    travel_mode: 'both',
    ig_handle: fromApi.ig_handle || null,
    yt_handle: fromApi.yt_handle || null,
    website_url: fromApi.website_url || null,
    users: {
      name: fromApi.name,
      avatar_url: fromApi.avatar,
      email: '',
      phone: '',
    },
  } as unknown as CreatorWithUser
}

// ─── Profile by ID ────────────────────────────────────────────────────────────
export async function getCreatorById(id: string): Promise<CreatorWithUser | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  if (!isUuid) {
    return getCreatorByHandle(id)
  }

  try {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*, users!inner(name, avatar_url, email, phone)')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.warn('[FTC] Supabase getCreatorById error:', error)
    }
    if (data) return data as unknown as CreatorWithUser
  } catch (err) {
    console.warn('[FTC] getCreatorById fetch failed:', err)
  }

  // Fallback to apiClient
  try {
    const fromApi = await apiClient.getCreatorById(id)
    if (fromApi) {
      return apiCreatorToWithUser(fromApi)
    }
  } catch {}

  return null
}

// ─── Profile by handle ────────────────────────────────────────────────────────
export async function getCreatorByHandle(handle: string): Promise<CreatorWithUser | null> {
  const clean = handle.trim().replace(/^@+/, '').toLowerCase()
  if (!clean) return null

  // 1. Primary: Query Rust Axum backend single source of truth
  try {
    const fromApi = await apiClient.getCreatorByHandle(clean)
    if (fromApi) {
      return apiCreatorToWithUser(fromApi)
    }
  } catch (e) {
    console.warn('[FTC] apiClient getCreatorByHandle failed:', e)
  }

  // 2. Fallback to Supabase
  try {
    const { data } = await (supabase.from('creator_profiles') as any)
      .select('*, users!inner(name, avatar_url, email, phone)')
      .or(`handle.ilike.${clean},handle.ilike.@${clean}`)
      .maybeSingle()

    if (data) return data as unknown as CreatorWithUser
  } catch {}

  return null
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export async function upsertCreatorProfile(patch: Partial<CreatorProfileRow> & { id: string }) {
  const sanitizedPatch = { ...patch }
  if (sanitizedPatch.handle) {
    sanitizedPatch.handle = sanitizedPatch.handle.replace(/^@+/, '').trim()
  }
  const { data, error } = await (supabase.from('creator_profiles') as any)
    .upsert(sanitizedPatch, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function setOnboardStep(id: string, step: OnboardStep) {
  const { error } = await (supabase.from('creator_profiles') as any)
    .update({ onboard_step: step })
    .eq('id', id)
  if (error) throw error
}

export async function publishCreatorProfile(id: string) {
  const { data, error } = await (supabase.from('creator_profiles') as any)
    .update({ is_published: true, onboard_step: 'live' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Promote user role
  await (supabase.from('users') as any).update({ role: 'creator' }).eq('id', id)
  return data
}

// ─── Availability calendar ────────────────────────────────────────────────────
export async function getAvailability(creatorId: string, fromDate: string, toDate: string) {
  const { data, error } = await (supabase.from('availability_slots') as any)
    .select('slot_date, slot_hour, status')
    .eq('creator_id', creatorId)
    .gte('slot_date', fromDate)
    .lte('slot_date', toDate)

  if (error) throw error
  return data
}

export async function blockDay(creatorId: string, date: string) {
  const { error } = await (supabase.from('availability_slots') as any)
    .upsert({ creator_id: creatorId, slot_date: date, slot_hour: null, status: 'blocked' }, { onConflict: 'creator_id,slot_date,slot_hour' })
  if (error) throw error
}

export async function unblockDay(creatorId: string, date: string) {
  const { error } = await (supabase.from('availability_slots') as any)
    .delete()
    .eq('creator_id', creatorId)
    .eq('slot_date', date)
  if (error) throw error
}

// ─── Portfolio media ──────────────────────────────────────────────────────────
export async function addPortfolioUrl(creatorId: string, url: string) {
  const { data: profile } = await (supabase.from('creator_profiles') as any)
    .select('portfolio_urls')
    .eq('id', creatorId)
    .single()

  const current = profile?.portfolio_urls ?? []
  await (supabase.from('creator_profiles') as any)
    .update({ portfolio_urls: [...current, url] })
    .eq('id', creatorId)
}

// ─── Services / packages ──────────────────────────────────────────────────────
export async function getCreatorServices(creatorId: string) {
  try {
    const services = await apiClient.getCreatorServices(creatorId)
    if (services && services.length > 0) return services
  } catch {}

  const { data, error } = await (supabase.from('services') as any)
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_active', true)
    .order('sort_order')
  if (error) return []
  return data ?? []
}

export async function removePortfolioUrl(creatorId: string, url: string) {
  const { data: profile } = await (supabase.from('creator_profiles') as any)
    .select('portfolio_urls')
    .eq('id', creatorId)
    .single()

  const updated = (profile?.portfolio_urls ?? []).filter((u: string) => u !== url)
  await (supabase.from('creator_profiles') as any).update({ portfolio_urls: updated }).eq('id', creatorId)
}
