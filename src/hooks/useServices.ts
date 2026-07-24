import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ServiceRow } from '@/lib/database.types'

const KEYS = {
  byCreator: (id: string) => ['services', 'creator', id] as const,
  mine:      ['services', 'mine'] as const,
}

// ─── Services for a creator (public) ─────────────────────────────────────────
export function useCreatorServices(creatorId: string | null) {
  return useQuery({
    queryKey:  creatorId ? KEYS.byCreator(creatorId) : [],
    queryFn:   async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', creatorId!)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data as ServiceRow[]
    },
    enabled:   !!creatorId,
    staleTime: 120_000,
  })
}

// ─── My services (creator managing their own) ─────────────────────────────────
export function useMyServices() {
  return useQuery({
    queryKey: KEYS.mine,
    queryFn:  async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('creator_id', user.id)
        .order('sort_order')
      if (error) throw error
      return data as ServiceRow[]
    },
    staleTime: 60_000,
  })
}

// ─── Create service ───────────────────────────────────────────────────────────
export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<ServiceRow, 'id' | 'creator_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('services')
        .insert({ ...input, creator_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as ServiceRow
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.mine })
      qc.invalidateQueries({ queryKey: KEYS.byCreator(data.creator_id) })
    },
  })
}

// ─── Update service ───────────────────────────────────────────────────────────
export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ServiceRow> }) => {
      const { data, error } = await supabase
        .from('services')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as ServiceRow
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.mine })
      qc.invalidateQueries({ queryKey: KEYS.byCreator(data.creator_id) })
    },
  })
}

// ─── Delete / deactivate service ─────────────────────────────────────────────
export function useDeactivateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.mine })
    },
  })
}

// ─── Reorder services ─────────────────────────────────────────────────────────
export function useReorderServices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ordered: { id: string; sort_order: number }[]) => {
      const updates = ordered.map(({ id, sort_order }) =>
        supabase.from('services').update({ sort_order }).eq('id', id)
      )
      await Promise.all(updates)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.mine })
    },
  })
}
