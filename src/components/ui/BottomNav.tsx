import { cn } from '@/utils'
import { CLIENT_NAV_TABS, CREATOR_NAV_TABS } from './navTabs'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import type { Tab } from '@/types'

interface BottomNavProps {
  active: Tab
  onNav: (tab: Tab) => void
  notifications?: number
}

export function BottomNav({ active, onNav, notifications = 0 }: BottomNavProps) {
  const { isCreator, screen, dispatch } = useAppStore(useShallow(s => ({ isCreator: s.isCreator, screen: s.screen, dispatch: s.dispatch })))
  const tabs = isCreator ? CREATOR_NAV_TABS : CLIENT_NAV_TABS
  const isDedicatedScreenActive = tabs.some(x => x.screen && x.screen === screen)

  return (
    <div className="md:hidden absolute bottom-0 inset-x-0 bg-paper/95 backdrop-blur-xl border-t border-line z-30">
      <div className="flex items-center justify-around py-2 px-2">
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
              className="tap relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl"
            >
              <div className="relative">
                <Ic
                  size={22}
                  className={isActive ? 'text-obsidian' : 'text-obsidian/40'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {t.id === 'inbox' && notifications > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-danger text-paper text-[9px] font-bold rounded-full grid place-items-center">
                    {notifications}
                  </span>
                )}
              </div>
              <span className={cn('mt-1 text-[10px] font-medium', isActive ? 'text-obsidian font-semibold' : 'text-obsidian/40')}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex justify-center pb-1.5">
        <div className="w-32 h-1 rounded-full bg-obsidian/90" />
      </div>
    </div>
  )
}
