'use client'
import { useState } from 'react'
import type { PostType } from '@/types'
import { useAuthStore } from '@/lib/store'
import Avatar from '@/components/ui/Avatar'
import CreatePostModal from './CreatePostModal'
import toast from 'react-hot-toast'

const shortcuts: { type: PostType; icon: string; label: string; color: string }[] = [
  { type: 'confession', icon: 'fa-regular fa-face-smile-wink', label: 'Confession', color: '#f472b6' },
  { type: 'job',        icon: 'fa-solid fa-briefcase',         label: 'Job',        color: '#34d399' },
  { type: 'tuition',   icon: 'fa-solid fa-book',              label: 'Tuition',    color: '#fbbf24' },
  { type: 'sell',      icon: 'fa-solid fa-tag',               label: 'Sell',       color: '#a78bfa' },
  { type: 'notice',    icon: 'fa-solid fa-bullhorn',          label: 'Notice',     color: '#60a5fa' },
]

export default function CreatePost({ onPost }: { onPost?: () => void }) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [defType, setDefType] = useState<PostType>('general')

  function openModal(type: PostType) {
    if (!user) { toast('Post করতে Sign Up করো!', { icon: '🔒' }); return }
    setDefType(type)
    setOpen(true)
  }

  return (
    <>
      <div className="rounded-[11px] mb-[9px] overflow-hidden border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="flex items-center gap-[9px] p-[11px]">
          <Avatar user={user} size="md" />
          <div className="flex-1 rounded-full px-[13px] py-[8px] text-[13px] cursor-pointer transition-colors border"
            style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt2)' }}
            onClick={() => openModal('general')}>
            What's on your mind?
          </div>
          <button onClick={() => openModal('general')} className="flex items-center gap-[5px] px-3 py-[5px] rounded-[6px] text-[12px] font-semibold text-white hover:opacity-88 transition-opacity" style={{ background: 'var(--acc)' }}>
            <i className="fa-solid fa-pen" /> Post
          </button>
        </div>
        <div className="flex border-t overflow-x-auto" style={{ borderColor: 'var(--bdr)' }}>
          {shortcuts.map(s => (
            <button key={s.type} onClick={() => openModal(s.type)}
              className="flex items-center gap-[5px] px-[13px] py-[8px] text-[12px] font-medium transition-all border-r flex-shrink-0 last:border-r-0 hover:opacity-80"
              style={{ borderColor: 'var(--bdr)', color: 'var(--txt2)' }}>
              <i className={s.icon} style={{ color: s.color }} />{s.label}
            </button>
          ))}
        </div>
      </div>
      {open && <CreatePostModal defaultType={defType} onClose={() => setOpen(false)} onSuccess={() => { setOpen(false); onPost?.() }} />}
    </>
  )
}
