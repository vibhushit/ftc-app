import { useState, useEffect, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import * as authApi from '@/lib/api/auth'
import type { UserRow } from '@/lib/database.types'

export interface AuthState {
  session:  Session | null
  user:     User    | null
  profile:  UserRow | null
  loading:  boolean
  isAuthed: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session:  null,
    user:     null,
    profile:  null,
    loading:  true,
    isAuthed: false,
  })

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    async function init() {
      const session = await authApi.getSession()
      if (!mounted) return

      if (session?.user) {
        const profile = await authApi.getMyProfile().catch(() => null)
        setState({ session, user: session.user, profile, loading: false, isAuthed: true })
      } else {
        setState(s => ({ ...s, loading: false }))
      }
    }

    init()

    // Subscribe to auth events
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'SIGNED_IN' && session) {
        const profile = await authApi.getMyProfile().catch(() => null)
        setState({ session, user: session.user, profile, loading: false, isAuthed: true })
      } else if (event === 'SIGNED_OUT') {
        setState({ session: null, user: null, profile: null, loading: false, isAuthed: false })
      } else if (event === 'TOKEN_REFRESHED' && session) {
        setState(s => ({ ...s, session }))
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendOtp = useCallback(async (phone: string) => {
    return authApi.sendOtp(phone)
  }, [])

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    return authApi.verifyOtp(phone, token)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    return authApi.signInWithGoogle()
  }, [])

  const signOut = useCallback(async () => {
    await authApi.signOut()
  }, [])

  const updateProfile = useCallback(async (patch: Partial<UserRow>) => {
    const updated = await authApi.updateMyProfile(patch)
    setState(s => ({ ...s, profile: updated }))
    return updated
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.getMyProfile()
    setState(s => ({ ...s, profile }))
    return profile
  }, [])

  return {
    ...state,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  }
}

// ─── Convenience: subscribe to auth changes in a component ───────────────────
export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return user
}
