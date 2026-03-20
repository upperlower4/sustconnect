'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore, useDMStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'

const browseLinks = [
  { href: '/jobs',        icon: 'fa-solid fa-briefcase',         label: 'Jobs',       color: '#34d399' },
  { href: '/tuition',     icon: 'fa-solid fa-book',              label: 'Tuition',    color: '#fbbf24' },
  { href: '/sell',        icon: 'fa-solid fa-tag',               label: 'Buy & Sell', color: '#a78bfa' },
  { href: '/notices',     icon: 'fa-solid fa-bullhorn',          label: 'Notices',    color: '#60a5fa' },
  { href: '/confessions', icon: 'fa-regular fa-face-smile-wink', label: 'Confessions',color: '#f472b6' },
]

export default function LeftNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { toggle } = useDMStore()
  const [crushCount, setCrushCount] = useState(0)
  const [dmCount, setDmCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (!user) return
    async function loadCounts() {
      const [crush, dm, notif] = await Promise.all([
        supabase.from('crushes').select('id', { count: 'exact' }).eq('receiver_id', user!.id).eq('is_matched', false),
        supabase.from('dm_threads').select('id', { count: 'exact' }).contains('participant_ids', [user!.id]).eq('is_request', true),
        supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', user!.id).eq('is_read', false),
      ])
      setCrushCount(crush.count || 0)
      setDmCount(dm.count || 0)
      setNotifCount(notif.count || 0)
    }
    loadCounts()
  }, [user])

  const mainLinks = [
    { href: '/',              icon: 'fa-solid fa-house',            label: 'Feed' },
    { href: '/crush',         icon: 'fa-regular fa-heart',          label: 'Crush',         badge: crushCount },
    { href: '#dm',            icon: 'fa-regular fa-comment',        label: 'Messages',       badge: dmCount, isDM: true },
    { href: '/notifications', icon: 'fa-regular fa-bell',           label: 'Notifications',  badge: notifCount },
    { href: '/search',        icon: 'fa-solid fa-magnifying-glass', label: 'Search' },
  ]

  return (
    <nav className="sticky top-[44px] h-[calc(100vh-44px)] overflow-y-auto border-r flex flex-col gap-[1px] px-2 py-[14px]"
      style={{ borderColor: 'var(--bdr)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-[9px] py-[7px] mb-[10px]">
        <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center text-white text-[13px] flex-shrink-0" style={{ background: 'var(--acc)' }}>
          <i className="fa-solid fa-graduation-cap" />
        </div>
        <span className="text-[16px] font-bold tracking-tight">SUST Connect</span>
      </div>

      {mainLinks.map(l => (
        <Link key={l.href} href={l.href}
          onClick={l.isDM ? (e) => { e.preventDefault(); toggle() } : undefined}
          className="flex items-center gap-[10px] px-[9px] py-[8px] rounded-[7px] text-[13px] font-medium transition-all"
          style={{ color: pathname === l.href ? 'var(--txt)' : 'var(--txt2)', background: pathname === l.href ? 'var(--surf2)' : 'transparent', fontWeight: pathname === l.href ? 600 : 500 }}>
          <i className={`${l.icon} w-[17px] text-center text-[13px] flex-shrink-0`} />
          {l.label}
          {l.badge && <span className="ml-auto text-[9.5px] font-bold text-white px-[5px] py-[1px] rounded-full" style={{ background: 'var(--acc)' }}>{l.badge}</span>}
        </Link>
      ))}

      <div className="text-[9.5px] font-bold px-[9px] my-[7px] tracking-widest uppercase" style={{ color: 'var(--txt3)' }}>Browse</div>

      {browseLinks.map(l => (
        <Link key={l.href} href={l.href}
          className="flex items-center gap-[10px] px-[9px] py-[8px] rounded-[7px] text-[13px] font-medium transition-all"
          style={{ color: pathname === l.href ? 'var(--txt)' : 'var(--txt2)', background: pathname === l.href ? 'var(--surf2)' : 'transparent' }}>
          <i className={`${l.icon} w-[17px] text-center text-[13px] flex-shrink-0`} style={{ color: l.color }} />
          {l.label}
        </Link>
      ))}

      <div className="text-[9.5px] font-bold px-[9px] my-[7px] tracking-widest uppercase" style={{ color: 'var(--txt3)' }}>Account</div>
      <Link href="/settings" className="flex items-center gap-[10px] px-[9px] py-[8px] rounded-[7px] text-[13px] font-medium transition-all" style={{ color: 'var(--txt2)' }}>
        <i className="fa-solid fa-gear w-[17px] text-center text-[13px]" /> Settings
      </Link>
      {user?.is_admin && (
        <Link href="/admin" className="flex items-center gap-[10px] px-[9px] py-[8px] rounded-[7px] text-[13px] font-medium" style={{ color: 'var(--txt2)' }}>
          <i className="fa-solid fa-shield-halved w-[17px] text-center text-[13px]" /> Admin
        </Link>
      )}

      {/* User card */}
      <Link href="/profile/me" className="mt-auto p-[9px] rounded-[9px] flex items-center gap-[9px] cursor-pointer transition-all border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
        <Avatar user={user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--txt)' }}>{user?.full_name || 'Guest'}</div>
          <div className="text-[11px]" style={{ color: 'var(--txt2)' }}>{user ? `@${user.username}` : 'Not logged in'}</div>
        </div>
        <i className="fa-solid fa-ellipsis text-[11px]" style={{ color: 'var(--txt3)' }} />
      </Link>
    </nav>
  )
}
