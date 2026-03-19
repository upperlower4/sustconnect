'use client'
import { useState, useRef } from 'react'
import type { PostType } from '@/types'
import { useAuthStore } from '@/lib/store'
import { MONTHS, DEPARTMENTS, SESSIONS } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const types: { type: PostType; icon: string; label: string; activeColor: string }[] = [
  { type: 'general',    icon: 'fa-regular fa-note-sticky',     label: 'General',    activeColor: '#818cf8' },
  { type: 'confession', icon: 'fa-regular fa-face-smile-wink', label: 'Confession', activeColor: '#f472b6' },
  { type: 'notice',     icon: 'fa-solid fa-bullhorn',          label: 'Notice',     activeColor: '#60a5fa' },
  { type: 'job',        icon: 'fa-solid fa-briefcase',         label: 'Job',        activeColor: '#34d399' },
  { type: 'tuition',   icon: 'fa-solid fa-book',              label: 'Tuition',    activeColor: '#fbbf24' },
  { type: 'sell',      icon: 'fa-solid fa-tag',               label: 'Sell',       activeColor: '#a78bfa' },
]

const placeholders: Record<PostType, string> = {
  general: "What's on your mind?", confession: "Share anonymously... 🤫",
  notice: "Write the notice...", job: "Additional job details...",
  tuition: "Additional details...", sell: "Describe the item...",
}

interface Props { defaultType: PostType; onClose: () => void; onSuccess: () => void }

export default function CreatePostModal({ defaultType, onClose, onSuccess }: Props) {
  const { user } = useAuthStore()
  const [type, setType] = useState<PostType>(defaultType)
  const [content, setContent] = useState('')
  const [isAnon, setIsAnon] = useState(defaultType === 'confession')
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [imgB64, setImgB64] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  // Job fields
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [jobType, setJobType] = useState('')
  const [salary, setSalary] = useState('')
  const [qual, setQual] = useState('')
  const [deadline, setDeadline] = useState('')
  const [contact, setContact] = useState('')
  // Tuition
  const [tutType, setTutType] = useState('available')
  const [subjects, setSubjects] = useState('')
  const [level, setLevel] = useState('')
  const [rate, setRate] = useState('')
  const [location, setLocation] = useState('')
  const [tutDeadline, setTutDeadline] = useState('')
  // Sell
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [cat, setCat] = useState('')
  const [cond, setCond] = useState('')

  function onTypeChange(t: PostType) { setType(t); if (t === 'confession') setIsAnon(true) }

  function onImg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { setImgPreview(ev.target?.result as string); setImgB64(ev.target?.result as string) }
    r.readAsDataURL(f)
  }

  async function submit() {
    if (!content.trim() && type === 'general') { toast.error('কিছু লিখো'); return }
    setLoading(true)
    try {
      let image_url = null, image_public_id = null
      if (imgB64) {
        const res = await fetch('/api/posts/upload-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: imgB64 }) })
        const d = await res.json()
        image_url = d.url; image_public_id = d.public_id
      }
      const data: any = { user_id: user!.id, type, content: content.trim(), is_anonymous: type === 'confession' ? true : isAnon, image_url, image_public_id, status: 'active' }
      if (type === 'job') Object.assign(data, { job_title: jobTitle, company, job_type: jobType, salary_range: salary, qualification: qual, expires_at: deadline || null, contact })
      else if (type === 'tuition') Object.assign(data, { tuition_type: tutType, subjects, level, rate, location, contact, expires_at: tutDeadline || null })
      else if (type === 'sell') Object.assign(data, { item_name: itemName, price, category: cat, condition: cond, contact })
      const { error } = await supabase.from('posts').insert(data)
      if (error) throw error
      toast.success('Post করা হয়েছে! ✅')
      onSuccess()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const activeType = types.find(t => t.type === type)

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[510px] rounded-[14px] p-[18px] max-h-[92vh] overflow-y-auto" style={{ background: 'var(--surf)', border: '1px solid var(--bdr)' }}>
        <div className="flex items-center justify-between mb-[14px]">
          <div className="text-[15px] font-bold" style={{ color: 'var(--txt)' }}>Create Post</div>
          <button onClick={onClose} className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[12px]" style={{ background: 'var(--surf2)', color: 'var(--txt2)' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Type pills */}
        <div className="flex gap-[4px] flex-wrap mb-[12px]">
          {types.map(t => (
            <button key={t.type} onClick={() => onTypeChange(t.type)}
              className="flex items-center gap-[4px] px-[10px] py-[5px] rounded-full text-[11.5px] font-medium border transition-all"
              style={{ color: type === t.type ? t.activeColor : 'var(--txt2)', borderColor: type === t.type ? t.activeColor : 'var(--bdr)', fontWeight: type === t.type ? 700 : 500 }}>
              <i className={t.icon} />{t.label}
            </button>
          ))}
        </div>

        {/* Job fields */}
        {type === 'job' && (
          <div className="grid grid-cols-2 gap-[7px] rounded-[8px] p-[11px] mb-[9px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
            <EI p="Job Title *" v={jobTitle} s={setJobTitle} />
            <EI p="Company *" v={company} s={setCompany} />
            <EI p="Type (Full-time...)" v={jobType} s={setJobType} />
            <EI p="Salary Range" v={salary} s={setSalary} />
            <EI p="Qualification" v={qual} s={setQual} />
            <EI p="Deadline" v={deadline} s={setDeadline} t="date" />
            <EI p="Contact / Email *" v={contact} s={setContact} cls="col-span-2" />
          </div>
        )}

        {/* Tuition fields */}
        {type === 'tuition' && (
          <div className="grid grid-cols-2 gap-[7px] rounded-[8px] p-[11px] mb-[9px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
            <select className="rounded-[6px] px-[9px] py-[7px] text-[11.5px] border col-span-2" style={{ background: 'var(--surf3)', borderColor: 'var(--bdr)', color: 'var(--txt)' }} value={tutType} onChange={e => setTutType(e.target.value)}>
              <option value="available">Tutor Available</option>
              <option value="wanted">Need a Tutor</option>
            </select>
            <EI p="Subjects" v={subjects} s={setSubjects} />
            <EI p="Level (HSC/Univ)" v={level} s={setLevel} />
            <EI p="Rate (BDT/month)" v={rate} s={setRate} />
            <EI p="Location / Online" v={location} s={setLocation} />
            <EI p="Deadline (optional)" v={tutDeadline} s={setTutDeadline} t="date" />
            <EI p="Contact *" v={contact} s={setContact} cls="col-span-2" />
          </div>
        )}

        {/* Sell fields */}
        {type === 'sell' && (
          <div className="grid grid-cols-2 gap-[7px] rounded-[8px] p-[11px] mb-[9px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)' }}>
            <EI p="Item Name *" v={itemName} s={setItemName} />
            <EI p="Price (BDT) *" v={price} s={setPrice} />
            <EI p="Category" v={cat} s={setCat} />
            <EI p="Condition (New/Used)" v={cond} s={setCond} />
            <EI p="Contact *" v={contact} s={setContact} cls="col-span-2" />
          </div>
        )}

        {/* Textarea */}
        <div className="flex gap-[9px] items-start mb-[3px]">
          <Avatar user={user} size="md" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder={placeholders[type]}
            className="flex-1 rounded-[8px] px-[11px] py-[9px] text-[13.5px] resize-none min-h-[90px] leading-[1.6] border focus:outline-none transition-colors"
            style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
            onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--bdr)' }} />
        </div>

        {/* Image preview */}
        {imgPreview && (
          <div className="relative mb-[9px] rounded-[7px] overflow-hidden">
            <img src={imgPreview} alt="preview" className="w-full max-h-[180px] object-cover" />
            <button onClick={() => { setImgPreview(null); setImgB64(null) }} className="absolute top-[6px] right-[6px] w-[22px] h-[22px] rounded-full text-white text-[10px] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-[7px] pt-[11px] mt-[9px] border-t" style={{ borderColor: 'var(--bdr)' }}>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImg} />
          <button onClick={() => fileRef.current?.click()} className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[12px] border transition-all" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt2)' }} title="Add image">
            <i className="fa-regular fa-image" />
          </button>
          <button className="w-[28px] h-[28px] rounded-[6px] flex items-center justify-center text-[12px] border" style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt2)' }}>
            <i className="fa-solid fa-at" />
          </button>

          {type === 'confession'
            ? <div className="flex items-center gap-[4px] text-[10.5px]" style={{ color: 'var(--txt3)' }}><i className="fa-solid fa-lock" /> Always anonymous</div>
            : <div className="flex items-center gap-[6px] text-[12px] cursor-pointer" style={{ color: 'var(--txt2)' }} onClick={() => setIsAnon(!isAnon)}>
                <div className="w-[32px] h-[17px] rounded-full relative transition-colors" style={{ background: isAnon ? 'var(--acc)' : 'var(--surf3)' }}>
                  <div className="absolute w-[13px] h-[13px] bg-white rounded-full top-[2px] transition-all shadow" style={{ left: isAnon ? '17px' : '2px' }} />
                </div>
                <span>Anonymous</span>
              </div>}

          <button onClick={submit} disabled={loading} className="ml-auto flex items-center gap-[5px] px-3 py-[5px] rounded-[6px] text-[12px] font-semibold text-white hover:opacity-88 disabled:opacity-50 transition-opacity" style={{ background: 'var(--acc)' }}>
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />} Post
          </button>
        </div>
      </div>
    </div>
  )
}

function EI({ p, v, s, t = 'text', cls = '' }: { p: string; v: string; s: (v: string) => void; t?: string; cls?: string }) {
  return (
    <input type={t} placeholder={p} value={v} onChange={e => s(e.target.value)}
      className={`rounded-[6px] px-[9px] py-[7px] text-[11.5px] border focus:outline-none transition-colors ${cls}`}
      style={{ background: 'var(--surf3)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
      onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--bdr)' }} />
  )
}
