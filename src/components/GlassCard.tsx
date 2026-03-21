import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  pressable?: boolean
}

export function GlassCard({ children, className = '', onClick, pressable }: GlassCardProps) {
  const base = 'bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-black/[0.04]'
  const interactive = pressable || onClick
    ? 'cursor-pointer active:scale-[0.97] transition-transform duration-150 select-none'
    : ''

  return (
    <div
      className={`${base} ${interactive} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Dark variant for overlays on maps
export function GlassDarkCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg ${className}`}>
      {children}
    </div>
  )
}
