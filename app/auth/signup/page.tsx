'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { DEPARTMENTS, SESSIONS, MONTHS } from '@/lib/utils'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

type Step = 1 | 2 | 3

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1)
  const router = useRouter()
  const { setUser } = useAuthStore()

  // Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)

  // Step 2 OTP
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Step 3 Profile
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [unameStatus, setUnameStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [gender, setGender] = useState('')
  const [department, setDepartment] = useState('')
  const [session, setSession] = useState('')
  const [boardRoll, setBoardRoll] = useState('')
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [cooldown])

  // Username debounce check
  useEffect(() => {
    if (username.length < 3) { setUnameStatus('idle'); return }
    setUnameStatus('checking')
    const t = setTimeout(async () => {
      const { data } = await supabase.from('users').select('id').eq('username', username).single()
      setUnameStatus(data ? 'taken' : 'available')
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPass) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    try {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: undefined } })
      if (error) throw error
      setStep(2)
      toast.success('OTP sent to your email!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleOtpInput(val: string, idx: number) {
    if (!/^\d?$/.test(val)) return
    const newOtp = [...otp]
    newOtp[idx] = val
    setOtp(newOtp)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  function handleOtpKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (attempts >= 3) { toast.error('Too many attempts. Wait 15 minutes.'); return }
    const code = otp.join('')
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setOtpLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
      if (error) {
        setAttempts(a => a + 1)
        if (attempts + 1 >= 3) setCooldown(900)
        throw error
      }
      setStep(3)
      toast.success('Email verified! ✅')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return
    await supabase.auth.resend({ type: 'signup', email })
    toast.success('OTP resent!')
    setAttempts(0)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setAvatarPreview(ev.target?.result as string)
      setAvatarBase64(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Full name লিখো'); return }
    if (unameStatus !== 'available') { toast.error('Valid username দাও'); return }
    if (!dobDay || !dobMonth || !dobYear) { toast.error('Date of birth দাও'); return }
    if (!gender || !department || !session) { toast.error('সব field পূরণ করো'); return }
    setProfileLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let avatar_url = null
      if (avatarBase64) {
        const res = await fetch('/api/users/upload-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: avatarBase64, userId: user.id }),
        })
        const data = await res.json()
        avatar_url = data.url
      }

      const profile = {
        id: user.id,
        email,
        username: username.toLowerCase(),
        full_name: fullName.trim(),
        avatar_url,
        gender,
        department,
        session,
        board_roll: boardRoll,
        dob_day: parseInt(dobDay),
        dob_month: parseInt(dobMonth),
        dob_year: parseInt(dobYear),
        is_verified: false,
        is_admin: false,
      }

      const { error } = await supabase.from('users').insert(profile)
      if (error) throw error

      setUser(profile as any)
      toast.success('Welcome to SUST Connect! 🎉')
      router.push('/')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center p-5">
      <div className="w-full max-w-[430px] bg-surf border border-bdr rounded-[14px] p-[30px]">
        {/* Logo */}
        <div className="text-center mb-[26px]">
          <div className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center text-white text-[19px] mx-auto mb-[11px]" style={{ background: 'var(--acc)' }}>
            <i className="fa-solid fa-graduation-cap" />
          </div>
          <h1 className="text-[21px] font-bold tracking-tight">Create Account</h1>
          <p className="text-[12px] text-txt2 mt-[2px]">Join SUST Connect</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surf2 rounded-[8px] p-[3px] gap-[3px] mb-[20px]">
          <Link href="/auth/login" className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-medium text-txt2">Login</Link>
          <div className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-semibold bg-surf shadow-sm text-txt">Sign Up</div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center mb-[20px]">
          {[1,2,3].map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={cn('w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 transition-all',
                step > s ? 'text-white' : step === s ? 'text-white shadow-[0_0_0_3px_rgba(232,24,122,0.2)]' : 'border border-bdr text-txt3')}
                style={{ background: step >= s ? 'var(--acc)' : 'var(--surf2)' }}>
                {step > s ? <i className="fa-solid fa-check text-[9px]" /> : s}
              </div>
              {i < 2 && <div className={cn('flex-1 h-[1px] mx-[3px] transition-colors', step > s + 1 ? 'bg-[var(--acc)]' : 'bg-bdr')} />}
            </div>
          ))}
        </div>

        {/* Step 1: Email + Password */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="space-y-[13px]">
            <Field label="Email" icon="fa-regular fa-envelope" type="email" value={email} onChange={setEmail} placeholder="your@email.com" required />
            <Field label="Password" icon="fa-solid fa-lock" type={showPass ? 'text' : 'password'} value={password} onChange={setPassword} placeholder="Min 8 characters" required
              suffix={<button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-txt3 text-[12px]"><i className={showPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} /></button>} />
            <Field label="Confirm Password" icon="fa-solid fa-lock" type="password" value={confirmPass} onChange={setConfirmPass} placeholder="Re-enter password" required />
            <SubmitBtn loading={false} label="Continue" icon="fa-solid fa-arrow-right" />
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p className="text-[12.5px] text-txt2 text-center mb-[14px]">
              OTP sent to <b className="text-txt">{email}</b><br />
              <span className="text-[10.5px] text-txt3">Valid 10 min · {3 - attempts} attempts left</span>
            </p>
            <div className="flex gap-[8px] justify-center mb-[16px]">
              {otp.map((v, i) => (
                <input key={i} ref={el => otpRefs.current[i] = el} maxLength={1} value={v}
                  onChange={e => handleOtpInput(e.target.value, i)}
                  onKeyDown={e => handleOtpKeyDown(e, i)}
                  className="w-[42px] h-[48px] bg-surf2 border border-bdr rounded-[8px] text-center text-[20px] font-bold text-txt focus:border-[var(--acc)] transition-colors" />
              ))}
            </div>
            <SubmitBtn loading={otpLoading} label="Verify OTP" icon="fa-solid fa-check" />
            <button type="button" onClick={() => setStep(1)} className="w-full mt-[9px] py-[8px] rounded-[8px] bg-surf2 border border-bdr text-[12px] font-semibold text-txt2 hover:border-bdr2 transition-colors">
              <i className="fa-solid fa-arrow-left mr-[6px]" />Back
            </button>
            <p className="text-[12px] text-center text-txt2 mt-[14px]">
              Didn't receive?{' '}
              {cooldown > 0
                ? <span className="text-txt3">Resend in {cooldown}s</span>
                : <button type="button" onClick={handleResendOtp} className="font-semibold" style={{ color: 'var(--acc)' }}>Resend OTP</button>}
            </p>
          </form>
        )}

        {/* Step 3: Profile */}
        {step === 3 && (
          <form onSubmit={handleProfile} className="space-y-[13px]">
            {/* Avatar */}
            <div className="text-center mb-[16px]">
              <div className="relative inline-block cursor-pointer" onClick={() => fileRef.current?.click()}>
                <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-bdr2 flex items-center justify-center text-txt3 text-[22px] overflow-hidden hover:border-[var(--acc)] hover:text-[var(--acc)] transition-all">
                  {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar" /> : <i className="fa-solid fa-user" />}
                </div>
                <div className="absolute bottom-[2px] right-[2px] w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] border-2 border-surf" style={{ background: 'var(--acc)' }}>
                  <i className="fa-solid fa-camera" />
                </div>
              </div>
              <p className="text-[11px] text-txt3 mt-[5px]">Upload photo (optional · auto 4KB)</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <Field label="Full Name" icon="fa-solid fa-user" value={fullName} onChange={setFullName} placeholder="Your full name" required />

            {/* Username with live check */}
            <div>
              <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Username</label>
              <div className="relative">
                <i className="fa-solid fa-at absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
                <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[36px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors"
                  placeholder="username" />
                <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px]">
                  {unameStatus === 'checking' && <i className="fa-solid fa-spinner fa-spin text-txt3" />}
                  {unameStatus === 'available' && <i className="fa-solid fa-circle-check text-green-500" />}
                  {unameStatus === 'taken' && <i className="fa-solid fa-circle-xmark text-red-500" />}
                </span>
              </div>
            </div>

            {/* DOB — 3 separate fields, month is select */}
            <div>
              <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Date of Birth</label>
              <div className="grid grid-cols-[2fr_2fr_3fr] gap-[8px]">
                <div className="relative">
                  <i className="fa-solid fa-calendar-day absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[11px] pointer-events-none" />
                  <input type="number" value={dobDay} onChange={e => setDobDay(e.target.value)} min={1} max={31}
                    className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors"
                    placeholder="Day" required />
                </div>
                <div className="relative">
                  <i className="fa-solid fa-calendar absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[11px] pointer-events-none" />
                  <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} required
                    className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] text-txt focus:border-[var(--acc)] transition-colors appearance-none cursor-pointer">
                    <option value="">Month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-calendar-plus absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[11px] pointer-events-none" />
                  <input type="number" value={dobYear} onChange={e => setDobYear(e.target.value)} min={1980} max={2010}
                    className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors"
                    placeholder="Year" required />
                </div>
              </div>
            </div>

            {/* Gender + Session */}
            <div className="grid grid-cols-2 gap-[9px]">
              <div>
                <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Gender</label>
                <div className="relative">
                  <i className="fa-solid fa-venus-mars absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
                  <select value={gender} onChange={e => setGender(e.target.value)} required
                    className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] text-txt focus:border-[var(--acc)] transition-colors appearance-none cursor-pointer">
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Session</label>
                <div className="relative">
                  <i className="fa-solid fa-calendar-days absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
                  <select value={session} onChange={e => setSession(e.target.value)} required
                    className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] text-txt focus:border-[var(--acc)] transition-colors appearance-none cursor-pointer">
                    <option value="">Select</option>
                    {SESSIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">Department</label>
              <div className="relative">
                <i className="fa-solid fa-building-columns absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none" />
                <select value={department} onChange={e => setDepartment(e.target.value)} required
                  className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] text-txt focus:border-[var(--acc)] transition-colors appearance-none cursor-pointer">
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(g => (
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map(d => <option key={d}>{d}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {/* Board Roll */}
            <Field label="Board / Class Roll" icon="fa-solid fa-id-card" value={boardRoll} onChange={setBoardRoll} placeholder="e.g. 2024331001" />

            <SubmitBtn loading={profileLoading} label="Join SUST Connect" icon="fa-solid fa-rocket" />
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, icon, value, onChange, placeholder, type = 'text', required, suffix }: any) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">{label}</label>
      <div className="relative">
        <i className={`${icon} absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none`} />
        <input type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} required={required}
          className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[12px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors" />
        {suffix}
      </div>
    </div>
  )
}

function SubmitBtn({ loading, label, icon }: { loading: boolean; label: string; icon: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white transition-opacity hover:opacity-88 disabled:opacity-50"
      style={{ background: 'var(--acc)' }}>
      {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className={icon} />}
      {label}
    </button>
  )
}
