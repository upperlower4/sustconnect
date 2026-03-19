'use client'
import { useState, useEffect } from 'react'
import type { Post } from '@/types'
import { useAuthStore } from '@/lib/store'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import CreatePost from '@/components/post/CreatePost'
import PostCard from '@/components/post/PostCard'
import GuestBanner from '@/components/layout/GuestBanner'
import { supabase } from '@/lib/supabase'

const TABS = ['For You', 'Friends', 'Trending']

export default function FeedClient({ initialPosts }: { initialPosts: Post[] }) {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [tab, setTab] = useState('For You')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20)

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
      .eq('status', 'active')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(page * 20, page * 20 + 19)
    if (data && data.length > 0) { setPosts(p => [...p, ...data]); setPage(p => p + 1) }
    else setHasMore(false)
    setLoading(false)
  }

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) loadMore()
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [page, loading, hasMore])

  const guestPadding = !user ? 'pt-[80px]' : 'pt-[44px]'

  return (
    <>
      <TopBar />
      {!user && <GuestBanner />}
      <div className={guestPadding}>
        <AppShell>
          <div className="sticky z-30 flex border-b" style={{ top: '44px', background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-[12px] text-[13px] font-medium border-b-2 transition-all"
                style={{ color: tab === t ? 'var(--txt)' : 'var(--txt2)', borderColor: tab === t ? 'var(--acc)' : 'transparent', fontWeight: tab === t ? 600 : 500 }}>
                {t}
              </button>
            ))}
          </div>
          <div className="p-[10px]">
            {user && <CreatePost onPost={() => { setPosts([]); setPage(0) }} />}
            {posts.map(p => <PostCard key={p.id} post={p} />)}
            {loading && <div className="text-center py-[20px] text-[13px]" style={{ color: 'var(--txt3)' }}><i className="fa-solid fa-spinner fa-spin mr-2" />Loading...</div>}
            {!hasMore && posts.length > 0 && <div className="text-center py-[20px] text-[12px]" style={{ color: 'var(--txt3)' }}>— End of feed —</div>}
          </div>
        </AppShell>
      </div>
      <BottomNav />
    </>
  )
}
