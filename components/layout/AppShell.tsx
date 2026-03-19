'use client'
import { useDMStore } from '@/lib/store'
import LeftNav from './LeftNav'
import SideDM from '@/components/dm/SideDM'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen } = useDMStore()
  return (
    <div className="grid min-h-[calc(100vh-44px)] max-w-[1080px] mx-auto"
      style={{ gridTemplateColumns: isOpen ? '216px 1fr 296px' : '216px 1fr' }}>
      <LeftNav />
      <main className="border-r min-h-[calc(100vh-44px)]" style={{ borderColor: 'var(--bdr)' }}>
        {children}
      </main>
      {isOpen && <SideDM />}
    </div>
  )
}
