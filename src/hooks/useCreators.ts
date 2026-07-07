import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as creatorsApi from '@/lib/api/creators'
import * as favoritesApi from '@/lib/api/favorites'
import type { CreatorProfileRow } from '@/lib/database.types'

const CREATOR_KEYS = {
  search:  (params: creatorsApi.CreatorSearchParams) => ['creators', 'search', params] as const,
  detail:  (id: string) => ['creators', id] as const,
  handle:  (h: string) => ['creators', 'handle', h] as const,
  avail:   (id: string, from: string, to: string) => ['creators', 'avail', id, from, to] as const,
  saved:   ['creators', 'saved'] as const,
}

// ─── Search / discover ────────────────────────────────────────────────────────
export function useCreatorSearch(params: creatorsApi.CreatorSearchParams = {}, enabled = true) {
  return useQuery({
    queryKey:  CREATOR_KEYS.search(params),
    queryFn:   () => creatorsApi.searchCreators(params),
    staleTime: 120_000,
    enabled,
  })
}

export function useCreatorServices(creatorId: string | null) {
  return useQuery({
    queryKey:  ['services', creatorId],
    queryFn:   () => creatorsApi.getCreatorServices(creatorId!),
    enabled:   !!creatorId,
    staleTime: 120_000,
  })
}

// ─── Single creator by ID ─────────────────────────────────────────────────────
export function useCreator(id: string | null) {
  return useQuery({
    queryKey:  id ? CREATOR_KEYS.detail(id) : [],
    queryFn:   () => creatorsApi.getCreatorById(id!),
    enabled:   !!id,
    staleTime: 120_000,
  })
}

// ─── Single creator by handle ─────────────────────────────────────────────────
export function useCreatorByHandle(handle: string | null) {
  return useQuery({
    queryKey:  handle ? CREATOR_KEYS.handle(handle) : [],
    queryFn:   () => creatorsApi.getCreatorByHandle(handle!),
    enabled:   !!handle,
    staleTime: 300_000,
  })
}

// ─── Availability ─────────────────────────────────────────────────────────────
export function useCreatorAvailability(creatorId: string, fromDate: string, toDate: string) {
  return useQuery({
    queryKey: CREATOR_KEYS.avail(creatorId, fromDate, toDate),
    queryFn:  () => creatorsApi.getAvailability(creatorId, fromDate, toDate),
    staleTime: 60_000,
  })
}

// ─── Onboarding mutations ─────────────────────────────────────────────────────
export function useUpsertCreatorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: creatorsApi.upsertCreatorProfile,
    onSuccess: (data) => {
      qc.setQueryData(CREATOR_KEYS.detail(data.id), data)
    },
  })
}

export function usePublishCreatorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => creatorsApi.publishCreatorProfile(id),
    onSuccess: (data) => {
      qc.setQueryData(CREATOR_KEYS.detail(data.id), data)
    },
  })
}

export function useSetAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ creatorId, date, block }: { creatorId: string; date: string; block: boolean }) =>
      block ? creatorsApi.blockDay(creatorId, date) : creatorsApi.unblockDay(creatorId, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creators', 'avail'] })
    },
  })
}

// ─── Portfolio mutations ──────────────────────────────────────────────────────
export function useAddPortfolioUrl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ creatorId, url }: { creatorId: string; url: string }) =>
      creatorsApi.addPortfolioUrl(creatorId, url),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: CREATOR_KEYS.detail(vars.creatorId) })
    },
  })
}

export function useRemovePortfolioUrl() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ creatorId, url }: { creatorId: string; url: string }) =>
      creatorsApi.removePortfolioUrl(creatorId, url),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: CREATOR_KEYS.detail(vars.creatorId) })
    },
  })
}

// ─── Favorites ────────────────────────────────────────────────────────────────
export function useSavedCreators() {
  return useQuery({
    queryKey: CREATOR_KEYS.saved,
    queryFn:  favoritesApi.getMyFavorites,
    staleTime: 60_000,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (creatorId: string) => favoritesApi.toggleFavorite(creatorId),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: CREATOR_KEYS.saved })
    },
  })
}

// ─── Onboard step helper ──────────────────────────────────────────────────────
export function useSetOnboardStep() {
  return useMutation({
    mutationFn: ({ id, step }: { id: string; step: CreatorProfileRow['onboard_step'] }) =>
      creatorsApi.setOnboardStep(id, step),
  })
}
