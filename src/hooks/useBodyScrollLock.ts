import { useEffect } from 'react'

/**
 * useBodyScrollLock — locks background scrolling when a modal or bottom sheet is open.
 * Restores body overflow style automatically when dismissed.
 */
export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return

    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
    }
  }, [isOpen])
}
