'use client'
import { useState, useEffect, useRef } from 'react'
import { useDMStore, useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'

export default function SideDM() {
  const { close } = useDMStore()
  const { user } = useAuthStore()
  const [threads, setThreads] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) loadThreads()
  }, [user])

  // ✅ FIX: Realtime subscription — নতুন message এলে auto update হবে
  useEffect(() => {
    if (!active || !user) return

    const channel = supabase
      .channel(`dm-${active.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `thread_id=eq.${active.id}`
      }, async (payload) => {
        // নতুন message এর sender info নিয়ে আসো
        const { data: sender } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .single()

        setMessages(msgs => [...msgs, { ...payload.new, sender }])
        setTimeout(() => msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [active, user])

  async function loadThreads() {
    const { data } = await supabase
      .from('dm_threads')
      .select('*')
      .contains('participant_ids', [user!.id])
      .order('last_message_at', { ascending: false })

    // ✅ other_user info নিয়ে আসো
    const threadsWithUsers = await Promise.all((data || []).map(async (t: any) => {
      const otherUserId = t.participant_ids.find((id: string) => id !== user!.id)
      const { data: otherUser } = await supabase
        .from('users')
        .select('id, full_name, username, avatar_url')
        .eq('id', otherUserId)
        .single()
      return { ...t, other_user: otherUser }
    }))

    setThreads(threadsWithUsers)
  }

  async function openThread(t: any) {
    setActive(t)
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(id,full_name,avatar_url)')
      .eq('thread_id', t.id)
      .order('created_at')
    setMessages(data || [])
    setTimeout(() => msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight), 50)
  }

  async function send() {
    if (!input.trim() || !active || !user) return
    const txt = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      thread_id: active.id,
      sender_id: user.id,
      content: txt,
      is_read: false
    })

    await supabase.from('dm_threads').update({
      last_message: txt,
      last_message_at: new Date().toISOString()
    }).eq('id', active.id)

    // Thread list refresh করো
    loadThreads()
  }

  return (
    <div className="sticky top-[44px] h-[calc(100vh-44px)] flex flex-col overflow-hidden border-l"
      style={{ borderColor: 'var(--bdr)' }}>
      <div className="px-[13px] py-[11px] border-b flex items-center justify-between flex-shrink-0"
        style={{ borderColor: 'var(--bdr)' }}>
        <h3 className="text-[13.5px] font-bold" style={{ color: 'var(--txt)' }}>
          {active ? (
            <button onClick={() => setActive(null)} className="flex items-center gap-[7px]"
              style={{ color: 'var(--txt2)' }}>
              <i className="fa-solid fa-arrow-left text-[12px]" />
              <span className="text-[13.5px] font-bold" style={{ color: 'var(--txt)' }}>
                {active.other_user?.full_name || 'Chat'}
              </span>
            </button>
          ) : 'Messages'}
        </h3>
        <button onClick={close}
          className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[12px] border"
          style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt2)' }}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* Thread list */}
      {!active && (
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 && (
            <div className="text-center py-[24px] text-[12px]" style={{ color: 'var(--txt3)' }}>
              <i className="fa-regular fa-comment-dots text-[28px] block mb-[8px] opacity-30" />
              No messages yet
            </div>
          )}
          {threads.map(t => (
            <div key={t.id} onClick={() => openThread(t)}
              className="flex items-center gap-[8px] px-[11px] py-[9px] cursor-pointer border-b transition-colors"
              style={{ borderColor: 'var(--bdr)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surf2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <Avatar user={t.other_user} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-[12.5px] font-semibold" style={{ color: 'var(--txt)' }}>
                    {t.other_user?.full_name || 'User'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--txt3)' }}>
                    {t.last_message_at ? timeAgo(t.last_message_at) : ''}
                  </span>
                </div>
                <div className="text-[11px] truncate mt-[1px]" style={{ color: 'var(--txt2)' }}>
                  {t.last_message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      {active && (
        <>
          <div ref={msgsRef} className="flex-1 overflow-y-auto p-[9px] flex flex-col gap-[7px]">
            {messages.map(m => {
              const isMe = m.sender_id === user?.id
              return (
                <div key={m.id} className={`flex gap-[5px] items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && <Avatar user={m.sender} size="xs" />}
                  <div
                    className={`max-w-[76%] px-[10px] py-[7px] text-[12px] leading-[1.55] rounded-[11px] ${isMe ? 'rounded-br-[3px] text-white' : 'rounded-bl-[3px]'}`}
                    style={{
                      background: isMe ? 'var(--acc)' : 'var(--surf2)',
                      color: isMe ? '#fff' : 'var(--txt)'
                    }}>
                    {m.content}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="p-[9px] border-t flex gap-[7px] items-center flex-shrink-0"
            style={{ borderColor: 'var(--bdr)' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Message..."
              className="flex-1 rounded-full px-[12px] py-[7px] text-[12.5px] border focus:outline-none transition-colors"
              style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
              onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--bdr)' }}
            />
            <button onClick={send}
              className="w-[30px] h-[30px] rounded-full text-white text-[12px] flex items-center justify-center hover:opacity-85 transition-opacity"
              style={{ background: 'var(--acc)' }}>
              <i className="fa-solid fa-paper-plane" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}