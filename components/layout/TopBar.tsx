'use client'
import Link from 'next/link'
import { useThemeStore } from '@/lib/store'

export default function TopBar() {
  const { theme, toggle } = useThemeStore()
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[44px] flex items-center px-4 border-b" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
      <Link href="/" className="flex items-center gap-2 mr-auto">
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white text-[13px]" style={{ background: 'var(--acc)' }}>
          <i className="fa-solid fa-graduation-cap" />
        </div>
        <span className="text-[15px] font-bold tracking-tight hidden sm:block">SUST Connect</span>
      </Link>
      <button onClick={toggle} className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[12px]" style={{ background: 'var(--surf2)', border: '1px solid var(--bdr)', color: 'var(--txt2)' }}>
        <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'} />
      </button>
    </header>
  )
}
