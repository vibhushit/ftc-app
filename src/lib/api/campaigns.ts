import { supabase } from '../supabase'
import type { CampaignRow, DealRow } from '../database.types'

// ─── Fetch campaigns (feed) ───────────────────────────────────────────────────
export async function getCampaigns(kind?: 'brand' | 'creator', discipline?: string, limit = 20, offset = 0) {
  let q = supabase
    .from('campaigns')
    .select('*, poster:poster_id(id, name, avatar_url)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (kind)       q = q.eq('kind', kind)
  if (discipline) q = q.eq('discipline', discipline)

  const { data, error } = await q
  if (error) throw error
  return data
}

// ─── Get single campaign ──────────────────────────────────────────────────────
export async function getCampaignById(id: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, poster:poster_id(id, name, avatar_url)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as CampaignRow & { poster: { id: string; name: string; avatar_url: string } }
}

// ─── Post a campaign ──────────────────────────────────────────────────────────
export async function createCampaign(input: Omit<CampaignRow, 'id' | 'poster_id' | 'applicants_count' | 'saves_count' | 'created_at' | 'updated_at'>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ ...input, poster_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Apply to campaign (create deal) ─────────────────────────────────────────
export async function applyToCampaign(input: {
  campaign_id: string
  brand_id:    string
  quote:       number
  pitch?:      string
  deliverables?: DealRow['deliverables']
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('deals')
    .insert({
      campaign_id:  input.campaign_id,
      brand_id:     input.brand_id,
      creator_id:   user.id,
      quote:        input.quote,
      pitch:        input.pitch ?? '',
      deliverables: input.deliverables ?? [],
    })
    .select()
    .single()

  if (error) throw error
  return data as DealRow
}

// ─── My deals ─────────────────────────────────────────────────────────────────
export async function getMyDeals(role: 'creator' | 'brand') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const col = role === 'creator' ? 'creator_id' : 'brand_id'
  const { data, error } = await supabase
    .from('deals')
    .select('*, campaign:campaign_id(title, discipline, hero_url)')
    .eq(col, user.id)
    .order('applied_at', { ascending: false })

  if (error) throw error
  return data as (DealRow & { campaign: { title: string; discipline: string; hero_url: string } })[]
}

// ─── Update deal (stage, contract, deliverables) ─────────────────────────────
export async function updateDeal(id: string, patch: Partial<DealRow>) {
  const { data, error } = await supabase
    .from('deals')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DealRow
}
