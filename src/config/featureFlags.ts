// ─── FTC Feature Flags Configuration ─────────────────────────────────────────
// Enables turning individual features ON/OFF for production deployments,
// staging environments, and incremental feature rollouts.
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureFlags {
  useLiveSupabase: boolean
  enablePhoneAuth: boolean
  enableRazorpay: boolean
  enableRealtimeChat: boolean
  enableSponsorships: boolean
  enablePayouts: boolean
  enableKycVerification: boolean
}

const getEnvFlag = (key: string, defaultValue: boolean = false): boolean => {
  const val = import.meta.env[key]
  if (val === undefined || val === '') return defaultValue
  return val === 'true' || val === '1'
}

// Inspect localStorage overrides if present (useful for QA/dev testing)
const getLocalStorageOverride = (key: string): boolean | null => {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(`ftc_flag_${key}`)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return null
}

export const FEATURE_FLAGS: FeatureFlags = {
  useLiveSupabase:
    getLocalStorageOverride('useLiveSupabase') ??
    !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),

  enablePhoneAuth:
    getLocalStorageOverride('enablePhoneAuth') ??
    getEnvFlag('VITE_FEATURE_PHONE_AUTH', false),

  enableRazorpay:
    getLocalStorageOverride('enableRazorpay') ??
    getEnvFlag('VITE_FEATURE_PAYMENTS', false),

  enableRealtimeChat:
    getLocalStorageOverride('enableRealtimeChat') ??
    getEnvFlag('VITE_FEATURE_REALTIME_CHAT', false),

  enableSponsorships:
    getLocalStorageOverride('enableSponsorships') ??
    getEnvFlag('VITE_FEATURE_SPONSORSHIPS', false),

  enablePayouts:
    getLocalStorageOverride('enablePayouts') ??
    getEnvFlag('VITE_FEATURE_PAYOUTS', false),

  enableKycVerification:
    getLocalStorageOverride('enableKycVerification') ??
    getEnvFlag('VITE_FEATURE_KYC', false),
}

/**
 * Utility function to programmatically check a feature flag.
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flagName] ?? false
}

/**
 * Utility to override a feature flag locally in the browser (for testing).
 */
export function setFeatureFlagOverride(flagName: keyof FeatureFlags, enabled: boolean | null): void {
  if (typeof window === 'undefined') return
  if (enabled === null) {
    localStorage.removeItem(`ftc_flag_${flagName}`)
  } else {
    localStorage.setItem(`ftc_flag_${flagName}`, String(enabled))
  }
  window.location.reload()
}
