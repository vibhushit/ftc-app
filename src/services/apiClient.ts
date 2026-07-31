import type {
  Creator,
  Booking,
  User,
  CustomQuote,
  CreateBookingPayload,
  CreateQuotePayload,
  CreatorOnboardPayload,
  AuthResponse
} from '@/types/bindings'
import { CREATORS } from '@/data/creators'
import { compressImageToWebP } from '@/utils/imageCompressor'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/**
 * Decoupled API Service Layer
 * Sends HTTP / WebSockets requests to the Rust Axum backend (http://localhost:3000/api).
 * If the Rust backend is offline, falls back to structured typed mock data.
 */
export const apiClient = {
  /**
   * Fetch all creators for discovery/search
   */
  async getCreators(): Promise<Creator[]> {
    try {
      console.log(`[API Client] GET ${API_BASE_URL}/creators`)
      const res = await fetch(`${API_BASE_URL}/creators`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      console.log(`[API Client] Received ${data.length} creators from Rust backend`)
      return data
    } catch (err) {
      console.warn('[API Client] Rust backend offline, using fallback creators:', err)
      return CREATORS as unknown as Creator[]
    }
  },

  /**
   * Fetch single creator profile by ID
   */
  async getCreatorById(id: string): Promise<Creator | null> {
    const list = await this.getCreators()
    return list.find(c => c.id === id) ?? null
  },

  /**
   * Submit creator onboarding profile
   */
  async onboardCreator(payload: CreatorOnboardPayload): Promise<{ success: boolean; creatorId: string }> {
    try {
      console.log(`[API Client] POST ${API_BASE_URL}/creators/onboard`, payload)
      const res = await fetch(`${API_BASE_URL}/creators/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn('[API Client] Backend offline, returning mock onboarding result')
      return { success: true, creatorId: 'c_' + Date.now() }
    }
  },

  /**
   * Compress and upload portfolio image (WebP max 1920px)
   */
  async uploadPortfolioImage(file: File): Promise<string> {
    // 1. Compress raw image in browser to WebP (~300KB)
    const compressedWebP = await compressImageToWebP(file, 1920, 0.82)

    try {
      // 2. Request presigned upload URL from Rust backend
      console.log(`[API Client] Requesting presigned URL for ${compressedWebP.name} (${compressedWebP.size} bytes)`)
      const res = await fetch(`${API_BASE_URL}/media/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: compressedWebP.name, file_size: compressedWebP.size }),
      })
      if (!res.ok) throw new Error('Failed to get presigned upload URL')
      const { upload_url, public_url } = await res.json()

      // 3. Upload directly to Cloudflare R2 / S3
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: compressedWebP,
      })

      return public_url
    } catch (err) {
      console.warn('[API Client] Media upload fallback to local WebP blob preview:', err)
      return URL.createObjectURL(compressedWebP)
    }
  },

  /**
   * Create a new booking request
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    try {
      console.log(`[API Client] POST ${API_BASE_URL}/bookings`, payload)
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn('[API Client] Backend offline, returning mock booking')
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
  },

  /**
   * Send custom quote
   */
  async sendQuote(payload: CreateQuotePayload): Promise<CustomQuote> {
    try {
      console.log(`[API Client] POST ${API_BASE_URL}/quotes`, payload)
      const res = await fetch(`${API_BASE_URL}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn('[API Client] Backend offline, returning mock custom quote')
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
  }
}
