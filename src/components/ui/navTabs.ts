import { Home, Compass, MessageCircle, User, Calendar, Briefcase } from 'lucide-react'
import type { Tab, Screen } from '@/types'

export interface NavTabDef {
  id: Tab | 'calendar'
  screen?: Screen
  label: string
  icon: React.ComponentType<{ size: number; className?: string; strokeWidth?: number }>
}

export const CLIENT_NAV_TABS: NavTabDef[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Search', icon: Compass },
  { id: 'inbox', label: 'Inbox', icon: MessageCircle },
  { id: 'me', label: 'Profile', icon: User },
]

export const CREATOR_NAV_TABS: NavTabDef[] = [
  { id: 'home', label: 'Pipeline', icon: Briefcase },
  { id: 'calendar', screen: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'inbox', label: 'Inbox', icon: MessageCircle },
  { id: 'me', label: 'Profile', icon: User },
]

export const NAV_TABS = CLIENT_NAV_TABS
