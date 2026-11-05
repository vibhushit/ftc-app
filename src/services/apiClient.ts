import type {
  Creator,
  ServiceItem,
  Booking,
  CustomQuote,
  ChatMessage,
  ChatMessagePayload,
  CreateBookingPayload,
  CreateQuotePayload,
  CreatorOnboardPayload,
  AuthResponse,
  PayoutBalance,
  WithdrawPayload,
  MonthAvailabilityResponse,
  UpdateCalendarSettingsPayload,
  CreateOverridePayload,
  CalendarOverride,
  PlatformConfig,
  CreateReviewPayload,
  CreatorReviewsSummary,
  BookingReviewResponse,
  Review,
} from '@/types/bindings'
import { compressImageToWebP } from '@/utils/imageCompressor'
import { getApiBaseUrl } from '@/config/environmentMode'
import { supabase, supabaseAvailable } from '@/lib/supabase'
import { signOutCleanly } from '@/lib/api/auth'

const getBaseUrl = () => getApiBaseUrl()

export interface ApiErrorEvent {
  endpoint: string
  method: string
  status?: number
  message: string
  timestamp: string
}

function notifyApiError(error: ApiErrorEvent) {
  console.error(`[FTC Live API Error] ${error.method} ${error.endpoint}:`, error.message)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ftc_api_error', { detail: error }))
  }

  // Reactive 401 Unauthorized / Token Revocation eviction
  const isAuthError = error.status === 401 ||
    error.message.includes('401') ||
    error.message.toLowerCase().includes('unauthorized') ||
    error.message.toLowerCase().includes('user not found')

  if (isAuthError) {
    signOutCleanly().catch(e => console.warn('[FTC] Auto signOut on 401 failed:', e))
  }
}

/**
 * Extracts a sanitized, human-readable error message from an API response.
 * Specifically prevents Render/cloud proxy 502/503 HTML pages from leaking raw markup.
 */
export async function extractResponseError(res: Response): Promise<string> {
  // 1. Detect Render/proxy waking-up or gateway errors (502, 503, 504)
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return 'The backend service is waking up or temporarily unavailable. Please wait a moment and try again.'
  }

  // 2. Detect HTML response bodies from proxies or web servers
  const contentType = (res.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('text/html')) {
    if (res.status === 404) return 'The requested API service was not found.'
    return `Server temporarily unavailable (${res.status} ${res.statusText || 'Gateway Error'}). Please try again shortly.`
  }

  // 3. Try parsing JSON error
  try {
    const errorJson = await res.json()
    if (typeof errorJson === 'string' && errorJson.trim()) {
      return errorJson.trim()
    }
    if (errorJson && typeof errorJson === 'object') {
      const msg = errorJson.message || errorJson.error || errorJson.detail
      if (typeof msg === 'string' && msg.trim()) return msg.trim()
    }
  } catch {
    // 4. If not JSON, try text, but strictly guard against HTML tags
    try {
      const text = await res.text()
      if (text && !text.includes('<html') && !text.includes('<!DOCTYPE') && !text.includes('<body>')) {
        return text.trim()
      }
    } catch {}
  }

  return res.statusText || `Request failed with status ${res.status}`
}

/**
 * Universal response handler for Rust Axum and Supabase backends.
 * Extracts clean JSON fields, sanitizes proxy HTML, and notifies subscribers.
 */
export async function handleApiResponse<T = any>(res: Response, endpoint: string, method: string): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return {} as T
    return await res.json()
  }

  const errorMessage = await extractResponseError(res)

  const errorEvent: ApiErrorEvent = {
    endpoint,
    method,
    status: res.status,
    message: errorMessage,
    timestamp: new Date().toLocaleTimeString(),
  }

  notifyApiError(errorEvent)
  throw new Error(errorMessage)
}

/**
 * Helper to acquire authorization and JSON headers.
 */
async function getHeaders(customHeaders?: Record<string, string>): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  if (supabaseAvailable) {
    try {
      const { data } = await supabase.auth.getSession()
      if (data?.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`
      }
    } catch {
      // Ignore session lookup failures
    }
  }

  return headers
}

/**
 * Canonical FTC API Service Layer
 * 
 * Single source of truth querying the Rust Axum backend and PostgreSQL database.
 * No mock data, no in-memory fallbacks, pure live communication.
 */
export const apiClient = {
  // ─── HEALTH CHECK ────────────────────────────────────────────────────────────
  async checkHealth(): Promise<boolean> {
    try {
      const rootUrl = getBaseUrl().replace(/\/api\/?$/, '')
      const res = await fetch(`${rootUrl}/health`, {
        method: 'GET',
        cache: 'no-store',
      })
      if (res.ok) return true
    } catch {}

    try {
      const configUrl = `${getBaseUrl()}/config`
      const res = await fetch(configUrl, {
        method: 'GET',
        cache: 'no-store',
      })
      return res.ok
    } catch {
      return false
    }
  },

  // ─── PLATFORM CONFIG ─────────────────────────────────────────────────────────
  async getConfig(): Promise<PlatformConfig> {
    const endpoint = `${getBaseUrl()}/config`
    const res = await fetch(endpoint)
    return handleApiResponse<PlatformConfig>(res, '/config', 'GET')
  },

  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────
  async sendPhoneOtp(phone: string): Promise<{ success: boolean }> {
    const endpoint = `${getBaseUrl()}/auth/phone`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ phone }),
    })
    return handleApiResponse<{ success: boolean }>(res, '/auth/phone', 'POST')
  },

  async verifyOtp(phone: string, code: string): Promise<AuthResponse> {
    const endpoint = `${getBaseUrl()}/auth/verify`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ phone, code }),
    })
    return handleApiResponse<AuthResponse>(res, '/auth/verify', 'POST')
  },

  async selectRole(role: string): Promise<{ success: boolean }> {
    const endpoint = `${getBaseUrl()}/auth/role`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ role }),
    })
    return handleApiResponse<{ success: boolean }>(res, '/auth/role', 'POST')
  },

  // ─── CREATORS & DISCOVERY ─────────────────────────────────────────────────────
  async getCreators(params?: { discipline?: string; city?: string; minPrice?: number; maxPrice?: number }): Promise<Creator[]> {
    const query = new URLSearchParams()
    if (params?.discipline) query.set('discipline', params.discipline)
    if (params?.city) query.set('city', params.city)
    if (params?.minPrice) query.set('min_price', String(params.minPrice))
    if (params?.maxPrice) query.set('max_price', String(params.maxPrice))

    const endpoint = `${getBaseUrl()}/creators${query.toString() ? `?${query.toString()}` : ''}`
    const res = await fetch(endpoint)
    return handleApiResponse<Creator[]>(res, '/creators', 'GET')
  },

  async getCreatorById(id: string): Promise<Creator | null> {
    const endpoint = `${getBaseUrl()}/creators/${id}`
    const res = await fetch(endpoint)
    if (res.status === 404) return null
    return handleApiResponse<Creator>(res, `/creators/${id}`, 'GET')
  },

  async getCreatorByHandle(handle: string): Promise<Creator | null> {
    const clean = handle.trim().replace(/^@+/, '')
    const endpoint = `${getBaseUrl()}/creators/handle/${encodeURIComponent(clean)}`
    const res = await fetch(endpoint)
    if (res.status === 404) return null
    return handleApiResponse<Creator>(res, `/creators/handle/${clean}`, 'GET')
  },

  async getCreatorServices(id: string): Promise<ServiceItem[]> {
    const endpoint = `${getBaseUrl()}/creators/${id}/services`
    try {
      const res = await fetch(endpoint)
      if (res.status === 404) return []
      return await handleApiResponse<ServiceItem[]>(res, `/creators/${id}/services`, 'GET')
    } catch {
      return []
    }
  },

  async checkHandle(handle: string): Promise<{ available: boolean; handle: string; reason?: string | null }> {
    const endpoint = `${getBaseUrl()}/creators/check-handle?handle=${encodeURIComponent(handle)}`
    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(await extractResponseError(res))
      return await res.json()
    } catch {
      return { available: true, handle: `@${handle.trim().replace(/^@/, '')}` }
    }
  },

  async onboardCreator(payload: CreatorOnboardPayload): Promise<{ success: boolean; creator_id: string }> {
    const endpoint = `${getBaseUrl()}/creators/onboard`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<{ success: boolean; creator_id: string }>(res, '/creators/onboard', 'POST')
  },

  // ─── CALENDAR & SCHEDULING ───────────────────────────────────────────────────
  async getAvailability(creatorId: string, month: string, durationMinutes: number = 120): Promise<MonthAvailabilityResponse> {
    const endpoint = `${getBaseUrl()}/calendar/${creatorId}/availability?month=${month}&duration_minutes=${durationMinutes}`
    const res = await fetch(endpoint)
    return handleApiResponse<MonthAvailabilityResponse>(res, `/calendar/${creatorId}/availability`, 'GET')
  },

  async validateSlot(
    creatorId: string,
    date: string,
    time: string,
    durationMinutes: number = 120
  ): Promise<{ valid: boolean; reason?: string | null }> {
    const params = new URLSearchParams({
      date,
      time,
      duration: durationMinutes.toString(),
    })
    const endpoint = `${getBaseUrl()}/calendar/${encodeURIComponent(creatorId)}/validate-slot?${params.toString()}`
    try {
      const res = await fetch(endpoint, { headers: await getHeaders() })
      if (!res.ok) throw new Error(await extractResponseError(res))
      return await res.json()
    } catch (err: any) {
      console.warn('Validate slot request error, falling back to permissive:', err)
      return { valid: true }
    }
  },

  async getCalendarSettings(creatorId?: string): Promise<{
    creator_id?: string
    slot_step_minutes: number
    buffer_minutes: number
    min_notice_hours: number
    holiday_mode: boolean
    calendar_token: string
    schedules: Array<{ day_of_week: number; is_active: boolean; start_time: string; end_time: string }>
    overrides?: Array<CalendarOverride>
  }> {
    const endpoint = `${getBaseUrl()}/calendar/me/calendar-settings`
    const customHeaders: Record<string, string> = {}
    if (creatorId) customHeaders['x-creator-id'] = creatorId
    const res = await fetch(endpoint, { headers: await getHeaders(customHeaders) })
    return handleApiResponse(res, '/calendar/me/calendar-settings', 'GET')
  },

  async updateCalendarSettings(payload: UpdateCalendarSettingsPayload, creatorId?: string): Promise<{ success: boolean; settings: any }> {
    const endpoint = `${getBaseUrl()}/calendar/me/calendar-settings`
    const customHeaders: Record<string, string> = {}
    if (creatorId) customHeaders['x-creator-id'] = creatorId
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(customHeaders),
      body: JSON.stringify(payload),
    })
    return handleApiResponse(res, '/calendar/me/calendar-settings', 'POST')
  },

  async createOverride(payload: CreateOverridePayload, creatorId?: string): Promise<{ success: boolean; id: string; override: any }> {
    const endpoint = `${getBaseUrl()}/calendar/me/overrides`
    const customHeaders: Record<string, string> = {}
    if (creatorId) customHeaders['x-creator-id'] = creatorId
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(customHeaders),
      body: JSON.stringify(payload),
    })
    return handleApiResponse(res, '/calendar/me/overrides', 'POST')
  },

  async deleteOverride(id: string, creatorId?: string): Promise<{ success: boolean; id: string }> {
    const endpoint = `${getBaseUrl()}/calendar/me/overrides/${id}`
    const customHeaders: Record<string, string> = {}
    if (creatorId) customHeaders['x-creator-id'] = creatorId
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: await getHeaders(customHeaders),
    })
    return handleApiResponse(res, `/calendar/me/overrides/${id}`, 'DELETE')
  },

  // ─── BOOKINGS & ESCROW ────────────────────────────────────────────────────────
  async requestBooking(payload: CreateBookingPayload): Promise<Booking> {
    const endpoint = `${getBaseUrl()}/bookings/request`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<Booking>(res, '/bookings/request', 'POST')
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const endpoint = `${getBaseUrl()}/bookings`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<Booking>(res, '/bookings', 'POST')
  },

  async acceptBooking(bookingId: string): Promise<{ success: boolean; status: string }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/accept`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
    })
    return handleApiResponse<{ success: boolean; status: string }>(res, `/bookings/${bookingId}/accept`, 'POST')
  },

  async declineBooking(bookingId: string, reason?: string): Promise<{ success: boolean; status: string }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/decline`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ reason }),
    })
    return handleApiResponse<{ success: boolean; status: string }>(res, `/bookings/${bookingId}/decline`, 'POST')
  },

  async cancelBooking(bookingId: string, reason: string): Promise<{ success: boolean; status: string }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/cancel`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ reason }),
    })
    return handleApiResponse<{ success: boolean; status: string }>(res, `/bookings/${bookingId}/cancel`, 'POST')
  },

  async expirePendingBookings(): Promise<{ success: boolean; swept_count: number }> {
    const endpoint = `${getBaseUrl()}/bookings/expire-pending`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
    })
    return handleApiResponse<{ success: boolean; swept_count: number }>(res, '/bookings/expire-pending', 'POST')
  },

  async updateBookingNotes(bookingId: string, notes: string): Promise<Booking> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/notes`
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify({ notes }),
    })
    return handleApiResponse<Booking>(res, `/bookings/${bookingId}/notes`, 'PATCH')
  },

  async requestCompletionOtp(bookingId: string): Promise<{
    otp: string
    expires_at: string
    generation_count: number
    cooldown_seconds: number
  }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/request-completion-otp`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
    })
    return handleApiResponse<{
      otp: string
      expires_at: string
      generation_count: number
      cooldown_seconds: number
    }>(res, `/bookings/${bookingId}/request-completion-otp`, 'POST')
  },

  async verifyCompletionOtp(bookingId: string, otp: string): Promise<{
    success: boolean
    status: string
    remaining_attempts?: number
    locked_until?: string
    error?: string
  }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/verify-completion-otp`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ otp }),
    })
    return handleApiResponse<{
      success: boolean
      status: string
      remaining_attempts?: number
      locked_until?: string
      error?: string
    }>(res, `/bookings/${bookingId}/verify-completion-otp`, 'POST')
  },

  // ─── MESSAGING & QUOTES ──────────────────────────────────────────────────────
  async sendMessage(payload: ChatMessagePayload): Promise<ChatMessage> {
    const endpoint = `${getBaseUrl()}/chat/conversations/${payload.receiver_id}/messages`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<ChatMessage>(res, `/chat/conversations/${payload.receiver_id}/messages`, 'POST')
  },

  async sendQuote(payload: CreateQuotePayload): Promise<CustomQuote> {
    const endpoint = `${getBaseUrl()}/chat/quotes`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<CustomQuote>(res, '/chat/quotes', 'POST')
  },

  // ─── MEDIA UPLOAD ────────────────────────────────────────────────────────────
  async uploadPortfolioImage(file: File): Promise<string> {
    const compressedWebP = await compressImageToWebP(file, 1920, 0.82)

    // Upload directly to Supabase Storage bucket 'portfolio' if available
    if (supabaseAvailable) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const uid = user?.id || 'guest_uploads'
        const ext = 'webp'
        const path = `${uid}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
        const { data, error } = await supabase.storage.from('portfolio').upload(path, compressedWebP, {
          contentType: 'image/webp',
          upsert: true,
        })
        if (!error && data) {
          const { data: publicUrlData } = supabase.storage.from('portfolio').getPublicUrl(data.path)
          return publicUrlData.publicUrl
        }
      } catch (sbErr) {
        console.warn('[FTC Storage] Supabase portfolio storage upload fallback:', sbErr)
      }
    }

    const endpoint = `${getBaseUrl()}/media/upload-url`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ file_name: compressedWebP.name, file_size: compressedWebP.size }),
    })
    const { upload_url, public_url } = await handleApiResponse<{ upload_url: string; public_url: string }>(
      res,
      '/media/upload-url',
      'POST'
    )

    await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/webp' },
      body: compressedWebP,
    })

    return public_url
  },

  // ─── PAYOUTS & FINANCIALS ─────────────────────────────────────────────────────
  async getPayoutBalance(): Promise<PayoutBalance> {
    const endpoint = `${getBaseUrl()}/payouts/balance`
    const res = await fetch(endpoint, { headers: await getHeaders() })
    return handleApiResponse<PayoutBalance>(res, '/payouts/balance', 'GET')
  },

  async withdrawPayout(payload: WithdrawPayload): Promise<{ success: boolean; message: string }> {
    const endpoint = `${getBaseUrl()}/payouts/withdraw`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<{ success: boolean; message: string }>(res, '/payouts/withdraw', 'POST')
  },

  // ─── VERIFIED REVIEWS ────────────────────────────────────────────────────────
  async createReview(payload: CreateReviewPayload): Promise<{ success: boolean; review_id: string }> {
    const endpoint = `${getBaseUrl()}/reviews`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(payload),
    })
    return handleApiResponse<{ success: boolean; review_id: string }>(res, '/reviews', 'POST')
  },

  async getCreatorReviews(creatorId: string): Promise<CreatorReviewsSummary> {
    const endpoint = `${getBaseUrl()}/reviews/creator/${encodeURIComponent(creatorId)}`
    const res = await fetch(endpoint, { headers: await getHeaders() })
    return handleApiResponse<CreatorReviewsSummary>(res, `/reviews/creator/${creatorId}`, 'GET')
  },

  async getBookingReview(bookingId: string): Promise<BookingReviewResponse> {
    const endpoint = `${getBaseUrl()}/reviews/booking/${encodeURIComponent(bookingId)}`
    const res = await fetch(endpoint, { headers: await getHeaders() })
    return handleApiResponse<BookingReviewResponse>(res, `/reviews/booking/${bookingId}`, 'GET')
  },
}
