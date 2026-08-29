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

    const isRecoveryHash = typeof window !== 'undefined' && !!window.location.hash && (
      window.location.hash.includes('type=recovery') || window.location.hash.includes('#reset')
    )

    // ── 1. Check if URL hash indicates a password recovery session ──────────
    if (isRecoveryHash) {
      dispatch({ type: 'GO', screen: 'resetPassword' })
    }

    // ── 2. Check existing session on mount (returning user) ──────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (!session?.user) {
        // Unauthenticated visitor -> stay on welcome/auth
        const cur = useAppStore.getState().screen
        const isAuthScreen = ['welcome', 'signup', 'login', 'phone', 'otp', 'magicLinkSent', 'forgotPassword', 'resetPassword'].includes(cur)
        if (!isAuthScreen) {
          // If session expired or unauthenticated trying to access internal screen
          dispatch({ type: 'RESET' })
        }
        return
      }

      const currentScreen = useAppStore.getState().screen
      if (currentScreen === 'resetPassword' || isRecoveryHash) {
        // Recovery in progress — don't auto-redirect to home
        return
      }

      syncUser(session.user.id, session.user)
    })

    // ── 3. Subscribe to future auth events ───────────────────────────────────
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
        dispatch({ type: 'RESET' })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }

    async function syncUser(
      userId: string,
      authUser: { email?: string | null; phone?: string | null; user_metadata?: Record<string, string> }
    ) {
      const { data } = await supabase
        .from('users')
        .select('name, email, phone, role, city')
        .eq('id', userId)
        .maybeSingle()

      const profile = data as UserProfileRecord | null

      const hasCustomName = Boolean(profile?.name && profile.name.trim() !== '' && profile.name !== 'User')
      const name = hasCustomName
        ? (profile?.name || '')
        : authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? ''

      const isCreator = profile?.role === 'creator' || profile?.role === 'both'
      const hasCompletedOnboarding = hasCustomName || Boolean(profile?.city) || profile?.role === 'creator'

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
