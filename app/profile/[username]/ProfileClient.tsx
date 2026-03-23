'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Post } from '@/types'
import { useAuthStore, useDMStore } from '@/lib/store'
import { formatDOB } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/post/PostCard'
import Avatar from '@/components/ui/Avatar'
import Lightbox from '@/components/ui/Lightbox'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

const TABS = ['Posts', 'Jobs', 'Sells', 'Friends']

export interface Props { profileUser: User; initialPosts: Post[] }

export default function ProfileClient({ profileUser, initialPosts }: Props) {
  const { user: me } = useAuthStore()
  const { openThread } = useDMStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Posts')
  const [lbOpen, setLbOpen] = useState(false)
  const isOwnProfile = me?.id === profileUser.id
  const showPrem = me && me.gender !== profileUser.gender

  const [friendStatus, setFriendStatus] = useState<string | null>(null)
  const [premStatus, setPremStatus] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  useEffect(() => {
    if (!me || isOwnProfile) {
      setStatusLoading(false)
      return
    }

    async function loadFriendStatus() {
      const { data } = await supabase
        .from('friendships')
        .select('status, type')
        .or(
          `and(user_id.eq.${me!.id},friend_id.eq.${profileUser.id}),and(user_id.eq.${profileUser.id},friend_id.eq.${me!.id})`
        )

      if (data && data.length > 0) {
        for (const f of data) {
          if (f.type === 'friend') setFriendStatus(f.status)
          if (f.type === 'prem') setPremStatus(f.status)
        }
      }
      setStatusLoading(false)
    }

    loadFriendStatus()

    // Real-time subscription for friendship status updates
    const channel = supabase
      .channel(`friendship_${me.id}_${profileUser.id}`)
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'friendships',
          filter: `or(user_id=eq.${me.id},friend_id=eq.${me.id}),or(user_id=eq.${profileUser.id},friend_id=eq.${profileUser.id})`
        },
        () => {
          loadFriendStatus() // Refetch status when changes happen
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [me, profileUser.id, isOwnProfile])

  async function cancelFriendRequest() {
    if (!me) return

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', me.id)
        .eq('friend_id', profileUser.id)
        .eq('type', 'friend')
        .eq('status', 'pending')

      if (error) throw error

      setFriendStatus(null)
      toast.success('Friend Request বাতিল করা হয়েছে!')
    } catch (err: any) { toast.error(err.message) }
  }

  async function cancelPremRequest() {
    if (!me) return

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', me.id)
        .eq('friend_id', profileUser.id)
        .eq('type', 'prem')
        .eq('status', 'pending')

      if (error) throw error

      setPremStatus(null)
      toast.success('Prem Request বাতিল করা হয়েছে!')
    } catch (err: any) { toast.error(err.message) }
  }

  async function sendFriendRequest() {
    if (!me) { toast('Friend Request করতে Sign Up করো!', { icon: '🔒' }); return }
    if (friendStatus) return

    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: me.id,
        friend_id: profileUser.id,
        type: 'friend',
        status: 'pending'
      })
      if (error) {
        if (error.code === '23505') { toast.error('Already sent!'); return }
        throw error
      }

      await supabase.from('notifications').insert({
        user_id: profileUser.id,
        type: 'friend_request',
        title: 'Friend Request',
        body: `<b>${me.full_name}</b> তোমাকে friend request পাঠিয়েছে।`,
        link: `/profile/${me.username}`,
        actor_id: me.id,
      })

      setFriendStatus('pending')
      toast.success('🤝 Friend Request পাঠানো হয়েছে!')
    } catch (err: any) { toast.error(err.message) }
  }

  async function sendPremRequest() {
    if (!me) { toast('Prem Request করতে Sign Up করো!', { icon: '🔒' }); return }
    if (premStatus) return

    try {
      const { error } = await supabase.from('friendships').insert({
        user_id: me.id,
        friend_id: profileUser.id,
        type: 'prem',
        status: 'pending'
      })
      if (error) {
        if (error.code === '23505') { toast.error('Already sent!'); return }
        throw error
      }

      await supabase.from('notifications').insert({
        user_id: profileUser.id,
        type: 'prem_request',
        title: 'Prem Request 💕',
        body: `<b>${me.full_name}</b> তোমাকে prem request পাঠিয়েছে।`,
        link: `/profile/${me.username}`,
        actor_id: me.id,
      })

      setPremStatus('pending')
      toast.success('💕 Prem Request পাঠানো হয়েছে!')
    } catch (err: any) { toast.error(err.message) }
  }

  async function startDM() {
    if (!me) { toast('Message করতে Sign Up করো!', { icon: '🔒' }); return }
    try {
      // Check if thread already exists
      const { data: existing } = await supabase
        .from('dm_threads')
        .select('id')
        .contains('participant_ids', [me.id, profileUser.id])
        .maybeSingle()

      let threadId = existing?.id

      if (!existing) {
        // Create new thread
        const { data: newThread, error } = await supabase.from('dm_threads').insert({
          participant_ids: [me.id, profileUser.id],
          is_request: friendStatus === 'accepted' ? false : true
        }).select('id').single()

        if (error) throw error
        threadId = newThread.id
      }

      if (window.innerWidth >= 768) {
        // Desktop: Open side DM
        const { openThread } = useDMStore.getState()
        openThread(threadId)
      } else {
        // Mobile: Navigate to DM page
        router.push('/dm')
      }
    } catch (err: any) { toast.error(err.message) }
  }

  function getFriendButton() {
    if (statusLoading) {
      return (
        <button disabled
          className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold text-white opacity-60"
          style={{ background: 'var(--acc)' }}>
          <i className="fa-solid fa-spinner fa-spin" />
        </button>
      )
    }
    if (friendStatus === 'accepted') {
      return (
        <button disabled
          className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold text-white"
          style={{ background: '#22c55e' }}>
          <i className="fa-solid fa-user-check" /> Friends
        </button>
      )
    }
    if (friendStatus === 'pending') {
      return (
        <div className="flex gap-[5px]">
          <button onClick={cancelFriendRequest}
            className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold border border-red-500 text-red-500 hover:bg-red-50 transition-colors">
            <i className="fa-solid fa-times" /> Cancel
          </button>
          <button disabled
            className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold bg-surf2 border border-bdr text-txt2">
            <i className="fa-solid fa-clock" /> Pending
          </button>
        </div>
      )
    }
    return (
      <button onClick={sendFriendRequest}
        className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold text-white hover:opacity-88 transition-opacity"
        style={{ background: 'var(--acc)' }}>
        <i className="fa-solid fa-user-plus" /> Add Friend
      </button>
    )
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          <div className="px-[18px] pt-[18px] pb-[14px] bg-surf border-b border-bdr">
            <div className="flex items-end justify-between mb-[9px]">
              <div
                className="w-[76px] h-[76px] rounded-full border-[3px] border-surf cursor-pointer hover:opacity-88 transition-opacity overflow-hidden flex items-center justify-center font-bold text-white text-[22px]"
                style={{ background: 'var(--acc)' }}
                onClick={() => profileUser.avatar_url && setLbOpen(true)}
              >
                {profileUser.avatar_url
                  ? <img src={profileUser.avatar_url} alt={profileUser.full_name} className="w-full h-full object-cover" />
                  : profileUser.full_name.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex gap-[5px] items-center">
                {!isOwnProfile && (
                  <>
                    <button onClick={startDM}
                      className="w-[30px] h-[30px] rounded-[7px] bg-surf2 border border-bdr text-[13px] flex items-center justify-center hover:border-bdr2 transition-colors">
                      <i className="fa-regular fa-comment" />
                    </button>

                    {showPrem && (
                      premStatus === 'pending' ? (
                        <div className="flex gap-[5px]">
                          <button onClick={cancelPremRequest}
                            className="w-[30px] h-[30px] rounded-[7px] border border-red-500 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                            title="Cancel Prem Request">
                            <i className="fa-solid fa-times text-[11px]" />
                          </button>
                          <button disabled
                            className="w-[30px] h-[30px] rounded-[7px] bg-surf2 border border-bdr text-[13px] flex items-center justify-center opacity-50">
                            <i className="fa-solid fa-clock" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={premStatus === 'pending' ? cancelPremRequest : sendPremRequest}
                          disabled={premStatus === 'accepted'}
                          className="w-[30px] h-[30px] rounded-[7px] bg-surf2 border border-bdr text-[13px] flex items-center justify-center hover:border-bdr2 transition-colors disabled:opacity-50"
                          style={{ color: '#f472b6' }}>
                          <i className={premStatus === 'accepted' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
                        </button>
                      )
                    )}

                    {getFriendButton()}
                  </>
                )}

                {isOwnProfile && (
                  <Link href="/settings"
                    className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold bg-surf2 border border-bdr hover:border-bdr2 transition-colors">
                    <i className="fa-solid fa-pen" /> Edit Profile
                  </Link>
                )}
              </div>
            </div>

            <div className="text-[17px] font-bold flex items-center gap-[5px]">
              {profileUser.full_name}
              {profileUser.is_verified && <i className="fa-solid fa-circle-check text-[#60a5fa] text-[15px]" />}
            </div>
            <div className="text-[12.5px] text-txt2 mt-[2px]">@{profileUser.username}</div>

            {profileUser.bio && (
              <div className="text-[12.5px] text-txt mt-[6px]">{profileUser.bio}</div>
            )}

            <div className="flex gap-[12px] mt-[7px] flex-wrap">
              <MetaItem icon="fa-solid fa-building-columns" text={profileUser.department} />
              <MetaItem icon="fa-solid fa-calendar-days" text={profileUser.session} />
              {profileUser.board_roll && <MetaItem icon="fa-solid fa-id-card" text={`Roll: ${profileUser.board_roll}`} />}
              <MetaItem icon="fa-solid fa-venus-mars" text={profileUser.gender} />
              <MetaItem icon="fa-regular fa-calendar" text={`DOB: ${formatDOB(profileUser.dob_day, profileUser.dob_month, profileUser.dob_year)}`} />
            </div>

            {(profileUser.facebook_url || profileUser.instagram_url) && (
              <div className="flex gap-[8px] mt-[8px]">
                {profileUser.facebook_url && (
                  <a href={profileUser.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] text-txt3 hover:text-[#60a5fa] transition-colors">
                    <i className="fa-brands fa-facebook" />
                  </a>
                )}
                {profileUser.instagram_url && (
                  <a href={profileUser.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] text-txt3 hover:text-[#f472b6] transition-colors">
                    <i className="fa-brands fa-instagram" />
                  </a>
                )}
              </div>
            )}

            <div className="flex gap-[18px] mt-[10px]">
              <Stat n={profileUser.post_count || 0} label="Posts" />
              <Stat n={profileUser.friend_count || 0} label="Friends" />
            </div>
          </div>

          <div className="flex bg-surf border-b border-bdr sticky top-[44px] z-10">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-[11px] text-[12px] font-semibold transition-all border-b-2 ${activeTab === tab ? 'text-txt border-[var(--acc)]' : 'text-txt2 border-transparent'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-[10px]">
            {activeTab === 'Posts' && initialPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            {activeTab === 'Posts' && initialPosts.length === 0 && (
              <div className="text-center py-[40px] text-txt3 text-[13px]">
                <i className="fa-regular fa-note-sticky text-[32px] block mb-[8px] opacity-30" />
                No posts yet
              </div>
            )}
            {activeTab !== 'Posts' && (
              <div className="text-center py-[40px] text-txt3 text-[13px]">
                <i className="fa-solid fa-clock text-[32px] block mb-[8px] opacity-30" />
                Coming soon...
              </div>
            )}
          </div>
        </AppShell>
      </div>
      <BottomNav />
      {lbOpen && profileUser.avatar_url && <Lightbox src={profileUser.avatar_url} onClose={() => setLbOpen(false)} />}
    </>
  )
}

function MetaItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span className="text-[11.5px] text-txt2 flex items-center gap-[3px]">
      <i className={icon} /> {text}
    </span>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="text-[17px] font-bold">{n}</div>
      <div className="text-[11px] text-txt2 mt-[1px]">{label}</div>
    </div>
  )
}