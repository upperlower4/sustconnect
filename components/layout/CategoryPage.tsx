'use client'
import { useState } from 'react'
import type { PostType, Post } from '@/types'
import AppShell from './AppShell'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import PostCard from '@/components/post/PostCard'
import CreatePost from '@/components/post/CreatePost'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

interface Props {
  type: PostType
  title: string
  icon: string
  initialPosts: Post[]
}

export default function CategoryPage({ type, title, icon, initialPosts }: Props) {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialPosts.length >= 20)
  const [page, setPage] = useState(1)

  async function loadMore() {
    if (loading || !hasMore) return
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
      .eq('type', type).eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(page * 20, page * 20 + 19)
    if (data && data.length > 0) {
      setPosts(p => [...p, ...data])
      setPage(p => p + 1)
    } else { setHasMore(false) }
    setLoading(false)
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          {/* Header */}
          <div className="sticky top-[44px] z-30 bg-surf border-b border-bdr px-[13px] py-[11px] flex items-center gap-[8px]">
            <i className={`${icon} text-[14px]`} style={{ color: 'var(--acc)' }} />
            <span className="text-[14px] font-bold">{title}</span>
            <span className="ml-auto text-[11.5px] text-txt3">{posts.length} posts</span>
          </div>

          <div className="p-[10px]">
            {user && <CreatePost onPost={() => { setPosts([]); setPage(0) }} />}

            {posts.map(p => <PostCard key={p.id} post={p} />)}

            {loading && (
              <div className="text-center py-[16px] text-txt3 text-[12.5px]">
                <i className="fa-solid fa-spinner fa-spin mr-2" />Loading...
              </div>
            )}

            {hasMore && !loading && (
              <button onClick={loadMore}
                className="w-full py-[10px] text-[12.5px] font-medium text-txt2 hover:text-txt bg-surf border border-bdr rounded-[9px] transition-colors">
                Load more
              </button>
            )}

            {!hasMore && posts.length > 0 && (
              <div className="text-center py-[16px] text-txt3 text-[12px]">— No more posts —</div>
            )}

            {posts.length === 0 && !loading && (
              <div className="text-center py-[48px] text-txt3 text-[13px]">
                <i className={`${icon} text-[36px] block mb-[10px] opacity-30`} />
                No {title.toLowerCase()} yet. Be the first!
              </div>
            )}
          </div>
        </AppShell>
      </div>
      <BottomNav />
    </>
  )
}
