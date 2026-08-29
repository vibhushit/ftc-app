import { supabase } from '../supabase'
import type { NotificationRow } from '../database.types'

// ─── Fetch notifications ──────────────────────────────────────────────────────
export async function getNotifications(limit = 30, onlyUnread = false): Promise<NotificationRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  let q = (supabase.from('notifications') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (onlyUnread) q = q.eq('is_read', false)

  const { data, error } = await q
  if (error) throw error
  return data as NotificationRow[]
}

// ─── Unread count ─────────────────────────────────────────────────────────────
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await (supabase.from('notifications') as any)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

// ─── Mark read ────────────────────────────────────────────────────────────────
export async function markRead(ids: string[]) {
  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .in('id', ids)
  if (error) throw error
}

export async function markAllRead() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await (supabase.from('notifications') as any)
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) throw error
}

// ─── Subscribe to realtime notifications ─────────────────────────────────────
export function subscribeToNotifications(userId: string, onNew: (n: NotificationRow) => void) {
  return supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'notifications',
      filter: `user_id=eq.${userId}`,
    }, payload => onNew(payload.new as NotificationRow))
    .subscribe()
}
