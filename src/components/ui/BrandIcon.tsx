interface BrandIconProps {
  size?: number
  bg?: string
}

export function BrandIcon({ size = 28, bg = '#DBFF4D' }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: size * 0.25, background: bg }}
    >
      <path d="M 22 52 Q 50 84, 78 52" stroke="#141414" strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="42" r="5.5" fill="#141414" />
      <circle cx="64" cy="42" r="5.5" fill="#141414" />
    </svg>
  )
}
