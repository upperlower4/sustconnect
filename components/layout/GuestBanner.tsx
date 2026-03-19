'use client'
import Link from 'next/link'

export default function GuestBanner() {
  return (
    <div className="fixed top-[44px] left-0 right-0 z-40 flex items-center justify-between px-4 py-[7px] text-white text-[12px]" style={{ background: 'var(--acc)' }}>
      <span className="hidden sm:block">👋 SUST এর student? Join করো — Post, Crush, DM সব!</span>
      <span className="sm:hidden">👋 Join SUST Connect!</span>
      <div className="flex gap-[6px] flex-shrink-0">
        <Link href="/auth/signup" className="px-[10px] py-[4px] bg-white rounded-[6px] text-[11px] font-bold" style={{ color: 'var(--acc)' }}>Sign Up</Link>
        <Link href="/auth/login" className="px-[10px] py-[4px] rounded-[6px] text-[11px] font-semibold border border-white/40">Login</Link>
      </div>
    </div>
  )
}
