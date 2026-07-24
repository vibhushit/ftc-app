import { cn } from '@/utils'
import { BrandIcon } from './BrandIcon'
import { NAV_TABS } from './navTabs'
import type { Tab } from '@/types'

interface SideNavProps {
  active: Tab
  onNav: (tab: Tab) => void
  notifications?: number
}

export function SideNav({ active, onNav, notifications = 0 }: SideNavProps) {
  return (
    <div className="hidden md:flex flex-col w-[220px] shrink-0 py-6 px-3 border-r border-line" style={{ background: '#f4f1ea' }}>
      <div className="px-3 mb-8 flex items-center gap-2">
        <BrandIcon size={28} />
        <span className="font-display text-lg tracking-tight">FTC</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_TABS.map(t => {
          const Ic = t.icon
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onNav(t.id)}
              className={cn(
                'tap relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition',
                isActive ? 'bg-obsidian text-paper' : 'text-obsidian/60 hover:bg-obsidian/5',
              )}
            >
              <Ic size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[13.5px] font-medium">{t.label}</span>
              {t.id === 'inbox' && notifications > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-danger text-paper text-[9px] font-bold rounded-full grid place-items-center">
                  {notifications}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
