// ─── FTC Edge Function: send-notification ────────────────────────────────────
// Sends FCM push + inserts DB notification row.
// Called internally by DB triggers OR directly by the app.
// Secret: FCM_SERVER_KEY
// ─────────────────────────────────────────────────────────────────────────────
// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotifPayload {
  user_id:      string
  type:         string
  title:        string
  body:         string
  action_screen?: string
  action_data?:  Record<string, unknown>
  is_urgent?:   boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const payload: NotifPayload | NotifPayload[] = await req.json()
    const items = Array.isArray(payload) ? payload : [payload]

    const results = await Promise.allSettled(
      items.map(item => sendOne(supabase, item))
    )

    return new Response(JSON.stringify({ results }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-notification]', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

async function sendOne(supabase: any, item: NotifPayload) {
  // 1. Insert DB notification
  const { error: dbErr } = await supabase.from('notifications').insert({
    user_id:       item.user_id,
    type:          item.type,
    title:         item.title,
    body:          item.body,
    action_screen: item.action_screen,
    action_data:   item.action_data,
    is_urgent:     item.is_urgent ?? false,
  })
  if (dbErr) console.warn('[send-notification] db insert failed', dbErr)

  // 2. Fetch FCM token
  const { data: user } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', item.user_id)
    .single()

  if (!user?.fcm_token) return { db: 'ok', push: 'no_token' }

  // 3. Send FCM v1 push
  const fcmKey = Deno.env.get('FCM_SERVER_KEY')
  if (!fcmKey) return { db: 'ok', push: 'no_key' }

  const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${fcmKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: user.fcm_token,
      notification: { title: item.title, body: item.body },
      data: {
        action_screen: item.action_screen ?? '',
        action_data:   JSON.stringify(item.action_data ?? {}),
      },
      priority: item.is_urgent ? 'high' : 'normal',
    }),
  })

  const fcmResult = await fcmRes.json()
  return { db: 'ok', push: fcmResult }
}
