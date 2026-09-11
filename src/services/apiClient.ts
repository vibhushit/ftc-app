import type {
  Creator,
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
} from '@/types/bindings'
import { compressImageToWebP } from '@/utils/imageCompressor'
import { getApiBaseUrl } from '@/config/environmentMode'
import { supabase, supabaseAvailable } from '@/lib/supabase'

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
  // ─── PLATFORM CONFIG ─────────────────────────────────────────────────────────
  async getConfig(): Promise<PlatformConfig> {
    const endpoint = `${getBaseUrl()}/config`
    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/config',
        method: 'GET',
        message: err?.message || 'Failed to fetch platform configuration',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────
  async sendPhoneOtp(phone: string): Promise<{ success: boolean }> {
    const endpoint = `${getBaseUrl()}/auth/phone`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ phone }),
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/auth/phone',
        method: 'POST',
        status: err?.status,
        message: err?.message || 'Failed to send OTP',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async verifyOtp(phone: string, code: string): Promise<AuthResponse> {
    const endpoint = `${getBaseUrl()}/auth/verify`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ phone, code }),
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/auth/verify',
        method: 'POST',
        status: err?.status,
        message: err?.message || 'Failed to verify OTP',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async selectRole(role: string): Promise<{ success: boolean }> {
    const endpoint = `${getBaseUrl()}/auth/role`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/auth/role',
        method: 'POST',
        message: err?.message || 'Failed to update role',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  // ─── CREATORS & DISCOVERY ─────────────────────────────────────────────────────
  async getCreators(params?: { discipline?: string; city?: string; minPrice?: number; maxPrice?: number }): Promise<Creator[]> {
    const query = new URLSearchParams()
    if (params?.discipline) query.set('discipline', params.discipline)
    if (params?.city) query.set('city', params.city)
    if (params?.minPrice) query.set('min_price', String(params.minPrice))
    if (params?.maxPrice) query.set('max_price', String(params.maxPrice))

    const endpoint = `${getBaseUrl()}/creators${query.toString() ? `?${query.toString()}` : ''}`
    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      return data
    } catch (err: any) {
      notifyApiError({
        endpoint: '/creators',
        method: 'GET',
        message: err?.message || 'Failed to fetch creators from live database',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async getCreatorById(id: string): Promise<Creator | null> {
    const endpoint = `${getBaseUrl()}/creators/${id}`
    try {
      const res = await fetch(endpoint)
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: `/creators/${id}`,
        method: 'GET',
        message: err?.message || `Creator with ID '${id}' not found`,
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async onboardCreator(payload: CreatorOnboardPayload): Promise<{ success: boolean; creator_id: string }> {
    const endpoint = `${getBaseUrl()}/creators/onboard`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText)
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/creators/onboard',
        method: 'POST',
        message: err?.message || 'Failed to onboard creator to live database',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  // ─── CALENDAR & SCHEDULING ───────────────────────────────────────────────────
  async getAvailability(creatorId: string, month: string, durationMinutes: number = 120): Promise<MonthAvailabilityResponse> {
    const endpoint = `${getBaseUrl()}/calendar/${creatorId}/availability?month=${month}&duration_minutes=${durationMinutes}`
    try {
      const res = await fetch(endpoint)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: `/calendar/${creatorId}/availability`,
        method: 'GET',
        message: err?.message || 'Failed to fetch calendar availability',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
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
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  },

  async deleteOverride(id: string, creatorId?: string): Promise<{ success: boolean; id: string }> {
    const endpoint = `${getBaseUrl()}/calendar/me/overrides/${id}`
    const customHeaders: Record<string, string> = {}
    if (creatorId) customHeaders['x-creator-id'] = creatorId
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: await getHeaders(customHeaders),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  },

  // ─── BOOKINGS & ESCROW ────────────────────────────────────────────────────────
  async requestBooking(payload: CreateBookingPayload): Promise<Booking> {
    const endpoint = `${getBaseUrl()}/bookings/request`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/bookings/request',
        method: 'POST',
        message: err?.message || 'Failed to submit booking request',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const endpoint = `${getBaseUrl()}/bookings`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/bookings',
        method: 'POST',
        message: err?.message || 'Failed to create live booking',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async acceptBooking(bookingId: string): Promise<{ success: boolean; status: string }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/accept`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  },

  async declineBooking(bookingId: string, reason?: string): Promise<{ success: boolean; status: string }> {
    const endpoint = `${getBaseUrl()}/bookings/${bookingId}/decline`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  },

  // ─── MESSAGING & QUOTES ──────────────────────────────────────────────────────
  async sendMessage(payload: ChatMessagePayload): Promise<ChatMessage> {
    const endpoint = `${getBaseUrl()}/chat/conversations/${payload.receiver_id}/messages`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: `/chat/conversations/${payload.receiver_id}/messages`,
        method: 'POST',
        message: err?.message || 'Failed to send live message',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async sendQuote(payload: CreateQuotePayload): Promise<CustomQuote> {
    const endpoint = `${getBaseUrl()}/chat/quotes`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/chat/quotes',
        method: 'POST',
        message: err?.message || 'Failed to submit quote',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
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
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ file_name: compressedWebP.name, file_size: compressedWebP.size }),
      })
      if (!res.ok) throw new Error('Failed to get presigned upload URL')
      const { upload_url, public_url } = await res.json()

      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: compressedWebP,
      })

      return public_url
    } catch (err: any) {
      notifyApiError({
        endpoint: '/media/upload-url',
        method: 'POST',
        message: err?.message || 'Failed to upload portfolio image',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  // ─── PAYOUTS & FINANCIALS ─────────────────────────────────────────────────────
  async getPayoutBalance(): Promise<PayoutBalance> {
    const endpoint = `${getBaseUrl()}/payouts/balance`
    try {
      const res = await fetch(endpoint, { headers: await getHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/payouts/balance',
        method: 'GET',
        message: err?.message || 'Failed to fetch payout balance',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  async withdrawPayout(payload: WithdrawPayload): Promise<{ success: boolean; message: string }> {
    const endpoint = `${getBaseUrl()}/payouts/withdraw`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err: any) {
      notifyApiError({
        endpoint: '/payouts/withdraw',
        method: 'POST',
        message: err?.message || 'Failed to request withdrawal',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },
}
