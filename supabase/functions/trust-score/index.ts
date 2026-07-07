// ─── FTC Edge Function: trust-score ──────────────────────────────────────────
// Recalculates & updates trust score for a user.
// Called after: review submitted, booking completed, ID verified.
// ─────────────────────────────────────────────────────────────────────────────
// deno-lint-ignore-file no-explicit-any
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { user_id } = await req.json()
    if (!user_id) return json({ error: 'user_id required' }, 400)

    // Call the DB function that does the actual calculation
    const { data, error } = await supabase.rpc('recalculate_trust_score', { p_user_id: user_id })
    if (error) throw error

    // Optionally notify the user of a score increase
    const newScore = data as number
    if (newScore > 0) {
      await supabase.from('notifications').insert({
        user_id,
        type:  'trust',
        title: 'Trust score updated',
        body:  `Your trust score is now ${newScore}. Keep completing bookings to grow it.`,
        action_screen: 'onboardKyc',
        action_data: { score: newScore },
      })
    }

    return json({ score: newScore })
  } catch (err) {
    console.error('[trust-score]', err)
    return json({ error: 'Internal error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
    status,
  })
}
