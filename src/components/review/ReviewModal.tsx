import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, CheckCircle2, Loader2 } from 'lucide-react'
import { apiClient } from '@/services/apiClient'
import { useToast } from '@/components/ui/ToastNotification'
import { cn } from '@/utils'

export interface ReviewResult {
  reviewId: string
  rating: number
  comment: string | null
}

export interface ReviewModalProps {
  isOpen: boolean
  bookingId: string
  creatorId: string
  creatorName: string
  creatorAvatar?: string
  packageName?: string
  sessionDate?: string
  onClose: () => void
  onSuccess?: (result: ReviewResult) => void
}

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good — Met Expectations',
  4: 'Great Collaboration!',
  5: 'Exceptional Experience!',
}

export function ReviewModal({
  isOpen,
  bookingId,
  creatorId,
  creatorName,
  creatorAvatar,
  packageName,
  sessionDate,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { showSuccess, showError } = useToast()
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen) {
      setRating(0)
      setHoverRating(0)
      setComment('')
      setIsSubmitting(false)
      setIsSuccess(false)
      setErrorMsg(null)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a star rating between 1 and 5.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await apiClient.createReview({
        booking_id: bookingId,
        rating,
        comment: comment.trim() ? comment.trim() : null,
      })

      setIsSuccess(true)
      showSuccess('Review submitted! Thank you for rating your creator.', {
        title: 'Verified Review Published',
      })

      const trimmedComment = comment.trim() || null

      setTimeout(() => {
        onSuccess?.({
          reviewId: res.review_id,
          rating,
          comment: trimmedComment,
        })
        onClose()
      }, 1200)
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit review. Please try again.'
      setErrorMsg(msg)
      showError(msg, { title: 'Review Submission Error' })
      setIsSubmitting(false)
    }
  }

  const activeRating = hoverRating || rating

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Blurred Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-obsidian/60 backdrop-blur-md"
            onClick={() => {
              if (!isSubmitting) onClose()
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-paper rounded-3xl border border-line p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
          >
            {/* Close Button */}
            {!isSubmitting && !isSuccess && (
              <button
                type="button"
                onClick={onClose}
                className="tap absolute top-5 right-5 w-8 h-8 rounded-full bg-cream/70 hover:bg-cream grid place-items-center text-obsidian/60 hover:text-obsidian transition-colors"
                aria-label="Close review dialog"
              >
                <X size={16} />
              </button>
            )}

            {isSuccess ? (
              /* Success Celebration State */
              <div className="py-8 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto border border-emerald-200 shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h3 className="font-display text-2xl tracking-tight text-obsidian">Review Published</h3>
                  <p className="text-[13px] text-obsidian/60 mt-1 max-w-xs mx-auto">
                    Your verified feedback supports {creatorName} and helps the FTC community thrive.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-1 text-amber-400 pt-1">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} size={20} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            ) : (
              /* Rating Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Creator Header */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-line/60 bg-cream">
                    {creatorAvatar ? (
                      <img
                        src={creatorAvatar}
                        alt={creatorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display font-medium text-obsidian/70 text-base">
                        {creatorName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-iris font-semibold">
                      Verified Session Completed
                    </span>
                    <h3 className="font-display text-xl tracking-tight text-obsidian truncate">
                      Rate {creatorName}
                    </h3>
                    {(packageName || sessionDate) && (
                      <p className="text-[12px] text-obsidian/50 truncate">
                        {[packageName, sessionDate].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Star Rating Selector */}
                <div className="text-center py-2 space-y-2">
                  <div className="flex items-center justify-center gap-2.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= activeRating
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="tap p-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-obsidian transition-transform hover:scale-110 active:scale-95"
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={34}
                            className={cn(
                              'transition-all duration-150',
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                                : 'text-obsidian/20 hover:text-amber-300'
                            )}
                          />
                        </button>
                      )
                    })}
                  </div>

                  {/* Active Rating Text Label */}
                  <p
                    className={cn(
                      'text-[12px] font-medium tracking-tight transition-colors duration-150',
                      activeRating > 0 ? 'text-obsidian' : 'text-obsidian/40'
                    )}
                  >
                    {activeRating > 0
                      ? RATING_LABELS[activeRating]
                      : 'Tap a star to rate your session (required)'}
                  </p>
                </div>

                {/* Optional Comment Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="review-comment"
                      className="font-mono text-[10px] uppercase tracking-wider text-obsidian/50"
                    >
                      Feedback (Optional)
                    </label>
                    <span className="font-mono text-[10px] text-obsidian/40">
                      {comment.length}/500
                    </span>
                  </div>
                  <textarea
                    id="review-comment"
                    rows={3}
                    maxLength={500}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`What stood out during your session with ${creatorName}?`}
                    className="w-full bg-cream/30 rounded-2xl border border-line p-3.5 text-[13px] text-obsidian placeholder:text-obsidian/35 focus:outline-none focus:border-obsidian focus:bg-paper transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12px] leading-tight animate-fade-in">
                    {errorMsg}
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={rating < 1 || isSubmitting}
                    className="tap w-full py-3.5 rounded-full font-medium text-[14px] bg-obsidian text-paper disabled:opacity-40 disabled:cursor-not-allowed hover:bg-obsidian/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-paper/70" />
                        <span>Submitting Review...</span>
                      </>
                    ) : (
                      <span>Submit Verified Review</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onClose}
                    className="tap w-full py-2 text-center text-[12px] font-medium text-obsidian/50 hover:text-obsidian transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

