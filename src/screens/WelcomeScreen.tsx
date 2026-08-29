import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { BrandIcon } from '@/components/ui/BrandIcon'
import { useAppStore } from '@/store/appStore'

export function WelcomeScreen() {
  const dispatch = useAppStore(s => s.dispatch)
  return (
    <div className="relative flex-1 flex flex-col bg-obsidian text-paper overflow-hidden">
      <div className="absolute top-10 right-0 w-72 h-72 dots-acid opacity-30 pointer-events-none" style={{ transform: 'translateX(40%)' }} />
      <div className="absolute bottom-40 -left-20 w-72 h-72 rounded-full border-[32px] border-iris/20 pointer-events-none" />
      <div className="relative flex-1 flex flex-col px-8 pt-12 pb-10 z-10">
        <BrandIcon size={44} />
        <div className="flex-1 flex flex-col justify-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-light tracking-tight text-[56px] leading-[0.92]"
          >
            Book the best<br />
            <span className="italic">creative</span><br />
            professionals<br />
            in India.
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex items-center gap-2 text-paper/60 text-[13px]"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-acid animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.15em]">100+ vetted creators · 13 cities</span>
          </motion.div>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'signup' })}
            className="tap w-full py-4 rounded-2xl bg-acid text-obsidian font-semibold text-[15px] flex items-center justify-center gap-2"
          >
            Get started <ArrowRight size={16} />
          </button>
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap w-full py-4 text-paper/70 text-[13px] hover:text-paper transition"
          >
            I already have an account
          </button>
        </div>
        <div className="flex items-center justify-center gap-5 mt-6 text-[11px] font-mono uppercase tracking-[0.15em] text-paper/40">
          <button>English</button>
          <span>·</span>
          <button>हिंदी</button>
        </div>
      </div>
    </div>
  )
}
