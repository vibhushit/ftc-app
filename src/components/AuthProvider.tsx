import { useEffect } from 'react'
import { supabase, supabaseAvailable } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { AuthChangeEvent } from '@supabase/supabase-js'

/**
 * AuthProvider — runs once at the app root.
 * Listens to Supabase auth state and syncs it into the Zustand store.
 * Properly manages password recovery navigation vs standard sign-in.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppStore(s => s.dispatch)

  useEffect(() => {
    if (!supabaseAvailable) return
    let mounted = true

    // ── Check if URL hash indicates a password recovery session ──────────
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash
      if (hash.includes('type=recovery') || hash.includes('#reset')) {
        dispatch({ type: 'GO', screen: 'resetPassword' })
      }
    }

    // ── Check existing session on mount (returning user) ──────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || !session?.user) return
      
      const currentScreen = useAppStore.getState().screen
      if (currentScreen === 'resetPassword') return
      
      syncUser(session.user.id, session.user)
    })

    // ── Subscribe to future auth events ───────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY') {
        // User clicked recovery link in email -> direct to set new password screen
        dispatch({ type: 'GO', screen: 'resetPassword' })
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const currentScreen = useAppStore.getState().screen
        if (currentScreen === 'resetPassword') return
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
      const { data: profile } = await supabase
        .from('users')
        .select('name, email, phone, role, city')
        .eq('id', userId)
        .single()

      const hasCustomName = profile?.name && profile.name.trim() !== '' && profile.name !== 'User'
      const name = hasCustomName
        ? profile!.name
        : authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? ''

      const isCreator = profile?.role === 'creator' || profile?.role === 'both'
      const hasCompletedOnboarding = hasCustomName || profile?.city || profile?.role === 'creator'

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
