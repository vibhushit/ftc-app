import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/appStore'
import type { UserRow, UserRole } from '@/lib/database.types'

// ─── Check if Email is Already Registered ────────────────────────────────────
export async function checkEmailExists(email: string): Promise<boolean> {
  const clean = email.trim().toLowerCase()
  if (!clean) return false

  try {
    // 1. Primary: Use dedicated RPC function that safely queries auth.users
    const { data, error } = await (supabase.rpc as any)('check_email_exists', { lookup_email: clean })
    if (!error && typeof data === 'boolean') {
      return data
    }
  } catch {
    // Fallback below
  }

  try {
    // 2. Fallback: Query public.users table
    const { data } = await (supabase.from('users') as any)
      .select('id')
      .eq('email', clean)
      .maybeSingle()

    return !!data
  } catch {
    return false
  }
}

// ─── Phone / OTP ─────────────────────────────────────────────────────────────
export async function sendOtp(phone: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`
  const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
  if (error) throw error
  return formatted
}

// ─── 6-Digit Email OTP Service Layer ──────────────────────────────────────────

/**
 * Sends a 6-digit Email OTP for user Sign-In.
 * Strictly forbids auto-creating users so unknown emails cannot create empty accounts.
 */
export async function sendEmailSignInOtp(email: string) {
  const clean = email.trim().toLowerCase()
  if (!clean) throw new Error('Email is required.')

  const { data, error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('signups not allowed') || msg.includes('user not found') || msg.includes('not found')) {
      throw new Error('No account found with this email. Please sign up first.')
    }
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
      throw new Error('Too many attempts. Please wait a minute before requesting another code.')
    }
    throw error
  }

  return data
}

/**
 * Sends a 6-digit Email OTP for user Sign-Up.
 * Verifies email uniqueness and embeds name metadata directly into the auth user.
 */
export async function sendEmailSignUpOtp(email: string, name?: string) {
  const clean = email.trim().toLowerCase()
  if (!clean) throw new Error('Email is required.')

  // Proactively check if email already exists
  const exists = await checkEmailExists(clean)
  if (exists) {
    throw new Error('This email is already registered. Please sign in instead.')
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: {
      shouldCreateUser: true,
      data: {
        full_name: name?.trim() || '',
        name: name?.trim() || '',
      },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already')) {
      throw new Error('This email is already registered. Please sign in instead.')
    }
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
      throw new Error('Too many attempts. Please wait a minute before requesting another code.')
    }
    throw error
  }

  return data
}

/**
 * Verifies 6-digit Email OTP for authentication (Sign-In or Sign-Up).
 */
export async function verifyEmailOtp(email: string, token: string) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanToken = token.trim()

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email',
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token has expired')) {
      throw new Error('Invalid or expired 6-digit code. Please check your code or request a new one.')
    }
    throw error
  }

  return data
}

/**
 * Sends a 6-digit password recovery code to the user's email.
 */
export async function sendPasswordRecoveryOtp(email: string) {
  const clean = email.trim().toLowerCase()
  if (!clean) throw new Error('Email is required.')

  const { data, error } = await supabase.auth.resetPasswordForEmail(clean)
  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('rate limit') || msg.includes('too many') || msg.includes('over_email_send_rate_limit')) {
      throw new Error('Too many attempts. Please wait a minute before requesting another code.')
    }
    throw error
  }

  return data
}

/**
 * Verifies a 6-digit password recovery code.
 */
export async function verifyRecoveryOtp(email: string, token: string) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanToken = token.trim()

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'recovery',
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('expired') || msg.includes('invalid') || msg.includes('token has expired')) {
      throw new Error('Invalid or expired recovery code. Please check your code or request a new one.')
    }
    throw error
  }

  return data
}

/**
 * Global sign-out that revokes all sessions across all logged-in devices in PostgreSQL,
 * and sweeps the local client storage.
 */
export async function signOutGlobal() {
  try {
    await supabase.auth.signOut({ scope: 'global' })
  } catch (e) {
    console.warn('[FTC] Global remote signOut failed, falling back to local sweep:', e)
  }
  await signOutCleanly()
}

// ─── Email OTP (works without SMS provider) ───────────────────────────────────
export async function sendEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email })
  if (error) throw error
  return email
}

export async function verifyOtp(identifier: string, token: string, type: 'sms' | 'email' = 'sms') {
  const payload = type === 'email'
    ? { email: identifier, token, type: 'email' as const }
    : { phone: identifier, token, type: 'sms' as const }
  const { data, error } = await supabase.auth.verifyOtp(payload)
  if (error) throw error
  return data
}

// ─── Google OAuth ────────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  const redirectUrl = (typeof window !== 'undefined' ? window.location.origin : '') || (import.meta as any)?.env?.VITE_AUTH_REDIRECT_URL
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })
  if (error) throw error
  return data
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Resilient sign-out that guarantees complete client-side session destruction.
 * Purges all Supabase tokens and FTC storage keys locally, even if the remote auth server
 * rejects the request (e.g. user was deleted in the backend database or network offline).
 */
export async function signOutCleanly() {
  try {
    // Use local scope so local tokens are cleared even if remote revocation fails
    await supabase.auth.signOut({ scope: 'local' })
  } catch (e) {
    console.warn('[FTC] Remote signOut failed, falling back to local sweep:', e)
  }

  // Sweep all ftc_* and sb-* keys from localStorage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('ftc_') || key.startsWith('sb-'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch {}

    // Reset browser address bar to clean root path
    try {
      window.history.replaceState(null, '', window.location.pathname)
    } catch {}
  }

  // Reset store to pristine unauthenticated state
  useAppStore.getState().dispatch({ type: 'RESET' })
}

// ─── Get current session ─────────────────────────────────────────────────────
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

// ─── Get current user profile ────────────────────────────────────────────────
export async function getMyProfile(): Promise<UserRow | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data as UserRow | null
}

// ─── Update user profile ─────────────────────────────────────────────────────
export async function updateMyProfile(patch: Partial<UserRow>): Promise<UserRow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase.from('users') as any)
    .update(patch)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as UserRow
}

// ─── Subscribe to auth state changes ─────────────────────────────────────────
export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback)
}

// ─── Save FCM token for push notifications ───────────────────────────────────
export async function saveFcmToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await (supabase.from('users') as any).update({ fcm_token: token }).eq('id', user.id)
}

// ─── Set user role (consumer, creator, or both) ──────────────────────────────
export async function setUserRole(role: UserRole) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check current user profile to cleanly upgrade to 'both' if applicable
  const { data: currentUser } = await (supabase.from('users') as any)
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  let finalRole: UserRole = role
  if (currentUser?.role === 'consumer' && role === 'creator') {
    finalRole = 'both'
  } else if (currentUser?.role === 'creator' && role === 'consumer') {
    finalRole = 'both'
  }

  const { error } = await (supabase.from('users') as any)
    .update({ role: finalRole })
    .eq('id', user.id)
  if (error) throw error

  if (role === 'creator' || finalRole === 'creator' || finalRole === 'both') {
    const handle = `user_${user.id.replace(/-/g, '').slice(0, 8)}`
    const { error: cpError } = await (supabase.from('creator_profiles') as any)
      .upsert({ id: user.id, handle }, { onConflict: 'id', ignoreDuplicates: true })
    if (cpError) throw cpError
  }
}

// ─── Email & Password Authentication ─────────────────────────────────────────
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function sendSignUpVerificationLink(email: string, name?: string) {
  const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined
  
  // Use signUp with initial token to check duplicates and send activation link
  const { data, error } = await supabase.auth.signUp({
    email,
    password: `FTC_Initial_${Math.random().toString(36).slice(2)}!2026`,
    options: {
      data: {
        full_name: name || '',
      },
      emailRedirectTo: redirectUrl,
    },
  })

  if (error) {
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists') ||
      error.message.toLowerCase().includes('user already')
    ) {
      throw new Error('This email is already registered. Please sign in instead.')
    }
    throw error
  }

  // If email confirmation is enabled and user already exists, Supabase returns empty identities
  if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
    throw new Error('This email is already registered. Please sign in instead.')
  }

  return data
}

export async function signUpWithPassword(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name || '',
      },
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  })
  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
  })
  if (error) throw error
  return true
}

export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) throw error
  return data
}

export const verifyPasswordResetOtp = verifyRecoveryOtp
