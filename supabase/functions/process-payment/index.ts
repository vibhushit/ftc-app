// ─── FTC Edge Function: process-payment ──────────────────────────────────────
// Handles Razorpay order creation, verification, and escrow booking.
// Called by the client after choosing a payment method.
// Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
// ─────────────────────────────────────────────────────────────────────────────
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.208.0/crypto/mod.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Auth: verify JWT
    const authHeader = req.headers.get('Authorization') ?? ''
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json()
    const { action } = body

    // ── CREATE ORDER ──────────────────────────────────────────────────────────
    if (action === 'create_order') {
      const { booking_id, amount_paise, currency = 'INR', payment_type } = body

      // Validate booking belongs to caller
      const { data: booking, error: bErr } = await supabase
        .from('bookings')
        .select('id, consumer_id, total_price, advance_amount')
        .eq('id', booking_id)
        .single()

      if (bErr || !booking) return json({ error: 'Booking not found' }, 404)
      if (booking.consumer_id !== user.id) return json({ error: 'Forbidden' }, 403)

      // Create Razorpay order
      const rzpOrder = await razorpayRequest('POST', '/orders', {
        amount: amount_paise,
        currency,
        receipt: booking_id,
        notes: { booking_id, payment_type, user_id: user.id },
      })

      // Insert pending payment record
      const { data: payment, error: pErr } = await supabase
        .from('payments')
        .insert({
          booking_id,
          type: payment_type ?? 'advance',
          amount: Math.round(amount_paise / 100),
          status: 'pending',
          gateway_ref: rzpOrder.id,
          gateway_data: rzpOrder,
        })
        .select('id')
        .single()

      if (pErr) throw pErr

      return json({ order: rzpOrder, payment_id: payment.id })
    }

    // ── VERIFY & CAPTURE ──────────────────────────────────────────────────────
    if (action === 'verify_payment') {
      const { payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

      // Verify signature
      const msg  = razorpay_order_id + '|' + razorpay_payment_id
      const valid = await verifyHmac(msg, Deno.env.get('RAZORPAY_KEY_SECRET')!, razorpay_signature)
      if (!valid) return json({ error: 'Invalid signature' }, 400)

      // Fetch payment row to get booking_id
      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id, amount, type')
        .eq('id', payment_id)
        .single()

      if (!payment) return json({ error: 'Payment not found' }, 404)

      // Move payment to escrow
      await supabase.from('payments').update({
        status:      'escrow',
        gateway_ref: razorpay_payment_id,
        processed_at: new Date().toISOString(),
      }).eq('id', payment_id)

      // Advance → update booking to confirmed
      if (payment.type === 'advance') {
        await supabase.from('bookings').update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        }).eq('id', payment.booking_id)

        // Log transaction
        const { data: booking } = await supabase
          .from('bookings')
          .select('consumer_id, creator_id')
          .eq('id', payment.booking_id)
          .single()

        if (booking) {
          await supabase.from('transactions').insert({
            booking_id:   payment.booking_id,
            payment_id,
            type:         'escrow_hold',
            amount:       payment.amount,
            from_user_id: booking.consumer_id,
            description:  'Advance payment held in escrow',
          })
        }
      }

      return json({ success: true })
    }

    // ── RELEASE ESCROW ────────────────────────────────────────────────────────
    if (action === 'release_escrow') {
      const { booking_id } = body

      // Only creator can trigger release (or auto-release after 7d — via pg_cron)
      const { data: booking } = await supabase
        .from('bookings')
        .select('creator_id, consumer_id, balance_amount, status')
        .eq('id', booking_id)
        .single()

      if (!booking) return json({ error: 'Not found' }, 404)
      if (booking.consumer_id !== user.id && booking.creator_id !== user.id)
        return json({ error: 'Forbidden' }, 403)

      // Release all escrow payments for this booking
      await supabase.from('payments')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('booking_id', booking_id)
        .eq('status', 'escrow')

      // Mark booking complete
      await supabase.from('bookings').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', booking_id)

      // Payout transaction log
      await supabase.from('transactions').insert({
        booking_id,
        type:       'payout',
        amount:     booking.balance_amount,
        to_user_id: booking.creator_id,
        description: 'Escrow released to creator',
      })

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (err) {
    console.error('[process-payment]', err)
    return json({ error: 'Internal error' }, 500)
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
    status,
  })
}

async function razorpayRequest(method: string, path: string, body?: unknown) {
  const key   = Deno.env.get('RAZORPAY_KEY_ID')!
  const secret = Deno.env.get('RAZORPAY_KEY_SECRET')!
  const auth  = btoa(`${key}:${secret}`)
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`Razorpay error: ${await res.text()}`)
  return res.json()
}

async function verifyHmac(message: string, secret: string, signature: string) {
  const key  = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const sig  = hexToUint8(signature)
  const data = new TextEncoder().encode(message)
  return crypto.subtle.verify('HMAC', key, sig, data)
}

function hexToUint8(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return bytes
}
