'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',            icon: 'fa-solid fa-house',         label: 'Feed'     },
  { href: '/crush',       icon: 'fa-regular fa-heart',       label: 'Crush', badge: 3 },
  { href: '#post',        icon: 'fa-solid fa-pen-to-square', label: 'Post',  isAction: true },
  { href: '/dm',          icon: 'fa-regular fa-comment',     label: 'DM',    badge: 2 },
  { href: '/profile/me',  icon: 'fa-regular fa-user',        label: 'Profile'  },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
      {links.map(l => {
        const active = pathname === l.href
        return (
          <Link key={l.href} href={l.href}
            className="flex-1 flex flex-col items-center gap-[2px] py-[4px] relative transition-colors"
            style={{ color: active || l.isAction ? 'var(--acc)' : 'var(--txt3)' }}>
            <i className={`${l.icon} ${l.isAction ? 'text-[20px]' : 'text-[17px]'}`} />
            <span className="text-[9px] font-semibold">{l.label}</span>
            {l.badge && (
              <span className="absolute top-[1px] right-[calc(50%-17px)] w-[14px] h-[14px] rounded-full text-[8px] font-bold text-white flex items-center justify-center" style={{ background: 'var(--acc)' }}>
                {l.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
