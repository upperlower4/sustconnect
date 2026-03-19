'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { DMThread, Message } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import Avatar from '@/components/ui/Avatar'
import { timeAgo } from '@/lib/utils'

// Mobile-only full-screen DM page
export default function DMPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [threads, setThreads] = useState<DMThread[]>([])
  const [activeThread, setActiveThread] = useState<DMThread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    loadThreads()
  }, [user])

  async function loadThreads() {
    const { data } = await supabase
      .from('dm_threads')
      .select(`*`)
      .contains('participant_ids', [user!.id])
      .order('last_message_at', { ascending: false })
    setThreads(data || [])
  }

  async function openThread(thread: DMThread) {
    setActiveThread(thread)
    const { data } = await supabase
      .from('messages')
      .select(`*, sender:users(id,full_name,username,avatar_url)`)
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => msgsRef.current?.scrollTo(0, msgsRef.current.scrollHeight), 100)
  }

  async function sendMessage() {
    if (!input.trim() || !activeThread || !user) return
    const text = input.trim()
    setInput('')
    await supabase.from('messages').insert({ thread_id: activeThread.id, sender_id: user.id, content: text, is_read: false })
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px] h-screen flex flex-col">
        {/* Thread list */}
        {!activeThread && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-[13px] py-[11px] border-b border-bdr flex items-center justify-between">
              <h2 className="text-[15px] font-bold">Messages</h2>
              <button onClick={() => router.back()} className="text-[12px] text-txt2">
                <i className="fa-solid fa-arrow-left mr-[5px]" />Back
              </button>
            </div>
            <div className="px-[9px] py-[7px] border-b border-bdr">
              <div className="flex items-center gap-[7px] bg-surf2 border border-bdr rounded-[8px] px-[10px] py-[7px]">
                <i className="fa-solid fa-magnifying-glass text-txt3 text-[12px]" />
                <input placeholder="Search messages..." className="flex-1 text-[12.5px] text-txt placeholder:text-txt3 bg-transparent" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pb-[54px]">
              {threads.filter(t => !t.is_request).map(thread => (
                <div key={thread.id} onClick={() => openThread(thread)}
                  className="flex items-center gap-[9px] px-[13px] py-[10px] cursor-pointer border-b border-bdr hover:bg-surf2 transition-colors active:bg-surf2">
                  <div className="relative flex-shrink-0">
                    <Avatar user={thread.other_user} size="md" />
                    <div className="absolute bottom-[1px] right-[1px] w-[8px] h-[8px] bg-green-500 rounded-full border-[1.5px] border-surf" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[13.5px] font-semibold">{thread.other_user?.full_name || 'User'}</span>
                      <span className="text-[10.5px] text-txt3">{thread.last_message_at ? timeAgo(thread.last_message_at) : ''}</span>
                    </div>
                    <div className="text-[12px] text-txt2 truncate mt-[1px]">{thread.last_message}</div>
                  </div>
                  {(thread.unread_count || 0) > 0 && (
                    <div className="w-[16px] h-[16px] rounded-full text-[9.5px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ background: 'var(--acc)' }}>
                      {thread.unread_count}
                    </div>
                  )}
                </div>
              ))}

              {/* Message Requests */}
              {threads.filter(t => t.is_request).length > 0 && (
                <>
                  <div className="px-[13px] py-[8px] text-[10px] font-bold text-txt3 uppercase tracking-widest border-t border-bdr mt-[5px]">
                    Message Requests ({threads.filter(t => t.is_request).length})
                  </div>
                  {threads.filter(t => t.is_request).map(thread => (
                    <div key={thread.id} onClick={() => openThread(thread)}
                      className="flex items-center gap-[9px] px-[13px] py-[10px] cursor-pointer border-b border-bdr hover:bg-surf2 transition-colors">
                      <Avatar user={thread.other_user} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold">{thread.other_user?.full_name}</div>
                        <div className="text-[12px] text-txt2 truncate">{thread.last_message}</div>
                      </div>
                      <button className="px-[10px] py-[4px] bg-surf2 border border-bdr rounded-[6px] text-[11px] font-semibold hover:border-bdr2 transition-colors flex-shrink-0">Accept</button>
                    </div>
                  ))}
                </>
              )}

              {threads.length === 0 && (
                <div className="text-center py-[48px] text-txt3 text-[13px]">
                  <i className="fa-regular fa-comment-dots text-[36px] block mb-[10px] opacity-30" />
                  No messages yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat view */}
        {activeThread && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-[12px] py-[10px] border-b border-bdr flex items-center gap-[9px] bg-surf flex-shrink-0">
              <button onClick={() => setActiveThread(null)} className="text-txt2 text-[14px]">
                <i className="fa-solid fa-arrow-left" />
              </button>
              <div className="relative">
                <Avatar user={activeThread.other_user} size="sm" />
                <div className="absolute bottom-[1px] right-[1px] w-[7px] h-[7px] bg-green-500 rounded-full border-[1.5px] border-surf" />
              </div>
              <div>
                <div className="text-[13px] font-semibold">{activeThread.other_user?.full_name}</div>
                <div className="text-[10.5px] text-green-500">Online</div>
              </div>
              <button onClick={() => router.push(`/profile/${activeThread.other_user?.username}`)} className="ml-auto w-[30px] h-[30px] bg-surf2 border border-bdr rounded-[7px] text-[11px] flex items-center justify-center hover:border-bdr2 transition-colors">
                <i className="fa-regular fa-user" />
              </button>
            </div>

            <div ref={msgsRef} className="flex-1 overflow-y-auto p-[10px] flex flex-col gap-[8px] pb-[70px]">
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex gap-[6px] items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                    {!isMe && <Avatar user={msg.sender} size="xs" />}
                    <div>
                      <div className={`max-w-[75vw] px-[11px] py-[8px] text-[13px] leading-[1.55] rounded-[12px] ${isMe ? 'text-white rounded-br-[3px]' : 'bg-surf2 rounded-bl-[3px]'}`}
                        style={isMe ? { background: 'var(--acc)' } : {}}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="fixed bottom-[54px] left-0 right-0 p-[9px] border-t border-bdr bg-surf flex gap-[7px] items-center">
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Message..."
                className="flex-1 bg-surf2 border border-bdr rounded-full px-[13px] py-[8px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors" />
              <button onClick={sendMessage} className="w-[36px] h-[36px] rounded-full text-white text-[13px] flex items-center justify-center flex-shrink-0 hover:opacity-85 transition-opacity" style={{ background: 'var(--acc)' }}>
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </>
  )
}
