// ─── FTC Database Types ───────────────────────────────────────────────────────
// Auto-generate from Supabase CLI: `supabase gen types typescript --local > src/lib/database.types.ts`
// This file is manually maintained until the Supabase project is linked.
// ─────────────────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole        = 'consumer' | 'creator' | 'both' | 'admin'
export type CreatorTier     = 'Rising' | 'Silver' | 'Gold' | 'Platinum'
export type VerificationLvl = 'none' | 'phone' | 'id' | 'vetted'
export type TravelMode      = 'studio' | 'travel' | 'both'
export type TravelRadius    = 'city' | 'state' | 'nation'
export type GenderType      = 'male' | 'female' | 'non-binary' | 'prefer_not_to_say'
export type BookingStatus   = 'inquiry' | 'pending' | 'confirmed' | 'active' | 'delivered' | 'completed' | 'cancelled' | 'disputed' | 'refunded'
export type LocationType    = 'studio' | 'local' | 'outstation'
export type PaymentType     = 'advance' | 'balance' | 'refund' | 'platform_fee'
export type PaymentStatus   = 'pending' | 'processing' | 'escrow' | 'released' | 'failed' | 'refunded'
export type TxnType         = 'charge' | 'escrow_hold' | 'escrow_release' | 'payout' | 'refund' | 'platform_fee' | 'coins_credit' | 'coins_debit'
export type NotifType       = 'booking' | 'payment' | 'review' | 'message' | 'trust' | 'verification' | 'availability' | 'dispute' | 'quote' | 'campaign'
export type SlotStatus      = 'available' | 'booked' | 'blocked'
export type CampaignKind    = 'brand' | 'creator'
export type DealStage       = 'applied' | 'contract' | 'active' | 'delivered' | 'completed' | 'rejected'
export type OnboardStep     = 'basics' | 'craft' | 'portfolio' | 'identity' | 'socials' | 'review' | 'live'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:           string
          name:         string
          email:        string | null
          phone:        string | null
          avatar_url:   string | null
          city:         string
          locality:     string
          role:         UserRole
          trust_score:  number
          coins:        number
          is_verified:  boolean
          fcm_token:    string | null
          created_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'> & Partial<Pick<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }

      creator_profiles: {
        Row: {
          id:               string
          handle:           string
          tagline:          string
          bio:              string
          discipline:       string
          sub_skills:       string[]
          years_exp:        number
          starting_at:      number
          languages:        string[]
          city:             string
          area:             string
          lat:              number | null
          lng:              number | null
          travel_mode:      TravelMode
          travel_radius:    TravelRadius
          tier:             CreatorTier
          verification:     VerificationLvl
          is_pro:           boolean
          trust_score:      number
          available_today:  boolean
          response_time:    string
          next_slot:        string
          work_days:        number[]
          work_start_hour:  number
          work_end_hour:    number
          instant_booking:  boolean
          holiday_mode:     boolean
          completed_jobs:   number
          avg_rating:       number
          review_count:     number
          repeat_rate:      number
          onboard_step:     OnboardStep
          is_published:     boolean
          portfolio_urls:   string[]
          ig_handle:        string | null
          yt_handle:        string | null
          website_url:      string | null
          upi_id:           string | null
          bank_account:     Json | null
          pan:              string | null
          gstin:            string | null
          gender:           GenderType
          created_at:       string
          updated_at:       string
        }
        Insert: Partial<Database['public']['Tables']['creator_profiles']['Row']> & { id: string; handle: string }
        Update: Partial<Database['public']['Tables']['creator_profiles']['Row']>
      }

      consumer_profiles: {
        Row: {
          id:               string
          bookings_count:   number
          reviews_given:    number
          created_at:       string
        }
        Insert: { id: string } & Partial<Omit<Database['public']['Tables']['consumer_profiles']['Row'], 'id'>>
        Update: Partial<Database['public']['Tables']['consumer_profiles']['Row']>
      }

      services: {
        Row: {
          id:            string
          creator_id:    string
          name:          string
          description:   string
          price:         number
          duration:      string
          inclusions:    string[]
          revisions:     number
          delivery_days: number
          sort_order:    number
          is_active:     boolean
          created_at:    string
          updated_at:    string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Insert']>
      }

      bookings: {
        Row: {
          id:                  string
          booking_ref:         string
          consumer_id:         string
          creator_id:          string
          service_id:          string | null
          status:              BookingStatus
          session_date:        string | null
          session_time:        string | null
          location_type:       LocationType
          location_address:    string | null
          occasion:            string | null
          notes:               string | null
          base_price:          number
          travel_fee:          number
          accommodation_fee:   number
          platform_fee:        number
          total_price:         number
          advance_amount:      number
          balance_amount:      number
          advance_pct:         number
          created_at:          string
          updated_at:          string
          confirmed_at:        string | null
          completed_at:        string | null
          cancelled_at:        string | null
          cancellation_reason: string | null
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booking_ref' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }

      reviews: {
        Row: {
          id:            string
          booking_id:    string
          reviewer_id:   string
          reviewee_id:   string
          rating:        number
          quality:       number | null
          communication: number | null
          timeliness:    number | null
          value:         number | null
          text:          string | null
          is_public:     boolean
          photo_urls:    string[]
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }

      payments: {
        Row: {
          id:             string
          booking_id:     string
          type:           PaymentType
          amount:         number
          status:         PaymentStatus
          payment_method: string
          gateway_ref:    string | null
          gateway_data:   Json | null
          created_at:     string
          processed_at:   string | null
          released_at:    string | null
          failed_reason:  string | null
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Row']>
      }

      transactions: {
        Row: {
          id:           string
          booking_id:   string | null
          payment_id:   string | null
          type:         TxnType
          amount:       number
          from_user_id: string | null
          to_user_id:   string | null
          status:       string
          description:  string | null
          meta:         Json | null
          created_at:   string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at'>
        Update: never
      }

      availability_slots: {
        Row: {
          id:         string
          creator_id: string
          slot_date:  string
          slot_hour:  number | null
          status:     SlotStatus
          booking_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['availability_slots']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['availability_slots']['Row']>
      }

      notifications: {
        Row: {
          id:            string
          user_id:       string
          type:          NotifType
          title:         string
          body:          string
          action_screen: string | null
          action_data:   Json | null
          is_read:       boolean
          is_urgent:     boolean
          created_at:    string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }

      favorites: {
        Row: {
          id:          string
          consumer_id: string
          creator_id:  string
          created_at:  string
        }
        Insert: { consumer_id: string; creator_id: string }
        Update: never
      }

      chat_threads: {
        Row: {
          id:               string
          participant_ids:  string[]
          booking_id:       string | null
          last_message:     string | null
          last_message_at:  string | null
          unread_counts:    Json
          created_at:       string
        }
        Insert: Omit<Database['public']['Tables']['chat_threads']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_threads']['Row']>
      }

      chat_messages: {
        Row: {
          id:         string
          thread_id:  string
          sender_id:  string
          text:       string | null
          type:       string
          quote_id:   string | null
          image_url:  string | null
          meta:       Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: never
      }

      quotes: {
        Row: {
          id:         string
          thread_id:  string
          creator_id: string
          client_id:  string
          scope:      string
          price:      number
          delivery:   string
          note:       string | null
          status:     'sent' | 'paid' | 'declined' | 'expired'
          expires_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['quotes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quotes']['Row']>
      }

      campaigns: {
        Row: {
          id:               string
          poster_id:        string
          kind:             CampaignKind
          title:            string
          description:      string
          discipline:       string
          city:             string | null
          budget_min:       number
          budget_max:       number
          deadline:         string | null
          hero_url:         string | null
          applicants_count: number
          saves_count:      number
          is_active:        boolean
          created_at:       string
          updated_at:       string
        }
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'applicants_count' | 'saves_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['campaigns']['Row']>
      }

      deals: {
        Row: {
          id:           string
          campaign_id:  string
          brand_id:     string
          creator_id:   string
          quote:        number
          pitch:        string | null
          stage:        DealStage
          contract:     Json | null
          deliverables: Json
          payments:     Json
          applied_at:   string
          updated_at:   string
        }
        Insert: Omit<Database['public']['Tables']['deals']['Row'], 'id' | 'applied_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['deals']['Row']>
      }
    }

    Functions: {
      search_creators: {
        Args: {
          p_query?:      string
          p_discipline?: string
          p_city?:       string
          p_min_price?:  number
          p_max_price?:  number
          p_min_rating?: number
          p_available?:  boolean
          p_limit?:      number
          p_offset?:     number
        }
        Returns: Array<{
          id: string; name: string; handle: string; avatar_url: string
          discipline: string; city: string; area: string
          starting_at: number; avg_rating: number; review_count: number
          completed_jobs: number; tier: CreatorTier; trust_score: number
          available_today: boolean; verification: VerificationLvl; rank: number
        }>
      }
      recalculate_trust_score: {
        Args: { p_user_id: string }
        Returns: number
      }
    }

    Views: {
      creator_stats: {
        Row: {
          id: string; name: string; avatar_url: string
          discipline: string; city: string; tier: CreatorTier
          starting_at: number; avg_rating: number; review_count: number
          completed_jobs: number; trust_score: number
          is_published: boolean; available_today: boolean
        }
      }
    }
  }
}

// ─── Convenience row types ────────────────────────────────────────────────────
export type UserRow            = Database['public']['Tables']['users']['Row']
export type CreatorProfileRow  = Database['public']['Tables']['creator_profiles']['Row']
export type ServiceRow         = Database['public']['Tables']['services']['Row']
export type BookingRow         = Database['public']['Tables']['bookings']['Row']
export type ReviewRow          = Database['public']['Tables']['reviews']['Row']
export type PaymentRow         = Database['public']['Tables']['payments']['Row']
export type TransactionRow     = Database['public']['Tables']['transactions']['Row']
export type NotificationRow    = Database['public']['Tables']['notifications']['Row']
export type FavoriteRow        = Database['public']['Tables']['favorites']['Row']
export type ChatThreadRow      = Database['public']['Tables']['chat_threads']['Row']
export type ChatMessageRow     = Database['public']['Tables']['chat_messages']['Row']
export type QuoteRow           = Database['public']['Tables']['quotes']['Row']
export type CampaignRow        = Database['public']['Tables']['campaigns']['Row']
export type DealRow            = Database['public']['Tables']['deals']['Row']

// ─── Enriched types used in the UI ───────────────────────────────────────────
export interface CreatorWithUser extends CreatorProfileRow {
  users: Pick<UserRow, 'name' | 'avatar_url' | 'email' | 'phone'>
}

export interface BookingWithParties extends BookingRow {
  creator: Pick<UserRow, 'id' | 'name' | 'avatar_url'>
  consumer: Pick<UserRow, 'id' | 'name' | 'avatar_url'>
  service?: Pick<ServiceRow, 'name' | 'price' | 'duration'>
}
