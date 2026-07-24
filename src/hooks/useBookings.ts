import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as bookingsApi from '@/lib/api/bookings'
import * as paymentsApi from '@/lib/api/payments'
import type { BookingRow, BookingWithParties } from '@/lib/database.types'

const BOOKING_KEYS = {
  mine:   ['bookings', 'mine'] as const,
  jobs:   ['bookings', 'jobs'] as const,
  detail: (id: string) => ['bookings', 'detail', id] as const,
}

// ─── My bookings (consumer) ───────────────────────────────────────────────────
export function useMyBookings(status?: BookingRow['status'][]) {
  return useQuery({
    queryKey:  [...BOOKING_KEYS.mine, status],
    queryFn:   () => bookingsApi.getMyBookings(status),
    staleTime: 60_000,
  })
}

// ─── My jobs (creator) ────────────────────────────────────────────────────────
export function useMyJobs(status?: BookingRow['status'][]) {
  return useQuery({
    queryKey:  [...BOOKING_KEYS.jobs, status],
    queryFn:   () => bookingsApi.getMyJobs(status),
    staleTime: 60_000,
  })
}

// ─── Single booking ───────────────────────────────────────────────────────────
export function useBooking(id: string | null) {
  return useQuery({
    queryKey:  id ? BOOKING_KEYS.detail(id) : [],
    queryFn:   () => bookingsApi.getBookingById(id!),
    enabled:   !!id,
    staleTime: 30_000,
  })
}

// ─── Create booking + payment flow ────────────────────────────────────────────
export function useCreateBooking() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: bookingsApi.createBooking,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.mine })
    },
  })
}

// ─── Status update ────────────────────────────────────────────────────────────
export function useUpdateBookingStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status, extra }: { id: string; status: BookingRow['status']; extra?: Partial<BookingRow> }) =>
      bookingsApi.updateBookingStatus(id, status, extra),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.mine })
      qc.invalidateQueries({ queryKey: BOOKING_KEYS.jobs })
      qc.setQueryData(BOOKING_KEYS.detail(data.id), data)
    },
  })
}

// ─── Realtime booking detail ──────────────────────────────────────────────────
export function useRealtimeBooking(bookingId: string | null, onUpdate?: (row: BookingRow) => void) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!bookingId) return
    const sub = bookingsApi.subscribeToBooking(bookingId, (row) => {
      qc.setQueryData(BOOKING_KEYS.detail(bookingId), (old: BookingWithParties | undefined) =>
        old ? { ...old, ...row } : old
      )
      onUpdate?.(row)
    })
    return () => { sub.unsubscribe() }
  }, [bookingId, onUpdate, qc])
}

// ─── Payment initiation hook ──────────────────────────────────────────────────
export function useInitiatePayment() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const qc = useQueryClient()

  const pay = useCallback(async (params: {
    bookingId:   string
    amount:      number
    type:        'advance' | 'balance'
    description: string
    creatorName: string
    onComplete?: () => void
  }) => {
    setLoading(true)
    setError(null)
    try {
      const { order, payment_id } = await paymentsApi.createPaymentOrder(params.bookingId, params.amount, params.type)

      await paymentsApi.openRazorpayCheckout({
        order,
        amount:      params.amount,
        name:        params.creatorName,
        description: params.description,
        onSuccess: async (res) => {
          await paymentsApi.verifyPayment({ payment_id, ...res })
          qc.invalidateQueries({ queryKey: BOOKING_KEYS.mine })
          qc.invalidateQueries({ queryKey: BOOKING_KEYS.jobs })
          params.onComplete?.()
          setLoading(false)
        },
        onFailure: (err) => {
          setError('Payment failed. Please try again.')
          console.error('Payment failed', err)
          setLoading(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment error')
      setLoading(false)
    }
  }, [qc])

  return { pay, loading, error }
}
