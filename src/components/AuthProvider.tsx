import { useEffect } from 'react'
import { supabase, supabaseAvailable } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/database.types'

interface UserProfileRecord {
  name: string
  email: string | null
  phone: string | null
  role: UserRole
  city: string
}

/**
 * AuthProvider — runs once at the app root.
 * Listens to Supabase auth state and syncs it into the Zustand store.
 * Properly locks password recovery navigation and prevents unauthenticated redirects.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppStore(s => s.dispatch)

  useEffect(() => {
    if (!supabaseAvailable) return
    let mounted = true

    const rawHash = typeof window !== 'undefined' ? window.location.hash : ''
    const rawSearch = typeof window !== 'undefined' ? window.location.search : ''
    const searchParams = new URLSearchParams(rawSearch)
    const code = searchParams.get('code')

    const isRecoveryHash = rawHash.includes('type=recovery') ||
      rawHash.includes('#reset') ||
      rawHash.includes('type=signup') ||
      rawHash.includes('type=magiclink') ||
      rawHash.includes('type=invite') ||
      (rawHash.includes('access_token=') && !rawHash.includes('error=')) ||
      Boolean(code)

    const isLinkExpired = rawHash.includes('error=') ||
      rawHash.includes('error_code=otp_expired') ||
      rawSearch.includes('error=')

    // ── 1. Check if URL hash/search indicates an expired link ────────────────
    if (isLinkExpired) {
      console.warn('[FTC] Email auth link expired or invalid.')
      dispatch({ type: 'GO', screen: 'forgotPassword' })
    } else if (isRecoveryHash) {
      dispatch({ type: 'GO', screen: 'resetPassword' })
    }

    // ── 2. Explicitly Exchange PKCE code or Set Session from Hash ────────────
    async function processIncomingAuthTokens() {
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error && data.session) {
            dispatch({ type: 'GO', screen: 'resetPassword' })
            return
          }
        } catch (e) {
          console.warn('[FTC] PKCE code exchange error:', e)
        }
      }

      if (rawHash.includes('access_token=') && rawHash.includes('refresh_token=')) {
        try {
          const hashParams = new URLSearchParams(rawHash.replace(/^#/, ''))
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')
          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (!error && data.session) {
              dispatch({ type: 'GO', screen: 'resetPassword' })
              return
            }
          }
        } catch (e) {
          console.warn('[FTC] Direct hash setSession error:', e)
        }
      }
    }

    processIncomingAuthTokens()

    // ── 3. Check existing session on mount (returning user) ──────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (!session?.user) {
        // Unauthenticated visitor -> stay on welcome/auth
        const cur = useAppStore.getState().screen
        const isAuthScreen = ['welcome', 'signup', 'login', 'phone', 'otp', 'magicLinkSent', 'forgotPassword', 'resetPassword'].includes(cur)
        if (!isAuthScreen && !isRecoveryHash) {
          // If session expired or unauthenticated trying to access internal screen
          dispatch({ type: 'RESET' })
        }
        return
      }

      const currentScreen = useAppStore.getState().screen
      if (currentScreen === 'resetPassword' || isRecoveryHash) {
        // Recovery/Password setup in progress — don't auto-redirect to home
        return
      }

      syncUser(session.user.id, session.user)
    })

    // ── 4. Subscribe to future auth events ───────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked recovery link in email -> direct strictly to set new password screen
        dispatch({ type: 'GO', screen: 'resetPassword' })
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const currentScreen = useAppStore.getState().screen
        if (currentScreen === 'resetPassword' || isRecoveryHash) {
          return
        }
        syncUser(session.user.id, session.user)
      } else if (event === 'SIGNED_OUT') {
        try { localStorage.removeItem('ftc_saved_session') } catch {}
        dispatch({ type: 'RESET' })
      }
    })

    // ── 4. Cross-tab storage synchronization ─────────────────────────────────
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ftc_saved_session' && !e.newValue) {
        // Another tab logged out or cleared session
        dispatch({ type: 'RESET' })
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }

    async function syncUser(
      userId: string,
      authUser: { email?: string | null; phone?: string | null; user_metadata?: Record<string, string> }
    ) {
      const { data: userRow } = await supabase
        .from('users')
        .select('name, email, phone, role, city')
        .eq('id', userId)
        .maybeSingle()

      const profile = userRow as UserProfileRecord | null

      const hasCustomName = Boolean(profile?.name && profile.name.trim() !== '' && profile.name !== 'User')
      const name = hasCustomName
        ? (profile?.name || '')
        : authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? ''

      // Check if user has an established creator profile
      const { data: creatorProfile } = await supabase
        .from('creator_profiles')
        .select('id, is_published')
        .eq('id', userId)
        .maybeSingle()

      const isCreator = profile?.role === 'creator' || profile?.role === 'both' || Boolean(creatorProfile)

      // Only mark onboarding complete if creator profile exists or consumer has finished preferences (city)
      const hasCompletedOnboarding = isCreator
        ? Boolean(creatorProfile)
        : (profile?.role === 'consumer' && Boolean(profile?.city))

      dispatch({
        type: 'SYNC_AUTH_USER',
        userId,
        name: name || (authUser.email ? authUser.email.split('@')[0] : 'User'),
        phone: profile?.phone ?? authUser.phone ?? undefined,
        email: profile?.email ?? authUser.email ?? undefined,
        isCreator,
      })

      // If returning user with established profile
      if (hasCompletedOnboarding) {
        dispatch({
          type: 'COMPLETE_AUTH',
          isCreator,
          name: name || 'User',
          city: profile?.city ?? undefined,
          phone: profile?.phone ?? authUser.phone ?? undefined,
          email: profile?.email ?? authUser.email ?? undefined,
        })
      } else {
        // Brand new user -> navigate to role selection
        dispatch({ type: 'GO', screen: 'role' })
      }
    }
  }, [dispatch])

  return <>{children}</>
}
