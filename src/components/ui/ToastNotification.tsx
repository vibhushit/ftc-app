import React, { createContext, useContext, useState, useCallback } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/utils'

export type ToastType = 'error' | 'success' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  type: ToastType
  title?: string
  message: string
  action?: ToastAction
  durationMs?: number
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => string
  showError: (message: string, options?: { title?: string; action?: ToastAction; durationMs?: number }) => string
  showSuccess: (message: string, options?: { title?: string; durationMs?: number }) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    const duration = toast.durationMs ?? (toast.type === 'error' ? 6000 : 4000)
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }, [dismissToast])

  const showError = useCallback((message: string, options?: { title?: string; action?: ToastAction; durationMs?: number }) => {
    return showToast({
      type: 'error',
      title: options?.title || 'Action Failed',
      message,
      action: options?.action,
      durationMs: options?.durationMs,
    })
  }, [showToast])

  const showSuccess = useCallback((message: string, options?: { title?: string; durationMs?: number }) => {
    return showToast({
      type: 'success',
      title: options?.title || 'Success',
      message,
      durationMs: options?.durationMs,
    })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, dismissToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map(t => {
          const isError = t.type === 'error'
          const isSuccess = t.type === 'success'

          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                'pointer-events-auto p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all animate-fade-in',
                isError && 'bg-paper text-obsidian border-danger/30',
                isSuccess && 'bg-paper text-obsidian border-success/30',
                !isError && !isSuccess && 'bg-paper text-obsidian border-line'
              )}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle size={18} className="text-danger" />}
                {isSuccess && <CheckCircle2 size={18} className="text-success" />}
                {!isError && !isSuccess && <Info size={18} className="text-iris" />}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && <div className="text-[13px] font-semibold tracking-tight leading-snug">{t.title}</div>}
                <div className="text-[12px] text-obsidian/75 leading-relaxed mt-0.5">{t.message}</div>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action?.onClick()
                      dismissToast(t.id)
                    }}
                    className="tap mt-2 text-[11px] font-semibold text-iris underline hover:text-iris/80 block"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>

              <button
                onClick={() => dismissToast(t.id)}
                className="tap p-1 text-obsidian/40 hover:text-obsidian shrink-0 -mr-1 -mt-1"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
