'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/post/PostCard'
import Avatar from '@/components/ui/Avatar'
import { useDebounce } from '@/hooks/useDebounce'

// Force dynamic rendering to prevent memory issues
export const dynamic = 'force-dynamic'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState<'posts'|'users'>('posts')
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (!debouncedQuery.trim()) { setPosts([]); setUsers([]); return }
    doSearch(debouncedQuery)
  }, [debouncedQuery])

  async function doSearch(q: string) {
    setLoading(true)
    const [{ data: p }, { data: u }] = await Promise.all([
      supabase.from('posts')
        .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
        .eq('status', 'active')
        .ilike('content', `%${q}%`)
        .not('type', 'eq', 'confession')
        .limit(20),
      supabase.from('users')
        .select('*')
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,department.ilike.%${q}%`)
        .limit(20),
    ])
    setPosts(p || [])
    setUsers(u || [])
    setLoading(false)
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          <div className="p-[12px]">
            <div className="relative mb-[12px]">
              <i className="fa-solid fa-magnifying-glass absolute left-[12px] top-1/2 -translate-y-1/2 text-txt3 text-[13px]" />
              <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
                placeholder="Search posts, people, jobs..."
                className="w-full bg-surf border border-bdr rounded-[9px] py-[10px] pl-[36px] pr-[12px] text-[14px] placeholder:text-txt3 focus:border-[var(--acc)] transition-colors" style={{ color: 'var(--txt)' }} />
              {loading && <i className="fa-solid fa-spinner fa-spin absolute right-[12px] top-1/2 -translate-y-1/2 text-txt3 text-[13px]" />}
            </div>

            {query && (
              <div className="flex bg-surf2 rounded-[8px] p-[3px] gap-[3px] mb-[12px]">
                {(['posts','users'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-[7px] rounded-[6px] text-[13px] font-medium capitalize transition-all ${tab === t ? 'bg-surf shadow-sm text-txt font-semibold' : 'text-txt2'}`}>
                    {t} ({t === 'posts' ? posts.length : users.length})
                  </button>
                ))}
              </div>
            )}

            {tab === 'posts' && posts.map(p => <PostCard key={p.id} post={p} />)}

            {tab === 'users' && users.map(u => (
              <Link key={u.id} href={`/profile/${u.username}`}
                className="flex items-center gap-[10px] bg-surf border border-bdr rounded-[9px] px-[13px] py-[10px] mb-[8px] hover:border-bdr2 transition-colors block">
                <div className="flex items-center gap-[10px]">
                  <Avatar user={u} size="md" />
                  <div>
                    <div className="text-[13.5px] font-semibold flex items-center gap-[5px]">
                      {u.full_name}
                      {u.is_verified && <i className="fa-solid fa-circle-check text-[#60a5fa] text-[11px]" />}
                    </div>
                    <div className="text-[11.5px] text-txt2">@{u.username} · {u.department} · {u.session}</div>
                  </div>
                </div>
              </Link>
            ))}

            {!loading && query && posts.length === 0 && users.length === 0 && (
              <div className="text-center py-[40px] text-txt3 text-[13px]">
                <i className="fa-solid fa-magnifying-glass text-[32px] block mb-[8px] opacity-30" />
                No results for "{query}"
              </div>
            )}

            {!query && (
              <div className="text-center py-[48px] text-txt3 text-[13px]">
                <i className="fa-solid fa-magnifying-glass text-[36px] block mb-[10px] opacity-30" />
                Search for posts, people, jobs, tuition...
              </div>
            )}
          </div>
        </AppShell>
      </div>
      <BottomNav />
    </>
  )
}
