'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuthStore()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
      setUser(profile)
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center p-5">
      <div className="w-full max-w-[400px] bg-surf border border-bdr rounded-[14px] p-[30px]">
        <div className="text-center mb-[26px]">
          <div className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center text-white text-[19px] mx-auto mb-[11px]" style={{ background: 'var(--acc)' }}>
            <i className="fa-solid fa-graduation-cap" />
          </div>
          <h1 className="text-[21px] font-bold tracking-tight">SUST Connect</h1>
          <p className="text-[12px] text-txt2 mt-[2px]">Shahjalal University Social Network</p>
        </div>

        <div className="flex bg-surf2 rounded-[8px] p-[3px] gap-[3px] mb-[20px]">
          <div className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-semibold bg-surf shadow-sm text-txt">Login</div>
          <Link href="/auth/signup" className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-medium text-txt2">Sign Up</Link>
        </div>

        <form onSubmit={handleLogin} className="space-y-[13px]">
          <div>
            <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Email</label>
            <div className="relative">
              <i className="fa-regular fa-envelope absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pr-[12px] pl-[32px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors"
                placeholder="your@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Password</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pr-[36px] pl-[32px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors"
                placeholder="Enter password" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-txt3 text-[12px]">
                <i className={showPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} />
              </button>
            </div>
          </div>

          <div className="text-right">
            <button type="button" className="text-[11px] text-txt2 hover:text-[var(--acc)] transition-colors">Forgot password?</button>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
            style={{ background: 'var(--acc)' }}>
            {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-right-to-bracket" />}
            Login
          </button>
        </form>

        <p className="text-[12px] text-center text-txt2 mt-[16px]">
          No account? <Link href="/auth/signup" className="font-semibold" style={{ color: 'var(--acc)' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
