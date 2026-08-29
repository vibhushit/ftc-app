import { ArrowLeft, Mail } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'

export function MagicLinkSentScreen() {
  const { dispatch, pendingPhone } = useAppStore(useShallow(s => ({ dispatch: s.dispatch, pendingPhone: s.pendingPhone })))
  return (
    <div className="flex-1 flex flex-col bg-paper text-obsidian">
      <div className="px-6 py-4 flex items-center">
        <button onClick={() => dispatch({ type: 'GO', screen: 'login' })} className="tap w-10 h-10 -ml-2 grid place-items-center">
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-sm mx-auto w-full">
        <div className="w-20 h-20 rounded-full bg-iris/10 grid place-items-center mb-6">
          <Mail size={36} className="text-iris" />
        </div>
        <h1 className="font-display text-3xl tracking-tight leading-tight">
          Check your<br /><span className="italic">email inbox.</span>
        </h1>
        <p className="mt-4 text-[14px] text-obsidian/60 leading-relaxed">
          We sent a sign-in link to <span className="font-semibold text-obsidian">{pendingPhone}</span>.
        </p>
        <button
          onClick={() => dispatch({ type: 'GO', screen: 'login' })}
          className="tap mt-6 px-6 py-3 rounded-2xl bg-obsidian text-paper font-semibold text-[13px]"
        >
          Return to Sign In
        </button>
      </div>
    </div>
  )
}
