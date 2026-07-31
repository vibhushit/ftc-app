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
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

/**
 * Decoupled API Service Layer
 * Abstitutes backend REST/WebSocket calls from React UI components.
 * If backend is unavailable or VITE_USE_MOCK=true, returns seamless typed fallback data.
 */
export const apiClient = {
  /**
   * Fetch all creators for discovery/search
   */
  async getCreators(): Promise<Creator[]> {
    if (USE_MOCK) {
      return CREATORS as unknown as Creator[]
    }
    try {
      const res = await fetch(`${API_BASE_URL}/creators`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn('Backend unavailable, falling back to mock creators:', err)
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
    if (USE_MOCK) {
      return { success: true, creatorId: 'c_' + Date.now() }
    }
    try {
      const res = await fetch(`${API_BASE_URL}/creators/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      return await res.json()
    } catch (err) {
      return { success: true, creatorId: 'c_' + Date.now() }
    }
  },

  /**
   * Compress and upload portfolio image (WebP max 1920px)
   */
  async uploadPortfolioImage(file: File): Promise<string> {
    // 1. Compress raw image in browser to WebP (~300KB)
    const compressedWebP = await compressImageToWebP(file, 1920, 0.82)
    
    if (USE_MOCK) {
      // In mock mode, return local Blob preview URL
      return URL.createObjectURL(compressedWebP)
    }

    try {
      // 2. Request presigned upload URL from Rust backend
      const res = await fetch(`${API_BASE_URL}/media/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_name: compressedWebP.name, file_size: compressedWebP.size }),
      })
      if (!res.ok) throw new Error('Failed to get presigned upload URL')
      const { upload_url, public_url } = await res.json()

      // 3. Upload directly to Cloudflare R2
      await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: compressedWebP,
      })

      return public_url
    } catch (err) {
      console.warn('Media upload failed, using local Blob preview:', err)
      return URL.createObjectURL(compressedWebP)
    }
  },

  /**
   * Create a new booking request
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    if (USE_MOCK) {
      return {
        id: 'FTC' + Math.floor(1000 + Math.random() * 9000),
        creator_id: payload.creator_id,
        creator_name: 'Creator',
        creator_avatar: '',
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
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return await res.json()
  },

  /**
   * Send custom quote
   */
  async sendQuote(payload: CreateQuotePayload): Promise<CustomQuote> {
    if (USE_MOCK) {
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
    const res = await fetch(`${API_BASE_URL}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return await res.json()
  }
}
