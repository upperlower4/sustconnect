'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Post, Comment } from '@/types'
import { useAuthStore } from '@/lib/store'
import { timeAgo } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import PostCard from '@/components/post/PostCard'
import Avatar from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Props { post: Post; initialComments: Comment[] }

export default function PostDetailClient({ post, initialComments }: Props) {
  const { user } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function submitComment() {
    if (!user) { toast('Comment করতে Sign Up করো!', { icon: '🔒' }); return }
    if (!commentText.trim()) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        content: commentText.trim(),
        parent_id: replyTo?.id || null,
      }).select(`*, user:users(id,full_name,username,avatar_url)`).single()

      if (error) throw error
      if (replyTo) {
        setComments(cs => cs.map(c => c.id === replyTo.id
          ? { ...c, replies: [...(c.replies || []), data] }
          : c))
      } else {
        setComments(cs => [...cs, { ...data, replies: [] }])
      }
      setCommentText('')
      setReplyTo(null)
      toast.success('Comment করা হয়েছে!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          <div className="p-[10px]">
            <Link href="/" className="inline-flex items-center gap-[8px] text-[12.5px] font-semibold text-txt2 hover:text-txt mb-[11px] transition-colors">
              <i className="fa-solid fa-arrow-left" /> Back to Feed
            </Link>

            <PostCard post={post} />

            {/* Comments section */}
            <div className="bg-surf border border-bdr rounded-[11px]">
              <div className="p-[13px]">
                <div className="text-[13px] font-bold mb-[13px]">
                  <i className="fa-regular fa-comments mr-[6px]" style={{ color: 'var(--acc)' }} />
                  Comments ({post.comment_count})
                </div>

                {/* Reply to indicator */}
                {replyTo && (
                  <div className="flex items-center gap-[8px] mb-[8px] text-[12px] text-txt2 bg-surf2 rounded-[7px] px-[10px] py-[6px]">
                    <i className="fa-solid fa-reply" style={{ color: 'var(--acc)' }} />
                    Replying to <b className="text-txt">{replyTo.name}</b>
                    <button onClick={() => setReplyTo(null)} className="ml-auto text-txt3 hover:text-txt2">
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                )}

                {/* Comment input */}
                <div className="flex gap-[8px] items-start mb-[14px]">
                  <Avatar user={user} size="sm" />
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={user ? 'Write a comment...' : 'Login to comment...'}
                    rows={1}
                    disabled={!user}
                    className="flex-1 bg-surf2 border border-bdr rounded-[7px] px-[11px] py-[8px] text-[12.5px] text-txt placeholder:text-txt3 resize-none focus:border-[var(--acc)] transition-colors disabled:opacity-50"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                  />
                  <button onClick={submitComment} disabled={loading || !user}
                    className="w-[30px] h-[30px] rounded-[7px] text-white text-[11px] flex items-center justify-center mt-[2px] flex-shrink-0 disabled:opacity-50"
                    style={{ background: 'var(--acc)' }}>
                    {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
                  </button>
                </div>

                {/* Comments list */}
                {comments.map(comment => (
                  <div key={comment.id}>
                    <CommentItem comment={comment} onReply={setReplyTo} />
                    {comment.replies?.map(reply => (
                      <div key={reply.id} className="ml-[42px] mt-[7px]">
                        <CommentItem comment={reply} onReply={setReplyTo} />
                      </div>
                    ))}
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-[24px] text-txt3 text-[12.5px]">
                    <i className="fa-regular fa-comment-dots text-[28px] mb-[8px] block opacity-30" />
                    No comments yet. Be the first!
                  </div>
                )}
              </div>
            </div>
          </div>
        </AppShell>
      </div>
      <BottomNav />
    </>
  )
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply: (r: { id: string; name: string }) => void }) {
  const [loved, setLoved] = useState(comment.is_loved || false)
  const [loveCount, setLoveCount] = useState(comment.love_count)

  return (
    <div className="flex gap-[8px] mb-[11px]">
      <Avatar user={comment.user} size="sm" />
      <div className="flex-1 bg-surf2 rounded-[7px] px-[11px] py-[8px]">
        <div className="text-[11.5px] font-bold">
          {comment.user?.full_name}
          <span className="text-[10px] text-txt3 font-normal ml-[5px]">{timeAgo(comment.created_at)}</span>
        </div>
        <div className="text-[12.5px] mt-[2px] leading-[1.5]">{comment.content}</div>
        <div className="flex gap-[10px] mt-[5px]">
          <button onClick={() => { setLoved(!loved); setLoveCount(c => loved ? c - 1 : c + 1) }}
            className={`text-[10.5px] transition-colors ${loved ? 'text-[var(--acc)]' : 'text-txt3 hover:text-txt2'}`}>
            <i className={`${loved ? 'fa-solid' : 'fa-regular'} fa-heart mr-[3px]`} />{loveCount}
          </button>
          <button onClick={() => onReply({ id: comment.id, name: comment.user?.full_name || 'User' })}
            className="text-[10.5px] text-txt3 hover:text-txt2 transition-colors">
            <i className="fa-regular fa-comment mr-[3px]" />Reply
          </button>
        </div>
      </div>
    </div>
  )
}
