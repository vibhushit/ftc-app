import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[FTC ErrorBoundary] Uncaught runtime error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.hash = ''
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger grid place-items-center mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="font-display text-2xl tracking-tight text-obsidian mb-2">
            Something went wrong
          </h2>
          <p className="text-[14px] text-obsidian/60 max-w-sm mb-6 leading-relaxed">
            An unexpected error occurred. Don't worry, your data is safe.
          </p>
          {this.state.error && (
            <div className="bg-bone text-obsidian/70 font-mono text-[12px] p-3 rounded-xl max-w-md w-full overflow-x-auto text-left mb-6 border border-line">
              {this.state.error.toString()}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="tap inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-obsidian text-paper text-[14px] font-semibold hover:bg-obsidian/90 transition-colors"
          >
            <RefreshCw size={16} />
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
