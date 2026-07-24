import { Home, Compass, MessageCircle, User } from 'lucide-react'
import type { Tab } from '@/types'

export interface NavTabDef {
  id: Tab
  label: string
  icon: React.ComponentType<{ size: number; className?: string; strokeWidth?: number }>
}

export const NAV_TABS: NavTabDef[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'discover', label: 'Search', icon: Compass },
  { id: 'inbox', label: 'Inbox', icon: MessageCircle },
  { id: 'me', label: 'Profile', icon: User },
]
