import { supabase } from '../supabase'
import type { UserRow } from '../database.types'

// ─── Phone / OTP ─────────────────────────────────────────────────────────────
export async function sendOtp(phone: string) {
  const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/^0/, '')}`
  const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
  if (error) throw error
  return formatted
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: import.meta.env.VITE_AUTH_REDIRECT_URL,
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
    .single()

  if (error) throw error
  return data
}

// ─── Update user profile ─────────────────────────────────────────────────────
export async function updateMyProfile(patch: Partial<UserRow>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ─── Subscribe to auth state changes ─────────────────────────────────────────
export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  return supabase.auth.onAuthStateChange(callback)
}

// ─── Save FCM token for push notifications ───────────────────────────────────
export async function saveFcmToken(token: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('users').update({ fcm_token: token }).eq('id', user.id)
}

// ─── Set user role (consumer or creator) after role selection screen ─────────
export async function setUserRole(role: 'consumer' | 'creator') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', user.id)
  if (error) throw error

  if (role === 'creator') {
    const handle = `user_${user.id.replace(/-/g, '').slice(0, 8)}`
    const { error: cpError } = await supabase
      .from('creator_profiles')
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

export async function signUpWithPassword(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name || '',
      },
    },
  })
  if (error) throw error
  return data
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/#reset` : undefined,
  })
  if (error) throw error
  return true
}

