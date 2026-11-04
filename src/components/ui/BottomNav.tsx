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
  const { isAuthed, isCreator, screen, dispatch } = useAppStore(useShallow(s => ({
    isAuthed: s.isAuthed,
    isCreator: s.isCreator,
    screen: s.screen,
    dispatch: s.dispatch,
  })))
  const tabs = (isAuthed && isCreator) ? CREATOR_NAV_TABS : CLIENT_NAV_TABS
  const isDedicatedScreenActive = tabs.some(x => x.screen && x.screen === screen)

  return (
    <div className="md:hidden absolute bottom-0 inset-x-0 bg-paper/95 backdrop-blur-xl border-t border-line z-30 pb-[max(6px,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around py-1.5 px-2">
        {tabs.map(t => {
          const Ic = t.icon
          const isInbox = t.id === 'inbox'
          const isActive = !isInbox && (t.screen ? screen === t.screen : (!isDedicatedScreenActive && active === t.id))
          return (
            <button
              key={t.id + (t.screen || '')}
              disabled={isInbox}
              onClick={() => {
                if (isInbox) return
                if (t.screen) {
                  dispatch({ type: 'GO', screen: t.screen })
                } else {
                  onNav(t.id as Tab)
                }
              }}
              title={isInbox ? 'Inbox coming soon' : undefined}
              className={cn(
                'tap relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl min-w-[56px] min-h-[44px]',
                isInbox ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              <div className="relative">
                <Ic
                  size={21}
                  className={isActive ? 'text-obsidian' : 'text-obsidian/40'}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {!isInbox && t.id === 'inbox' && isAuthed && notifications > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 bg-danger text-paper text-[9px] font-bold rounded-full grid place-items-center">
                    {notifications}
                  </span>
                )}
              </div>
              <span className={cn('mt-0.5 text-[10px] font-medium tracking-tight', isActive ? 'text-obsidian font-semibold' : 'text-obsidian/40')}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
