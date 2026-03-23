'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Post } from '@/types'
import { timeAgo, truncate, formatCount } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Lightbox from '@/components/ui/Lightbox'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuthStore()
  const [isLoved, setIsLoved] = useState<boolean>(false)
  const [loveCount, setLoveCount] = useState(post.love_count)
  const [viewCount, setViewCount] = useState(post.view_count)
  const [loveAnim, setLoveAnim] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [lbSrc, setLbSrc] = useState<string | null>(null)
  const isConf = post.type === 'confession'
  const { text, truncated } = truncate(post.content)

  useEffect(() => {
    setMounted(true)

    // ✅ FIX: Love state Supabase থেকে load করা
    async function loadLoveState() {
      if (user) {
        const { data } = await supabase
          .from('post_loves')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single()
        setIsLoved(!!data)
      }
    }
    loadLoveState()

    // ✅ FIX: View count 2 সেকেন্ড পর update হবে এবং frontend এও দেখাবে
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id }),
        })
        const data = await res.json()
        if (data.ok) setViewCount(v => v + 1)
      } catch {}
    }, 2000)

    return () => clearTimeout(timer)
  }, [post.id, user])

  async function handleLove() {
    if (!user) {
      toast('❤️ Love করতে Sign Up করো!', { icon: '🔒' })
      return
    }

    // ✅ FIX: Optimistic update — আগে UI update করো, তারপর DB
    const newLoved = !isLoved
    setIsLoved(newLoved)
    setLoveCount(c => newLoved ? c + 1 : c - 1) // ✅ সাথে সাথে counter update হবে

    if (newLoved) {
      setLoveAnim(true)
      setTimeout(() => setLoveAnim(false), 400)
    }

    try {
      if (newLoved) {
        await supabase.from('post_loves').insert({ post_id: post.id, user_id: user.id })
      } else {
        await supabase.from('post_loves').delete().eq('post_id', post.id).eq('user_id', user.id)
      }
    } catch (err) {
      // ✅ DB error হলে UI আবার আগের state এ ফিরিয়ে দাও
      setIsLoved(!newLoved)
      setLoveCount(c => newLoved ? c - 1 : c + 1)
      toast.error('Something went wrong!')
    }
  }

  // ✅ FIX: Share button কাজ করবে
  async function handleShare() {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SUST Connect', text: post.content.slice(0, 100), url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied! 📋')
      }
    } catch {}
  }

  const heartIcon = mounted && isLoved ? 'fa-solid fa-heart' : 'fa-regular fa-heart'
  const heartColor = mounted && isLoved ? 'var(--acc)' : 'var(--txt2)'

  return (
    <>
      <article
        className="rounded-[11px] mb-[9px] overflow-hidden border transition-colors"
        style={{
          background: isConf ? 'linear-gradient(155deg,#0e0912,#180d1a)' : 'var(--surf)',
          borderColor: isConf ? 'rgba(244,114,182,0.18)' : post.is_pinned ? 'rgba(232,24,122,0.2)' : 'var(--bdr)',
        }}
      >
        {isConf && <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#f472b6,transparent)' }} />}

        {post.is_pinned && (
          <div className="flex items-center gap-[5px] px-[13px] py-[5px] text-[10.5px] font-bold border-b"
            style={{ background: 'rgba(232,24,122,0.05)', color: 'var(--acc)', borderColor: 'rgba(232,24,122,0.1)' }}>
            <i className="fa-solid fa-thumbtack text-[9px]" /> Pinned
          </div>
        )}

        <div className="flex items-center gap-[9px] px-[13px] pt-[11px] pb-[7px]">
          {isConf
            ? <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#4a044e,#7c1560)' }}>
                <i className="fa-solid fa-mask text-white text-[13px]" />
              </div>
            : <Avatar user={post.user} size="md" />}
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-bold flex items-center gap-[5px] truncate" style={{ color: 'var(--txt)' }}>
              {isConf
                ? <span style={{ color: 'var(--txt2)' }}>Anonymous</span>
                : <Link href={`/profile/${post.user?.username}`} className="hover:underline">{post.user?.full_name}</Link>}
              {post.user?.is_verified && !isConf && <i className="fa-solid fa-circle-check text-[#60a5fa] text-[11px]" />}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--txt2)' }}>
              {!isConf && `${post.user?.department} · ${post.user?.session} · `}{timeAgo(post.created_at)}
            </div>
          </div>
          <Badge type={post.type} />
          <button className="p-1 text-[13px]" style={{ color: 'var(--txt3)' }}>
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>

        {post.type === 'job'     && <JobCard post={post} />}
        {post.type === 'tuition' && <TuitionCard post={post} />}
        {post.type === 'sell'    && <SellCard post={post} />}

        {isConf
          ? <div className="mx-[13px] mb-[9px] p-[13px] border-l-2 border-[#f472b6] rounded-r-[7px] text-[13.5px] leading-[1.72] italic"
              style={{ background: 'rgba(244,114,182,0.05)', color: 'var(--txt)' }}>
              {text}
              {truncated && <Link href={`/post/${post.id}`} className="ml-1 text-[12px] font-medium" style={{ color: 'var(--acc)' }}>See more</Link>}
            </div>
          : post.content && (
            <div className="px-[13px] pb-[9px] text-[13.5px] leading-[1.65]" style={{ color: 'var(--txt)' }}>
              {text}
              {truncated && <Link href={`/post/${post.id}`} className="ml-1 text-[12px] font-medium" style={{ color: 'var(--acc)' }}>See more</Link>}
            </div>
          )}

        {post.image_url && (
          <div className="relative overflow-hidden">
            <img src={post.image_url} alt="Post"
              className="w-full max-h-[360px] object-cover block cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLbSrc(post.image_url!)} />
            <div className="absolute bottom-2 right-2 text-white text-[10px] px-2 py-[2px] rounded-full pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <i className="fa-solid fa-expand mr-1" />Full view
            </div>
          </div>
        )}

        <div className="flex border-t" style={{ borderColor: 'var(--bdr)' }}>
          {/* ✅ Love button — counter সাথে সাথে update হবে */}
          <button onClick={handleLove}
            className="flex-1 flex items-center justify-center gap-[5px] py-[10px] text-[12px] font-medium transition-colors"
            style={{ color: heartColor }}>
            <i className={`${heartIcon} ${loveAnim ? 'animate-heart' : ''}`} />
            <span>{loveCount}</span>
          </button>

          <Link href={`/post/${post.id}`}
            className="flex-1 flex items-center justify-center gap-[5px] py-[10px] text-[12px] font-medium transition-colors"
            style={{ color: 'var(--txt2)' }}>
            <i className="fa-regular fa-comment" />
            <span>{post.comment_count}</span>
          </Link>

          {/* ✅ Share button — এখন কাজ করবে */}
          <button onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-[5px] py-[10px] text-[12px] font-medium"
            style={{ color: 'var(--txt2)' }}>
            <i className="fa-solid fa-share-nodes" />
          </button>

          {/* ✅ View count — সঠিকভাবে দেখাবে */}
          <div className="flex items-center justify-center gap-[5px] py-[10px] px-3 text-[11px]"
            style={{ color: 'var(--txt3)' }}>
            <i className="fa-regular fa-eye" />
            <span>{formatCount(viewCount)}</span>
          </div>
        </div>
      </article>

      {lbSrc && <Lightbox src={lbSrc} onClose={() => setLbSrc(null)} />}
    </>
  )
}

function IRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[6px] text-[11.5px] mt-[4px]" style={{ color: 'var(--txt2)' }}>
      <i className={`${icon} w-[11px] flex-shrink-0 text-[10.5px]`} style={{ color: 'var(--txt3)' }} />
      {children}
    </div>
  )
}

function JobCard({ post }: { post: Post }) {
  return (
    <div className="mx-[13px] mb-[7px] p-[11px] rounded-[8px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
      <div className="text-[12.5px] font-bold mb-[7px] flex items-center gap-[6px] text-[#34d399]">
        <i className="fa-solid fa-briefcase" /> {post.job_title} — {post.company}
      </div>
      {post.job_type      && <IRow icon="fa-solid fa-layer-group">{post.job_type}</IRow>}
      {post.salary_range  && <IRow icon="fa-solid fa-bangladeshi-taka-sign">{post.salary_range}</IRow>}
      {post.qualification && <IRow icon="fa-solid fa-graduation-cap">{post.qualification}</IRow>}
      {post.expires_at    && <IRow icon="fa-regular fa-calendar">Deadline: {new Date(post.expires_at).toLocaleDateString('en-BD')}</IRow>}
      {post.contact       && <IRow icon="fa-regular fa-envelope">{post.contact}</IRow>}
    </div>
  )
}

function TuitionCard({ post }: { post: Post }) {
  return (
    <div className="mx-[13px] mb-[7px] p-[11px] rounded-[8px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
      <div className="text-[12.5px] font-bold mb-[7px] flex items-center gap-[6px] text-[#fbbf24]">
        <i className="fa-solid fa-book" /> {post.tuition_type === 'available' ? 'Tutor Available' : 'Need a Tutor'} — {post.subjects}
      </div>
      {post.level    && <IRow icon="fa-solid fa-graduation-cap">{post.level}</IRow>}
      {post.rate     && <IRow icon="fa-solid fa-bangladeshi-taka-sign">{post.rate}</IRow>}
      {post.location && <IRow icon="fa-solid fa-location-dot">{post.location}</IRow>}
      {post.contact  && <IRow icon="fa-brands fa-whatsapp">{post.contact}</IRow>}
    </div>
  )
}

function SellCard({ post }: { post: Post }) {
  return (
    <div className="mx-[13px] mb-[7px] p-[11px] rounded-[8px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
      <div className="text-[12.5px] font-bold mb-[7px] flex items-center gap-[6px] text-[#a78bfa]">
        <i className="fa-solid fa-tag" /> {post.item_name} — For Sale
      </div>
      {post.price    && <IRow icon="fa-solid fa-bangladeshi-taka-sign"><b className="text-[14px] text-[#a78bfa]">৳{post.price}</b></IRow>}
      {post.category && <IRow icon="fa-solid fa-box">{post.category} · {post.condition}</IRow>}
      {post.contact  && <IRow icon="fa-brands fa-whatsapp">{post.contact}</IRow>}
    </div>
  )
}