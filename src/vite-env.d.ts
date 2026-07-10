/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_AUTH_REDIRECT_URL: string
  readonly VITE_RAZORPAY_KEY_ID?: string
  readonly VITE_FCM_VAPID_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
