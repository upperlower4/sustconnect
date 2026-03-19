'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import toast from 'react-hot-toast'

export default function CrushPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [crushCount, setCrushCount] = useState(0)
  const [sentCount, setSentCount] = useState(0)
  const [matchCount, setMatchCount] = useState(0)
  const [targetUsername, setTargetUsername] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    loadCrushStats()
  }, [user])

  async function loadCrushStats() {
    const [received, sent, matched] = await Promise.all([
      supabase.from('crushes').select('id', { count: 'exact' }).eq('receiver_id', user!.id).eq('is_matched', false),
      supabase.from('crushes').select('id', { count: 'exact' }).eq('sender_id', user!.id),
      supabase.from('crushes').select('id', { count: 'exact' }).eq('receiver_id', user!.id).eq('is_matched', true),
    ])
    setCrushCount(received.count || 0)
    setSentCount(sent.count || 0)
    setMatchCount(matched.count || 0)
  }

  async function sendCrush() {
    if (!targetUsername.trim()) { toast.error('Username দাও'); return }
    setLoading(true)
    try {
      const { data: target } = await supabase.from('users').select('id, gender').eq('username', targetUsername.toLowerCase()).single()
      if (!target) { toast.error('User খুঁজে পাওয়া যায়নি'); return }
      if (target.id === user!.id) { toast.error('নিজেকে crush দিতে পারবে না 😄'); return }

      const { error } = await supabase.from('crushes').insert({ sender_id: user!.id, receiver_id: target.id })
      if (error) {
        if (error.code === '23505') toast.error('Already sent a crush to this person!')
        else throw error
        return
      }
      toast.success('💘 Crush পাঠানো হয়েছে! Anonymous.')
      setTargetUsername('')
      loadCrushStats()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          <div className="max-w-[440px] mx-auto p-[18px]">
            {/* Counter card */}
            <div className="bg-surf border border-bdr rounded-[11px] p-[24px] text-center mb-[9px]">
              <div className="text-[10.5px] font-bold text-txt3 tracking-[0.5px] uppercase mb-[12px]">Secret Admirers</div>
              <div className="text-[52px] font-black leading-none text-txt">{crushCount}</div>
              <div className="text-[12.5px] text-txt2 mt-[5px]">people have a crush on you</div>
              <div className="text-[10.5px] text-txt3 mt-[3px]">Names reveal when it's mutual 🤫</div>

              <div className="flex gap-[14px] justify-center mt-[14px] pt-[14px] border-t border-bdr">
                <div className="text-center"><div className="text-[15px] font-bold">{sentCount}</div><div className="text-[10.5px] text-txt2">Sent</div></div>
                <div className="w-[1px] bg-bdr" />
                <div className="text-center"><div className="text-[15px] font-bold">{crushCount}</div><div className="text-[10.5px] text-txt2">Received</div></div>
                <div className="w-[1px] bg-bdr" />
                <div className="text-center"><div className="text-[15px] font-bold text-green-500">{matchCount}</div><div className="text-[10.5px] text-txt2">Matched</div></div>
              </div>
            </div>

            {/* Send crush */}
            <div className="bg-surf border border-bdr rounded-[11px] p-[18px] mb-[9px]">
              <h3 className="text-[14px] font-bold mb-[3px] flex items-center gap-[5px]">
                <i className="fa-solid fa-heart" style={{ color: 'var(--acc)' }} /> Send Secret Crush
              </h3>
              <p className="text-[11.5px] text-txt2 mb-[14px]">Enter their username. 100% anonymous until mutual.</p>
              <div className="relative mb-[11px]">
                <i className="fa-solid fa-at absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
                <input value={targetUsername} onChange={e => setTargetUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[12px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors"
                  onKeyDown={e => e.key === 'Enter' && sendCrush()} />
              </div>
              <button onClick={sendCrush} disabled={loading}
                className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white hover:opacity-88 transition-opacity disabled:opacity-50"
                style={{ background: 'var(--acc)' }}>
                {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-heart" />} Send Crush
              </button>
            </div>

            {/* How it works */}
            <div className="bg-surf border border-bdr rounded-[11px] p-[15px]">
              <div className="text-[12.5px] font-bold mb-[9px]">How it works</div>
              {[
                "Enter someone's username anonymously",
                "They get notified — but won't know who",
                "Mutual crush → both names reveal 💑",
                "DM unlocks automatically",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-[7px] text-[11.5px] text-txt2 mb-[7px] last:mb-0">
                  <i className="fa-solid fa-circle text-[5px] mt-[5px] flex-shrink-0" style={{ color: 'var(--acc)' }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </AppShell>
      </div>
      <BottomNav />
    </>
  )
}
