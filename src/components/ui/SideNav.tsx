import { cn } from '@/utils'
import { BrandIcon } from './BrandIcon'
import { CLIENT_NAV_TABS, CREATOR_NAV_TABS } from './navTabs'
import { useAppStore } from '@/store/appStore'
import { useShallow } from 'zustand/shallow'
import { LogIn } from 'lucide-react'
import type { Tab } from '@/types'

interface SideNavProps {
  active: Tab
  onNav: (tab: Tab) => void
  notifications?: number
}

export function SideNav({ active, onNav, notifications = 0 }: SideNavProps) {
  const { isAuthed, isCreator, screen, dispatch } = useAppStore(useShallow(s => ({
    isAuthed: s.isAuthed,
    isCreator: s.isCreator,
    screen: s.screen,
    dispatch: s.dispatch,
  })))
  const tabs = (isAuthed && isCreator) ? CREATOR_NAV_TABS : CLIENT_NAV_TABS
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
                'tap relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition',
                isInbox
                  ? 'text-obsidian/40 opacity-35 cursor-not-allowed'
                  : isActive
                  ? 'bg-obsidian text-paper font-semibold cursor-pointer'
                  : 'text-obsidian/65 hover:bg-obsidian/5 cursor-pointer',
              )}
            >
              <Ic size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[13.5px] font-medium">{t.label}</span>
              {!isInbox && t.id === 'inbox' && isAuthed && notifications > 0 && (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-danger text-paper text-[9px] font-bold rounded-full grid place-items-center">
                  {notifications}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Guest Sign-In Action at Bottom */}
      {!isAuthed && (
        <div className="mt-auto pt-4 border-t border-line/60">
          <button
            onClick={() => dispatch({ type: 'GO', screen: 'login' })}
            className="tap w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-obsidian text-paper text-[13px] font-semibold hover:bg-obsidian/90 transition shadow-xs cursor-pointer"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        </div>
      )}
    </div>
  )
}
