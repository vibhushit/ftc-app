import { supabase } from '../supabase'

// ─── Create Razorpay order via Edge Function ──────────────────────────────────
export async function createPaymentOrder(bookingId: string, amountRupees: number, paymentType: 'advance' | 'balance') {
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: {
      action:       'create_order',
      booking_id:   bookingId,
      amount_paise: amountRupees * 100,
      payment_type: paymentType,
    },
  })
  if (error) throw error
  return data as { order: RazorpayOrder; payment_id: string }
}

// ─── Verify & capture payment ─────────────────────────────────────────────────
export async function verifyPayment(params: {
  payment_id:          string
  razorpay_order_id:   string
  razorpay_payment_id: string
  razorpay_signature:  string
}) {
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: { action: 'verify_payment', ...params },
  })
  if (error) throw error
  return data as { success: boolean }
}

// ─── Release escrow (consumer approves delivery) ──────────────────────────────
export async function releaseEscrow(bookingId: string) {
  const { data, error } = await supabase.functions.invoke('process-payment', {
    body: { action: 'release_escrow', booking_id: bookingId },
  })
  if (error) throw error
  return data as { success: boolean }
}

// ─── Payments for a booking ───────────────────────────────────────────────────
export async function getPaymentsForBooking(bookingId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at')
  if (error) throw error
  return data
}

// ─── Transaction history ──────────────────────────────────────────────────────
export async function getMyTransactions(limit = 20, offset = 0) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

// ─── Razorpay SDK helper ──────────────────────────────────────────────────────
// Opens the Razorpay checkout modal (web) using dynamically loaded script
export async function openRazorpayCheckout(params: {
  order:       RazorpayOrder
  amount:      number           // ₹ (not paise)
  name:        string
  description: string
  onSuccess:   (response: RazorpayResponse) => void
  onFailure:   (error: unknown) => void
}) {
  await loadRazorpayScript()

  const key = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!key) throw new Error('VITE_RAZORPAY_KEY_ID not set')

  const options = {
    key,
    amount:      params.amount * 100,
    currency:    'INR',
    order_id:    params.order.id,
    name:        'Find To Connect',
    description: params.description,
    theme:       { color: '#6B5CFF' },
    handler:     params.onSuccess,
  }

  const rzp = new (window as unknown as RazorpayWindow).Razorpay(options)
  rzp.on('payment.failed', params.onFailure)
  rzp.open()
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as RazorpayWindow).Razorpay) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RazorpayOrder {
  id:       string
  amount:   number
  currency: string
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id:   string
  razorpay_signature:  string
}

interface RazorpayWindow extends Window {
  Razorpay: new (opts: Record<string, unknown>) => { on: (ev: string, cb: (e: unknown) => void) => void; open: () => void }
}
