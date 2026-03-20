'use client'

const COLORS = ['#e8187a','#7c3aed','#0d9488','#d97706','#0284c7','#e11d48','#059669']

function getColor(name: string) {
  let h = 0
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const sizes: Record<string, string> = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-[30px] h-[30px] text-[11px]',
  md: 'w-[38px] h-[38px] text-[13px]',
  lg: 'w-[46px] h-[46px] text-[15px]',
  xl: 'w-[76px] h-[76px] text-[22px]',
}

interface Props {
  user?: { full_name?: string; avatar_url?: string } | null
  size?: string
  onClick?: () => void
  className?: string
}

export default function Avatar({ user, size = 'md', onClick, className = '' }: Props) {
  const name = user?.full_name || 'User'
  return (
    <div
      onClick={onClick}
      className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${sizes[size]} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      style={{ background: getColor(name) }}
    >
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={name} className="w-full h-full rounded-full object-cover" />
        : getInitials(name)}
    </div>
  )
}
