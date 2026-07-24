import { Crown, Trophy, Star, Flame } from 'lucide-react'
import { cn } from '@/utils'
import type { Tier } from '@/types'

interface TierBadgeProps {
  tier: Tier
  size?: 'sm' | 'md'
}

const TIER_CFG: Record<Tier, { bg: string; color: string; icon: React.ComponentType<{ size: number }> }> = {
  Platinum: { bg: '#141414', color: '#DBFF4D', icon: Crown },
  Gold: { bg: '#DBFF4D', color: '#141414', icon: Trophy },
  Silver: { bg: '#f4f1ea', color: '#141414', icon: Star },
  Rising: { bg: '#7D61F2', color: '#FFFFFF', icon: Flame },
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const c = TIER_CFG[tier]
  const I = c.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-mono uppercase tracking-[0.1em]',
        size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
      )}
      style={{ background: c.bg, color: c.color }}
    >
      <I size={size === 'sm' ? 9 : 10} />
      {tier}
    </span>
  )
}
