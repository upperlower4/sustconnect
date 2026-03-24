'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import Avatar from '@/components/ui/Avatar'

// Force dynamic rendering to prevent memory issues
export const dynamic = 'force-dynamic'
import { timeAgo } from '@/lib/utils'

const NOTIF_ICONS: Record<string, { icon: string; color: string }> = {
  post_loved:      { icon: 'fa-solid fa-heart',      color: 'rgba(232,24,122,0.08)' },
  post_commented:  { icon: 'fa-regular fa-comment',  color: 'rgba(96,165,250,0.08)' },
  comment_replied: { icon: 'fa-regular fa-comment',  color: 'rgba(96,165,250,0.08)' },
  friend_request:  { icon: 'fa-solid fa-user-plus',  color: 'rgba(99,102,241,0.08)' },
  friend_accepted: { icon: 'fa-solid fa-user-check', color: 'rgba(34,197,94,0.08)'  },
  prem_request:    { icon: 'fa-solid fa-heart',      color: 'rgba(244,114,182,0.08)'},
  crush_received:  { icon: '💘',                     color: 'rgba(244,114,182,0.08)'},
  crush_match:     { icon: '💑',                     color: 'rgba(34,197,94,0.08)'  },
  birthday:        { icon: '🎂',                     color: 'rgba(251,191,36,0.08)' },
  badge_approved:  { icon: 'fa-solid fa-circle-check',color:'rgba(251,191,36,0.08)'},
  job_expiring:    { icon: 'fa-solid fa-clock',       color:'rgba(239,68,68,0.08)'  },
  dm_message:      { icon: 'fa-regular fa-comment',  color: 'rgba(232,24,122,0.08)' },
}

// Sanitize HTML function
function sanitizeHTML(html: string) {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    loadNotifs()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => setNotifs(ns => [payload.new as Notification, ...ns]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  async function loadNotifs() {
    const { data } = await supabase
      .from('notifications')
      .select(`*, actor:users(id,full_name,username,avatar_url)`)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user!.id).eq('is_read', false)
    setNotifs(ns => ns.map(n => ({ ...n, is_read: true })))
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          <div className="px-[14px] py-[11px] border-b border-bdr flex items-center justify-between">
            <span className="text-[15px] font-bold">Notifications</span>
            <button onClick={markAllRead} className="text-[11.5px] font-semibold" style={{ color: 'var(--acc)' }}>
              Mark all read
            </button>
          </div>

          {loading && <div className="text-center py-[24px] text-txt3 text-[13px]"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading...</div>}

          {notifs.map(notif => {
            const style = NOTIF_ICONS[notif.type]
            const isEmoji = style?.icon && !style.icon.startsWith('fa-')
            return (
              <div key={notif.id}
                onClick={async () => {
                  await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id)
                  if (notif.link) router.push(notif.link)
                }}
                className={`flex items-start gap-[11px] px-[14px] py-[11px] border-b border-bdr cursor-pointer hover:bg-surf2 transition-colors ${!notif.is_read ? 'bg-[rgba(232,24,122,0.03)]' : ''}`}>
                <div className="w-[36px] h-[36px] rounded-[9px] flex-shrink-0 flex items-center justify-center text-[15px]" style={{ background: style?.color }}>
                  {isEmoji ? style?.icon : <i className={`${style?.icon} text-[var(--acc)]`} />}
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] leading-[1.5]">{sanitizeHTML(notif.body)}</div>
                  <div className="text-[10.5px] text-txt3 mt-[2px]">{timeAgo(notif.created_at)}</div>
                </div>
                {!notif.is_read && <div className="w-[6px] h-[6px] rounded-full flex-shrink-0 mt-[5px]" style={{ background: 'var(--acc)' }} />}
              </div>
            )
          })}

          {!loading && notifs.length === 0 && (
            <div className="text-center py-[48px] text-txt3 text-[13px]">
              <i className="fa-regular fa-bell text-[36px] block mb-[10px] opacity-30" />
              No notifications yet
            </div>
          )}
        </AppShell>
      </div>
      <BottomNav />
    </>
  )
}
