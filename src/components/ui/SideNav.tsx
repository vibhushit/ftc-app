import { cn } from '@/utils'
import { BrandIcon } from './BrandIcon'
import { CLIENT_NAV_TABS, CREATOR_NAV_TABS } from './navTabs'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import type { Tab } from '@/types'

interface SideNavProps {
  active: Tab
  onNav: (tab: Tab) => void
  notifications?: number
}

export function SideNav({ active, onNav, notifications = 0 }: SideNavProps) {
  const { isCreator, screen, dispatch } = useAppStore(useShallow(s => ({ isCreator: s.isCreator, screen: s.screen, dispatch: s.dispatch })))
  const tabs = isCreator ? CREATOR_NAV_TABS : CLIENT_NAV_TABS
  const isDedicatedScreenActive = tabs.some(x => x.screen && x.screen === screen)

  return (
    <div className="hidden md:flex flex-col w-[220px] shrink-0 py-6 px-3 border-r border-line" style={{ background: '#f4f1ea' }}>
      <button onClick={() => onNav('home')} className="tap px-3 mb-8 flex items-center gap-2 text-left cursor-pointer group">
        <BrandIcon size={28} />
        <span className="font-display text-lg tracking-tight group-hover:text-iris transition-colors">FTC</span>
      </button>
      <nav className="flex flex-col gap-1">
        {tabs.map(t => {
          const Ic = t.icon
          const isActive = t.screen ? screen === t.screen : (!isDedicatedScreenActive && active === t.id)
          return (
            <button
              key={t.id + (t.screen || '')}
              onClick={() => {
                if (t.screen) {
                  dispatch({ type: 'GO', screen: t.screen })
                } else {
                  onNav(t.id as Tab)
                }
              }}
              className={cn(
                'tap relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition',
                isActive ? 'bg-obsidian text-paper font-semibold' : 'text-obsidian/65 hover:bg-obsidian/5',
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
