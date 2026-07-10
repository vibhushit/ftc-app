import { useEffect } from 'react'
import { supabase, supabaseAvailable } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { AuthChangeEvent } from '@supabase/supabase-js'

/**
 * AuthProvider — runs once at the app root.
 * Listens to Supabase auth state and syncs it into the Zustand store.
 * In demo mode (no env vars) it's a no-op.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppStore(s => s.dispatch)

  useEffect(() => {
    if (!supabaseAvailable) return
    let mounted = true

    // ── Check existing session on mount (returning user) ──────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || !session?.user) return
      syncUser(session.user.id, session.user, true)
    })

    // ── Subscribe to future auth events ───────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (!mounted) return
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session?.user) {
        const currentScreen = useAppStore.getState().screen
        const fromMagicLink = currentScreen === 'magicLinkSent' || currentScreen === 'welcome' || currentScreen === 'phone'
        syncUser(session.user.id, session.user, false, fromMagicLink)
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'RESET' })
      }
      // TOKEN_REFRESHED — silent, no UI change needed
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }

    async function syncUser(
      userId: string,
      authUser: { email?: string | null; phone?: string | null; user_metadata?: Record<string, string> },
      navigateHome: boolean,
      navigateToRole = false,
    ) {
      const { data: profile } = await supabase
        .from('users')
        .select('name, email, phone, role, city')
        .eq('id', userId)
        .single()

      const name = (profile?.name && profile.name !== 'User' ? profile.name : null)
        ?? authUser.user_metadata?.full_name
        ?? authUser.user_metadata?.name
        ?? (authUser.email ? authUser.email.split('@')[0] : '')
        ?? 'User'

      dispatch({
        type:      'SYNC_AUTH_USER',
        userId,
        name,
        phone:     profile?.phone ?? authUser.phone    ?? undefined,
        email:     profile?.email ?? authUser.email    ?? undefined,
        isCreator: profile?.role === 'creator' || profile?.role === 'both',
      })

      // Returning user with an existing profile → go straight to home
      if (navigateHome && profile) {
        dispatch({
          type:      'COMPLETE_AUTH',
          isCreator: profile.role === 'creator' || profile.role === 'both',
          name,
          city:      profile.city   ?? undefined,
          phone:     profile.phone  ?? authUser.phone  ?? undefined,
          email:     profile.email  ?? authUser.email  ?? undefined,
        })
      } else if (navigateToRole) {
        // New sign-in via magic link — navigate to role selection
        dispatch({ type: 'GO', screen: 'role' })
      }
    }
  }, [dispatch])

  return <>{children}</>
}
