import type {
  Creator,
  Booking,
  User,
  CustomQuote,
  ChatMessage,
  ChatMessagePayload,
  CreateBookingPayload,
  CreateQuotePayload,
  CreatorOnboardPayload,
  AuthResponse,
  PayoutBalance,
  Transaction,
  WithdrawPayload,
  Review,
  CreateReviewPayload,
} from '@/types/bindings'
import { CREATORS } from '@/data/creators'
import { compressImageToWebP } from '@/utils/imageCompressor'
import { isLiveMode, getApiBaseUrl } from '@/config/environmentMode'

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
 * Decoupled API Service Layer
 * In LIVE MODE: Queries the Rust Axum backend & PostgreSQL database directly.
 * In SANDBOX MODE: Operates purely in-memory using local seed data for instant offline testing.
 */
export const apiClient = {
  // ─── AUTHENTICATION ──────────────────────────────────────────────────────────
  async sendPhoneOtp(phone: string): Promise<{ success: boolean }> {
    if (!isLiveMode()) {
      console.log('[Sandbox] Simulated OTP sent to:', phone)
      return { success: true }
    }

    const endpoint = `${getBaseUrl()}/auth/phone`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!isLiveMode()) {
      console.log('[Sandbox] Simulated OTP verification for:', phone)
      return {
        token: 'sandbox_jwt_token_ftc',
        user: {
          id: 'u_101',
          phone,
          name: 'Rhea Kapoor',
          role: 'client',
          city: 'Delhi',
          handle: '@user',
          trust_score: 85,
          is_creator: false,
        },
      }
    }

    const endpoint = `${getBaseUrl()}/auth/verify`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!isLiveMode()) {
      return { success: true }
    }

    const endpoint = `${getBaseUrl()}/auth/role`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!isLiveMode()) {
      let list = CREATORS as unknown as Creator[]
      if (params?.discipline) {
        list = list.filter(c => c.discipline.toLowerCase() === params.discipline?.toLowerCase())
      }
      if (params?.city) {
        list = list.filter(c => c.city.toLowerCase() === params.city?.toLowerCase())
      }
      return list
    }

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
    if (!isLiveMode()) {
      const found = (CREATORS as unknown as Creator[]).find(c => c.id === id)
      return found ?? null
    }

    const endpoint = `${getBaseUrl()}/creators/${id}`
    try {
      const res = await fetch(endpoint)
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
    if (!isLiveMode()) {
      console.log('[Sandbox] Simulated creator onboarding:', payload)
      return { success: true, creator_id: 'c_' + Date.now() }
    }

    const endpoint = `${getBaseUrl()}/creators/onboard`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
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

  // ─── BOOKINGS & ESCROW ────────────────────────────────────────────────────────
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    if (!isLiveMode()) {
      return {
        id: 'FTC' + Math.floor(1000 + Math.random() * 9000),
        creator_id: payload.creator_id,
        creator_name: 'Rhea Kapoor',
        creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        client_name: 'You',
        pkg_name: payload.pkg_name,
        date_time: payload.date_time,
        status: 'confirmed',
        price: 25000,
        deposit_amount: 7500,
        balance_amount: 17500,
        location_type: payload.location_type,
      }
    }

    const endpoint = `${getBaseUrl()}/bookings`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // ─── MESSAGING & QUOTES ──────────────────────────────────────────────────────
  async sendMessage(payload: ChatMessagePayload): Promise<ChatMessage> {
    if (!isLiveMode()) {
      return {
        id: 'm_' + Date.now(),
        sender_id: 'self',
        receiver_id: payload.receiver_id,
        text: payload.text,
        timestamp: 'Just now',
      }
    }

    const endpoint = `${getBaseUrl()}/chat/conversations/${payload.receiver_id}/messages`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!isLiveMode()) {
      return {
        id: 'q_' + Date.now(),
        creator_id: 'self',
        client_id: payload.client_id,
        scope: payload.scope,
        price: payload.price,
        delivery: payload.delivery,
        note: payload.note || null,
        status: 'sent',
        created_at: new Date().toISOString(),
      }
    }

    const endpoint = `${getBaseUrl()}/chat/quotes`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    if (!isLiveMode()) {
      return URL.createObjectURL(compressedWebP)
    }

    const endpoint = `${getBaseUrl()}/media/upload-url`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        message: err?.message || 'Failed to upload image to storage',
        timestamp: new Date().toLocaleTimeString(),
      })
      throw err
    }
  },

  // ─── PAYOUTS & FINANCIALS ─────────────────────────────────────────────────────
  async getPayoutBalance(): Promise<PayoutBalance> {
    if (!isLiveMode()) {
      return { available_balance: 42500, pending_escrow: 17500, total_earned: 185000, upi_id: 'rhea@upi' }
    }

    const endpoint = `${getBaseUrl()}/payouts/balance`
    try {
      const res = await fetch(endpoint)
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
    if (!isLiveMode()) {
      return { success: true, message: `Withdrawal request for ₹${payload.amount} submitted in Sandbox mode` }
    }

    const endpoint = `${getBaseUrl()}/payouts/withdraw`
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
