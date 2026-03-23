'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'
import toast from 'react-hot-toast'

const NAV = [
  { id: 'dashboard', icon: 'fa-solid fa-chart-line', label: 'Dashboard' },
  { id: 'reports',   icon: 'fa-solid fa-flag',        label: 'Reports',  badge: 0, color: '#ef4444' },
  { id: 'badges',    icon: 'fa-solid fa-circle-check', label: 'Badges',  badge: 0, color: '#60a5fa' },
  { id: 'users',     icon: 'fa-solid fa-users',        label: 'Users' },
  { id: 'posts',     icon: 'fa-solid fa-note-sticky',  label: 'Posts' },
]

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [active, setActive] = useState('dashboard')
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0, badges: 0 })
  const [reports, setReports] = useState<any[]>([])
  const [badgeReqs, setBadgeReqs] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return }
    if (!user.is_admin) { router.push('/'); return }
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [
      { count: uCount },
      { count: pCount },
      { count: rCount },
      { count: bCount },
      { data: rData },
      { data: bData },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('badge_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select(`*, reporter:users!inner(full_name,username), post:posts!inner(id,type,content,user_id)`).eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
      supabase.from('badge_requests').select(`*, user:users!inner(id,full_name,username,avatar_url,post_count,friend_count)`).eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setStats({ users: uCount || 0, posts: pCount || 0, reports: rCount || 0, badges: bCount || 0 })
    setReports(rData || [])
    setBadgeReqs(bData || [])
    setLoading(false)
  }

  async function deletePost(postId: string) {
    await supabase.from('posts').update({ status: 'deleted' }).eq('id', postId)
    await supabase.from('reports').update({ status: 'reviewed' }).eq('post_id', postId)
    toast.success('Post deleted')
    loadData()
  }

  async function banUser(userId: string) {
    await supabase.from('users').update({ is_banned: true } as any).eq('id', userId)
    toast.success('User banned')
    loadData()
  }

  async function dismissReport(reportId: string) {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    setReports(rs => rs.filter(r => r.id !== reportId))
    toast.success('Report dismissed')
  }

  async function approveBadge(userId: string, reqId: string) {
    await Promise.all([
      supabase.from('users').update({ is_verified: true }).eq('id', userId),
      supabase.from('badge_requests').update({ status: 'approved', reviewed_by: user!.id }).eq('id', reqId),
      supabase.from('notifications').insert({
        user_id: userId, type: 'badge_approved',
        title: 'Verified Badge Approved ✅',
        body: 'Your verified badge request has been approved!',
      }),
    ])
    setBadgeReqs(bs => bs.filter(b => b.id !== reqId))
    toast.success('Badge approved!')
  }

  async function rejectBadge(userId: string, reqId: string) {
    await supabase.from('badge_requests').update({ status: 'rejected', reviewed_by: user!.id }).eq('id', reqId)
    setBadgeReqs(bs => bs.filter(b => b.id !== reqId))
    toast.success('Badge rejected')
  }

  async function pinPost(postId: string, pinned: boolean) {
    await supabase.from('posts').update({ is_pinned: pinned }).eq('id', postId)
    toast.success(pinned ? 'Post pinned!' : 'Post unpinned')
    loadData()
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px] flex min-h-[calc(100vh-44px)]">
        {/* Sidebar */}
        <div className="w-[195px] border-r border-bdr p-[14px] flex-shrink-0 hidden md:flex flex-col gap-[1px]">
          <div className="text-[14px] font-bold flex items-center gap-[6px] px-[9px] py-[7px] mb-[7px]">
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--acc)' }} /> Admin
          </div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)}
              className={`flex items-center gap-[8px] px-[9px] py-[7px] rounded-[7px] text-[12.5px] font-medium w-full transition-all ${active === n.id ? 'bg-surf2 text-txt font-semibold' : 'text-txt2 hover:bg-surf2 hover:text-txt'}`}>
              <i className={`${n.icon} w-[15px] text-[12px]`} style={n.color ? { color: n.color } : {}} />
              {n.label}
              {n.badge !== undefined && stats[n.id as keyof typeof stats] > 0 && (
                <span className="ml-auto text-[9.5px] font-bold text-white px-[5px] py-[1px] rounded-full" style={{ background: n.color || 'var(--acc)' }}>
                  {stats[n.id as keyof typeof stats]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-[18px] overflow-y-auto pb-[80px]">
          {/* Dashboard */}
          {active === 'dashboard' && (
            <>
              <div className="text-[17px] font-bold mb-[14px]">Dashboard</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[9px] mb-[20px]">
                {[
                  { label: 'Users',   n: stats.users,   color: 'var(--txt)',  icon: 'fa-solid fa-users' },
                  { label: 'Posts',   n: stats.posts,   color: '#34d399',     icon: 'fa-regular fa-note-sticky' },
                  { label: 'Reports', n: stats.reports, color: '#ef4444',     icon: 'fa-solid fa-flag' },
                  { label: 'Badges',  n: stats.badges,  color: '#60a5fa',     icon: 'fa-solid fa-circle-check' },
                ].map(({ label, n, color, icon }) => (
                  <div key={label} className="bg-surf border border-bdr rounded-[9px] p-[13px]">
                    <div className="text-[22px] font-black mb-[2px]" style={{ color }}>{n.toLocaleString()}</div>
                    <div className="text-[11px] text-txt2 flex items-center gap-[4px]">
                      <i className={`${icon} text-txt3`} /> {label}
                    </div>
                  </div>
                ))}
              </div>
              {reports.length > 0 && (
                <>
                  <div className="text-[13px] font-bold mb-[11px]">Pending Reports</div>
                  {reports.slice(0, 3).map(r => <ReportCard key={r.id} report={r} onDelete={deletePost} onBan={banUser} onDismiss={dismissReport} />)}
                </>
              )}
            </>
          )}

          {/* Reports */}
          {active === 'reports' && (
            <>
              <div className="text-[17px] font-bold mb-[14px]">Reports ({stats.reports})</div>
              {reports.length === 0 && !loading && <Empty icon="fa-solid fa-flag" text="No pending reports" />}
              {reports.map(r => <ReportCard key={r.id} report={r} onDelete={deletePost} onBan={banUser} onDismiss={dismissReport} />)}
            </>
          )}

          {/* Badges */}
          {active === 'badges' && (
            <>
              <div className="text-[17px] font-bold mb-[14px]">Badge Requests ({stats.badges})</div>
              {badgeReqs.length === 0 && !loading && <Empty icon="fa-solid fa-circle-check" text="No pending badge requests" />}
              {badgeReqs.map(b => {
                const userId = b.user?.id || b.user_id
                if (!userId) return null
                
                return (
                <div key={b.id} className="bg-surf border border-bdr rounded-[9px] p-[13px] mb-[8px]">
                  <div className="flex items-center gap-[9px] mb-[10px]">
                    <Avatar user={b.user} size="md" />
                    <div>
                      <div className="text-[13px] font-semibold">{b.user?.full_name || 'Unknown User'}</div>
                      <div className="text-[11px] text-txt2">@{b.user?.username || 'unknown'} · {timeAgo(b.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-[11.5px] text-txt2 mb-[10px] flex gap-[14px]">
                    <span><b className="text-txt">{b.user?.post_count || 0}</b> posts</span>
                    <span><b className="text-txt">{b.user?.friend_count || 0}</b> friends</span>
                  </div>
                  <div className="flex gap-[6px]">
                    <button onClick={() => approveBadge(userId, b.id)} className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[11.5px] font-semibold text-white hover:opacity-88 transition-opacity" style={{ background: '#22c55e' }}>
                      <i className="fa-solid fa-check" /> Approve
                    </button>
                    <button onClick={() => rejectBadge(userId, b.id)} className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[11.5px] font-semibold bg-surf2 border border-bdr hover:border-bdr2 transition-colors">
                      <i className="fa-solid fa-xmark" /> Reject
                    </button>
                  </div>
                </div>
                )
              })}
            </>
          )}

          {/* Users */}
          {active === 'users' && <UsersPanel />}

          {/* Posts */}
          {active === 'posts' && <PostsPanel onPin={pinPost} onDelete={deletePost} />}
        </div>
      </div>
      <BottomNav />
    </>
  )
}

function ReportCard({ report, onDelete, onBan, onDismiss }: any) {
  const userId = report.user_id || report.post?.user_id || report.user?.id
  
  return (
    <div className="bg-surf border border-bdr rounded-[9px] p-[13px] mb-[8px]">
      <div className="flex items-center gap-[9px] mb-[9px]">
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0" style={{ background: 'var(--acc)' }}>
          {report.reporter?.full_name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div className="text-[12.5px] font-semibold">Post by user</div>
          <div className="text-[11px] text-txt2">{report.count || 1} report(s) · {report.reason}</div>
        </div>
        {report.post?.type && <Badge type={report.post.type} />}
      </div>
      {report.post?.content && (
        <div className="text-[11.5px] text-txt2 bg-surf2 px-[9px] py-[7px] rounded-[6px] mb-[9px] line-clamp-2">
          {report.post.content}
        </div>
      )}
      <div className="flex gap-[5px]">
        <button onClick={() => onDelete(report.post_id)} className="flex items-center gap-[4px] px-[9px] py-[5px] rounded-[6px] text-[11.5px] font-semibold text-red-500 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 transition-colors">
          <i className="fa-solid fa-trash" /> Delete
        </button>
        <button onClick={() => onBan(userId)} className="flex items-center gap-[4px] px-[9px] py-[5px] rounded-[6px] text-[11.5px] font-semibold bg-surf2 border border-bdr text-red-500 hover:border-bdr2 transition-colors">
          <i className="fa-solid fa-ban" /> Ban
        </button>
        <button onClick={() => onDismiss(report.id)} className="flex items-center gap-[4px] px-[9px] py-[5px] rounded-[6px] text-[11.5px] font-semibold bg-surf2 border border-bdr hover:border-bdr2 transition-colors ml-auto">
          <i className="fa-solid fa-xmark" /> Dismiss
        </button>
      </div>
    </div>
  )
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers(q = '') {
    setLoading(true)
    let query = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50)
    if (q) query = query.ilike('full_name', `%${q}%`)
    const { data } = await query
    setUsers(data || [])
    setLoading(false)
  }

  return (
    <>
      <div className="text-[17px] font-bold mb-[14px]">Users</div>
      <div className="relative mb-[12px]">
        <i className="fa-solid fa-magnifying-glass absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px]" />
        <input value={search} onChange={e => { setSearch(e.target.value); loadUsers(e.target.value) }}
          placeholder="Search users..."
          className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[12px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors" />
      </div>
      {loading && <div className="text-center py-[20px] text-txt3"><i className="fa-solid fa-spinner fa-spin" /></div>}
      <div className="space-y-[1px]">
        {users.map(u => {
                if (!u?.id) return null
                
                return (
                <div key={u.id} className="flex items-center gap-[9px] bg-surf border border-bdr rounded-[8px] px-[12px] py-[9px]">
                  <Avatar user={u} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold flex items-center gap-[5px]">
                      {u.full_name || 'Unknown User'}
                      {u.is_verified && <i className="fa-solid fa-circle-check text-[#60a5fa] text-[10px]" />}
                      {u.is_admin && <span className="text-[9px] font-bold px-[5px] py-[1px] rounded-full text-white" style={{ background: 'var(--acc)' }}>ADMIN</span>}
                    </div>
                    <div className="text-[11px] text-txt2">@{u.username || 'unknown'} · {u.department || 'Unknown'}</div>
                  </div>
                  <div className="text-[11px] text-txt3">{new Date(u.created_at).toLocaleDateString()}</div>
                </div>
                )
              })}
      </div>
    </>
  )
}

function PostsPanel({ onPin, onDelete }: any) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadPosts() }, [])

  async function loadPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('posts')
      .select(`*, user:users!inner(full_name, username)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)
    setPosts(data || [])
    setLoading(false)
  }

  return (
    <>
      <div className="text-[17px] font-bold mb-[14px]">All Posts</div>
      {loading && <div className="text-center py-[20px] text-txt3"><i className="fa-solid fa-spinner fa-spin" /></div>}
      <div className="space-y-[8px]">
        {posts.map(p => {
                const userId = p.user?.id || p.user_id
                if (!userId) return null
                
                return (
                <div key={p.id} className="bg-surf border border-bdr rounded-[9px] p-[12px]">
                  <div className="flex items-center gap-[8px] mb-[7px]">
                    <Badge type={p.type} />
                    <span className="text-[12px] font-semibold">{p.user?.full_name || 'Unknown User'}</span>
                    <span className="text-[11px] text-txt3 ml-auto">{timeAgo(p.created_at)}</span>
                  </div>
                  <div className="text-[12.5px] text-txt2 line-clamp-2 mb-[9px]">{p.content}</div>
                  <div className="flex gap-[5px]">
                    <button onClick={() => { onPin(p.id, !p.is_pinned); setPosts(ps => ps.map(x => x.id === p.id ? { ...x, is_pinned: !p.is_pinned } : x)) }}
                      className={`flex items-center gap-[4px] px-[9px] py-[4px] rounded-[6px] text-[11px] font-semibold border transition-colors ${p.is_pinned ? 'bg-[rgba(232,24,122,0.1)] text-[var(--acc)] border-[rgba(232,24,122,0.2)]' : 'bg-surf2 border-bdr hover:border-bdr2'}`}>
                      <i className="fa-solid fa-thumbtack" /> {p.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => { onDelete(p.id); setPosts(ps => ps.filter(x => x.id !== p.id)) }}
                      className="flex items-center gap-[4px] px-[9px] py-[4px] rounded-[6px] text-[11px] font-semibold text-red-500 bg-red-500/8 border border-red-500/15 hover:bg-red-500/15 transition-colors">
                      <i className="fa-solid fa-trash" /> Delete
                    </button>
                  </div>
                </div>
                )
              })}
      </div>
    </>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-[40px] text-txt3 text-[13px]">
      <i className={`${icon} text-[32px] block mb-[8px] opacity-30`} />
      {text}
    </div>
  )
}
