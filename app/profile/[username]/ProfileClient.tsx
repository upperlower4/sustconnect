'use client'
import { useState } from 'react'
import type { User, Post } from '@/types'
import { useAuthStore } from '@/lib/store'
import { formatDOB } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/post/PostCard'
import Avatar from '@/components/ui/Avatar'
import Lightbox from '@/components/ui/Lightbox'
import toast from 'react-hot-toast'

const TABS = ['Posts', 'Jobs', 'Sells', 'Friends']

interface Props { profileUser: User; initialPosts: Post[] }

export default function ProfileClient({ profileUser, initialPosts }: Props) {
  const { user: me } = useAuthStore()
  const [activeTab, setActiveTab] = useState('Posts')
  const [lbOpen, setLbOpen] = useState(false)
  const isOwnProfile = me?.id === profileUser.id
  const showPrem = me && me.gender !== profileUser.gender

  function handleProtected(action: string) {
    if (!me) { toast(`${action} করতে Sign Up করো!`, { icon: '🔒' }); return false }
    return true
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          {/* Cover */}
          <div className="h-[150px] bg-surf2 border-b border-bdr relative">
            {isOwnProfile && (
              <button className="absolute top-[9px] right-[9px] flex items-center gap-[5px] px-[10px] py-[5px] bg-surf2 border border-bdr rounded-[6px] text-[12px] font-semibold text-txt2 hover:border-bdr2 transition-colors">
                <i className="fa-solid fa-camera" /> Edit
              </button>
            )}
          </div>

          {/* Profile info */}
          <div className="px-[18px] pb-[14px] bg-surf border-b border-bdr">
            <div className="flex items-end justify-between mt-[-30px] mb-[9px]">
              {/* Avatar — click for full size */}
              <div className="relative">
                <div
                  className="w-[76px] h-[76px] rounded-full border-[3px] border-surf cursor-pointer hover:opacity-88 transition-opacity overflow-hidden flex items-center justify-center font-bold text-white text-[22px]"
                  style={{ background: 'var(--acc)' }}
                  onClick={() => profileUser.avatar_url && setLbOpen(true)}
                  title={profileUser.avatar_url ? 'Click to view full size' : ''}
                >
                  {profileUser.avatar_url
                    ? <img src={profileUser.avatar_url} alt={profileUser.full_name} className="w-full h-full object-cover" />
                    : profileUser.full_name.slice(0,2).toUpperCase()}
                </div>
                {isOwnProfile && (
                  <div className="absolute bottom-[3px] right-[3px] w-5 h-5 bg-surf2 border-2 border-surf rounded-full flex items-center justify-center text-[9px] text-txt2 cursor-pointer">
                    <i className="fa-solid fa-camera" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-[5px] items-center">
                {!isOwnProfile && (
                  <>
                    <button onClick={() => handleProtected('Message')} className="w-[30px] h-[30px] rounded-[7px] bg-surf2 border border-bdr text-[13px] flex items-center justify-center hover:border-bdr2 transition-colors">
                      <i className="fa-regular fa-comment" />
                    </button>
                    {showPrem && (
                      <button onClick={() => handleProtected('Prem Request')} className="w-[30px] h-[30px] rounded-[7px] bg-surf2 border border-bdr text-[13px] flex items-center justify-center hover:border-bdr2 transition-colors" style={{ color: '#f472b6' }}>
                        <i className="fa-solid fa-heart" />
                      </button>
                    )}
                    <button onClick={() => handleProtected('Friend Request')} className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold text-white hover:opacity-88 transition-opacity" style={{ background: 'var(--acc)' }}>
                      <i className="fa-solid fa-user-plus" /> Add Friend
                    </button>
                  </>
                )}
                {isOwnProfile && (
                  <button className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold bg-surf2 border border-bdr hover:border-bdr2 transition-colors">
                    <i className="fa-solid fa-pen" /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="text-[17px] font-bold flex items-center gap-[5px]">
              {profileUser.full_name}
              {profileUser.is_verified && <i className="fa-solid fa-circle-check text-[#60a5fa] text-[15px]" />}
            </div>
            <div className="text-[12.5px] text-txt2 mt-[2px]">@{profileUser.username}</div>

            {/* Meta */}
            <div className="flex gap-[12px] mt-[7px] flex-wrap">
              <MetaItem icon="fa-solid fa-building-columns" text={profileUser.department} />
              <MetaItem icon="fa-solid fa-calendar-days" text={profileUser.session} />
              <MetaItem icon="fa-solid fa-id-card" text={`Roll: ${profileUser.board_roll}`} />
              <MetaItem icon="fa-solid fa-venus-mars" text={profileUser.gender} />
              <MetaItem icon="fa-regular fa-calendar" text={`DOB: ${formatDOB(profileUser.dob_day, profileUser.dob_month, profileUser.dob_year)}`} />
            </div>

            {/* Stats */}
            <div className="flex gap-[18px] mt-[10px]">
              <Stat n={profileUser.post_count || 0} label="Posts" />
              <Stat n={profileUser.friend_count || 0} label="Friends" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-surf border-b border-bdr sticky top-[44px] z-10">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-[11px] text-[12px] font-semibold transition-all border-b-2 ${activeTab === tab ? 'text-txt border-[var(--acc)]' : 'text-txt2 border-transparent'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Posts */}
          <div className="p-[10px]">
            {activeTab === 'Posts' && initialPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
            {activeTab === 'Posts' && initialPosts.length === 0 && (
              <div className="text-center py-[40px] text-txt3 text-[13px]">
                <i className="fa-regular fa-note-sticky text-[32px] block mb-[8px] opacity-30" />No posts yet
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
    <div className="text-center">
      <div className="text-[17px] font-bold">{n}</div>
      <div className="text-[11px] text-txt2 mt-[1px]">{label}</div>
    </div>
  )
}
