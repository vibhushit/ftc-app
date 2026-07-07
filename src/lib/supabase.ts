import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || ''
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// True only when real env vars are present — callers can guard against demo mode
export const supabaseAvailable = !!(supabaseUrl && supabaseAnon)

if (!supabaseAvailable) {
  console.warn(
    '[FTC] Supabase env vars not found — running in demo mode (offline).\n' +
    'Copy .env.example → .env.local and add your project values to enable auth.'
  )
}

// Create client even in demo mode (requests will fail gracefully, app won't crash)
export const supabase = createClient<Database>(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnon || 'placeholder-anon-key',
  {
  auth: {
    autoRefreshToken: true,
    persistSession:   true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
  global: {
    headers: { 'x-app-name': 'ftc-client' },
  },
})

export type { Database }
