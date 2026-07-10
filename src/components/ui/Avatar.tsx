import { BadgeCheck } from 'lucide-react'

interface AvatarProps {
  src: string
  size?: number
  tier?: string
  online?: boolean
}

export function Avatar({ src, size = 40, tier, online }: AvatarProps) {
  return (
    <div className="relative shrink-0">
      <img
        src={src}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
        alt=""
        loading="lazy"
      />
      {tier === 'vetted' && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-paper rounded-full p-0.5">
          <BadgeCheck size={size * 0.32} className="text-iris fill-iris-tint" />
        </div>
      )}
      {online && (
        <div className="absolute bottom-0 right-0 bg-success w-3 h-3 rounded-full border-2 border-paper" />
      )}
    </div>
  )
}
