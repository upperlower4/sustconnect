'use client'
import { useDMStore } from '@/lib/store'
import LeftNav from './LeftNav'
import SideDM from '@/components/dm/SideDM'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen } = useDMStore()
  return (
    <div className="min-h-[calc(100vh-44px)] max-w-[1080px] mx-auto md:grid md:grid-cols-[216px_1fr_296px] grid grid-cols-1">
      <div className="hidden md:block">
        <LeftNav />
      </div>
      <main className="border-r min-h-[calc(100vh-44px)] md:col-span-1" style={{ borderColor: 'var(--bdr)' }}>
        {children}
      </main>
      {isOpen && <SideDM />}
    </div>
  )
}
