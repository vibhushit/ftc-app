import { supabase } from '../supabase'

// ─── Toggle save (favorite) ───────────────────────────────────────────────────
export async function toggleFavorite(creatorId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('consumer_id', user.id)
    .eq('creator_id', creatorId)
    .single()

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('favorites').insert({ consumer_id: user.id, creator_id: creatorId })
    return true
  }
}

// ─── My saved creators ────────────────────────────────────────────────────────
export async function getMyFavorites() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('creator_id, created_at, creator:creator_id(id, handle, users!inner(name, avatar_url))')
    .eq('consumer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ─── Is a creator saved? ──────────────────────────────────────────────────────
export async function isFavorited(creatorId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('consumer_id', user.id)
    .eq('creator_id', creatorId)
    .single()

  return !!data
}
