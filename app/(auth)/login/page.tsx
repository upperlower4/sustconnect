'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) throw error
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      setUser(profile)
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center p-5 pt-[44px]">
      <div className="w-full max-w-[400px] rounded-[14px] p-[30px] border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="text-center mb-[26px]">
          <div className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center text-white text-[19px] mx-auto mb-[11px]" style={{ background: 'var(--acc)' }}>
            <i className="fa-solid fa-graduation-cap" />
          </div>
          <h1 className="text-[21px] font-bold tracking-tight" style={{ color: 'var(--txt)' }}>SUST Connect</h1>
          <p className="text-[12px] mt-[2px]" style={{ color: 'var(--txt2)' }}>Shahjalal University Social Network</p>
        </div>

        <div className="flex rounded-[8px] p-[3px] gap-[3px] mb-[20px]" style={{ background: 'var(--surf2)' }}>
          <div className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-semibold shadow-sm" style={{ background: 'var(--surf)', color: 'var(--txt)' }}>Login</div>
          <Link href="/auth/signup" className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-medium" style={{ color: 'var(--txt2)' }}>Sign Up</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[13px]">
          <FI label="Email" icon="fa-regular fa-envelope" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
          <div>
            <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color: 'var(--txt2)' }}>Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: 'var(--txt3)' }} />
              <input type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" required
                className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[36px] text-[13px] border focus:outline-none"
                style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
                onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--bdr)' }} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px]" style={{ color: 'var(--txt3)' }}>
                <i className={show ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} />
              </button>
            </div>
          </div>
          <div className="text-right"><button type="button" className="text-[11px] transition-colors" style={{ color: 'var(--txt2)' }}>Forgot password?</button></div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white hover:opacity-88 disabled:opacity-50 transition-opacity" style={{ background: 'var(--acc)' }}>
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-right-to-bracket" />} Login
          </button>
        </form>
        <p className="text-[12px] text-center mt-[16px]" style={{ color: 'var(--txt2)' }}>
          No account? <Link href="/auth/signup" className="font-semibold" style={{ color: 'var(--acc)' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  )
}

function FI({ label, icon, type = 'text', value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color: 'var(--txt2)' }}>{label}</label>
      <div className="relative">
        <i className={`${icon} absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none`} style={{ color: 'var(--txt3)' }} />
        <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} required
          className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[12px] text-[13px] border focus:outline-none"
          style={{ background: 'var(--surf2)', borderColor: 'var(--bdr)', color: 'var(--txt)' }}
          onFocus={e => { e.target.style.borderColor = 'var(--acc)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--bdr)' }} />
      </div>
    </div>
  )
}
