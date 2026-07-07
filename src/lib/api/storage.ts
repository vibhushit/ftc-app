import { supabase } from '../supabase'

type Bucket = 'avatars' | 'portfolio' | 'campaigns' | 'id-docs' | 'signatures'

// ─── Upload file ──────────────────────────────────────────────────────────────
export async function uploadFile(bucket: Bucket, path: string, file: File | Blob, contentType?: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType ?? file instanceof File ? file.type : 'application/octet-stream',
      upsert: true,
    })

  if (error) throw error
  return data.path
}

// ─── Get public URL ───────────────────────────────────────────────────────────
export function getPublicUrl(bucket: 'avatars' | 'portfolio' | 'campaigns', path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ─── Get signed URL (private buckets) ────────────────────────────────────────
export async function getSignedUrl(bucket: 'id-docs' | 'signatures', path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

// ─── Upload avatar ────────────────────────────────────────────────────────────
export async function uploadAvatar(userId: string, file: File) {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/avatar.${ext}`
  await uploadFile('avatars', path, file)
  const url = getPublicUrl('avatars', path)

  // Update user record
  await supabase.from('users').update({ avatar_url: url }).eq('id', userId)
  return url
}

// ─── Upload portfolio item ────────────────────────────────────────────────────
export async function uploadPortfolioItem(userId: string, file: File) {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  await uploadFile('portfolio', path, file)
  return getPublicUrl('portfolio', path)
}

// ─── Upload ID document ───────────────────────────────────────────────────────
export async function uploadIdDoc(userId: string, docType: 'aadhaar' | 'pan' | 'selfie', file: File) {
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${docType}.${ext}`
  await uploadFile('id-docs', path, file)
  return path
}

// ─── Upload deal signature ────────────────────────────────────────────────────
export async function uploadSignature(userId: string, dealId: string, dataUrl: string) {
  const blob = dataUrlToBlob(dataUrl)
  const path = `${userId}/${dealId}/sig.png`
  await uploadFile('signatures', path, blob, 'image/png')
  return await getSignedUrl('signatures', path, 86400)
}

// ─── Delete file ─────────────────────────────────────────────────────────────
export async function deleteFile(bucket: Bucket, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/png'
  const bin  = atob(b64)
  const arr  = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
