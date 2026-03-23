'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'
import { DEPARTMENTS, SESSIONS, MONTHS } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  const { setUser } = useAuthStore()
  // Step 1
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [conf, setConf] = useState('')
  const [showPass, setShowPass] = useState(false)
  // Step 2 OTP
  const [otp, setOtp] = useState(['','','','','',''])
  const [otpLoading, setOtpLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement|null)[]>([])
  // Step 3 Profile
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [unSt, setUnSt] = useState<'idle'|'checking'|'ok'|'taken'>('idle')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [gender, setGender] = useState('')
  const [dept, setDept] = useState('')
  const [session, setSession] = useState('')
  const [roll, setRoll] = useState('')
  const [avB64, setAvB64] = useState<string|null>(null)
  const [avPrev, setAvPrev] = useState<string|null>(null)
  const [profLoading, setProfLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown > 0) { const t = setTimeout(() => setCooldown(c=>c-1),1000); return ()=>clearTimeout(t) }
  },[cooldown])

  useEffect(() => {
    if (username.length < 3) { setUnSt('idle'); return }
    setUnSt('checking')
    const t = setTimeout(async () => {
      const { data } = await supabase.from('users').select('id').eq('username',username).single()
      setUnSt(data ? 'taken' : 'ok')
    }, 500)
    return () => clearTimeout(t)
  }, [username])

  async function step1(e: React.FormEvent) {
    e.preventDefault()
    if (pass !== conf) { toast.error('Passwords do not match'); return }
    if (pass.length < 8) { toast.error('Min 8 characters'); return }
    try {
      const { error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: undefined } })
      if (error) throw error
      setStep(2)
      toast.success('OTP sent!')
    } catch (err: any) { toast.error(err.message) }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (attempts >= 3) { toast.error('Too many attempts. Wait.'); return }
    const code = otp.join('')
    if (code.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setOtpLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' })
      if (error) { setAttempts(a=>a+1); if (attempts+1>=3) setCooldown(900); throw error }
      setStep(3)
      toast.success('Verified! ✅')
    } catch (err: any) { toast.error(err.message) }
    finally { setOtpLoading(false) }
  }

  function otpInput(val: string, i: number) {
    if (!/^\d?$/.test(val)) return
    const n = [...otp]; n[i] = val; setOtp(n)
    if (val && i < 5) otpRefs.current[i+1]?.focus()
  }

  function otpKey(e: React.KeyboardEvent, i: number) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus()
  }

  function onAv(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { setAvPrev(ev.target?.result as string); setAvB64(ev.target?.result as string) }
    r.readAsDataURL(f)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) { toast.error('Full name দাও'); return }
    if (unSt !== 'ok') { toast.error('Valid username দাও'); return }
    if (!dobDay || !dobMonth || !dobYear) { toast.error('Date of birth দাও'); return }
    if (!gender || !dept || !session) { toast.error('সব field পূরণ করো'); return }
    setProfLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      let avatar_url = null
      if (avB64) {
        const res = await fetch('/api/users/upload-avatar', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ image: avB64, userId: user.id }) })
        const d = await res.json(); avatar_url = d.url
      }
      const profile = { id: user.id, email, username: username.toLowerCase(), full_name: fullName.trim(), avatar_url, gender, department: dept, session, board_roll: roll, dob_day: parseInt(dobDay), dob_month: parseInt(dobMonth), dob_year: parseInt(dobYear), is_verified: false, is_admin: false }
      const { error } = await supabase.from('users').insert(profile)
      if (error) throw error
      setUser(profile as any)
      toast.success('Welcome to SUST Connect! 🎉')
      router.push('/')
    } catch (err: any) { toast.error(err.message) }
    finally { setProfLoading(false) }
  }

  const S = (n: number, label: string) => (
    <div key={n} className="flex items-center flex-1 last:flex-none">
      <div className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 transition-all text-white"
        style={{ background: step >= n ? 'var(--acc)' : 'var(--surf2)', color: step >= n ? '#fff' : 'var(--txt3)', border: step >= n ? 'none' : '1px solid var(--bdr)', boxShadow: step === n ? '0 0 0 3px rgba(232,24,122,0.2)' : 'none' }}>
        {step > n ? <i className="fa-solid fa-check text-[9px]" /> : n}
      </div>
      {n < 3 && <div className="flex-1 h-[1px] mx-[3px] transition-colors" style={{ background: step > n ? 'var(--acc)' : 'var(--bdr)' }} />}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center p-5 pt-[60px] pb-[20px]">
      <div className="w-full max-w-[430px] rounded-[14px] p-[30px] border" style={{ background: 'var(--surf)', borderColor: 'var(--bdr)' }}>
        <div className="text-center mb-[26px]">
          <div className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center text-white text-[19px] mx-auto mb-[11px]" style={{ background: 'var(--acc)' }}>
            <i className="fa-solid fa-graduation-cap" />
          </div>
          <h1 className="text-[21px] font-bold" style={{ color: 'var(--txt)' }}>Create Account</h1>
          <p className="text-[12px] mt-[2px]" style={{ color: 'var(--txt2)' }}>Join SUST Connect</p>
        </div>

        <div className="flex rounded-[8px] p-[3px] gap-[3px] mb-[20px]" style={{ background: 'var(--surf2)' }}>
          <Link href="/auth/login" className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-medium" style={{ color: 'var(--txt2)' }}>Login</Link>
          <div className="flex-1 text-center py-[7px] rounded-[6px] text-[13px] font-semibold shadow-sm" style={{ background: 'var(--surf)', color: 'var(--txt)' }}>Sign Up</div>
        </div>

        <div className="flex items-center mb-[20px]">{[1,2,3].map(n => S(n,''))}</div>

        {/* Step 1 */}
        {step === 1 && (
          <form onSubmit={step1} className="space-y-[13px]">
            <FI label="Email" icon="fa-regular fa-envelope" type="email" v={email} s={setEmail} ph="your@email.com" />
            <div>
              <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color: 'var(--txt2)' }}>Password</label>
              <div className="relative">
                <i className="fa-solid fa-lock absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: 'var(--txt3)' }} />
                <input type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min 8 characters" required className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[36px] text-[13px] border focus:outline-none" style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color:'var(--txt)' }} onFocus={e=>{e.target.style.borderColor='var(--acc)'}} onBlur={e=>{e.target.style.borderColor='var(--bdr)'}} />
                <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px]" style={{ color:'var(--txt3)' }}><i className={showPass?'fa-regular fa-eye-slash':'fa-regular fa-eye'} /></button>
              </div>
            </div>
            <FI label="Confirm Password" icon="fa-solid fa-lock" type="password" v={conf} s={setConf} ph="Re-enter password" />
            <Btn loading={false} label="Continue" icon="fa-solid fa-arrow-right" />
          </form>
        )}

        {/* Step 2 OTP */}
        {step === 2 && (
          <form onSubmit={verifyOtp}>
            <p className="text-[12.5px] text-center mb-[14px]" style={{ color: 'var(--txt2)' }}>
              OTP sent to <b style={{ color: 'var(--txt)' }}>{email}</b><br />
              <span className="text-[10.5px]" style={{ color: 'var(--txt3)' }}>Valid 10 min · {3-attempts} attempts left</span>
            </p>
            <div className="flex gap-[8px] justify-center mb-[16px]">
              {otp.map((v,i) => (
                <input key={i} ref={el=>otpRefs.current[i]=el} maxLength={1} value={v}
                  onChange={e=>otpInput(e.target.value,i)} onKeyDown={e=>otpKey(e,i)}
                  className="w-[42px] h-[48px] rounded-[8px] text-center text-[20px] font-bold border focus:outline-none transition-colors"
                  style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color:'var(--txt)' }}
                  onFocus={e=>{e.target.style.borderColor='var(--acc)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--bdr)'}} />
              ))}
            </div>
            <Btn loading={otpLoading} label="Verify OTP" icon="fa-solid fa-check" />
            <button type="button" onClick={()=>setStep(1)} className="w-full mt-[9px] py-[8px] rounded-[8px] text-[12px] font-semibold border transition-colors" style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color:'var(--txt2)' }}>
              <i className="fa-solid fa-arrow-left mr-[5px]" />Back
            </button>
            <p className="text-[12px] text-center mt-[14px]" style={{ color:'var(--txt2)' }}>
              Didn't receive?{' '}
              {cooldown > 0 ? <span style={{ color:'var(--txt3)' }}>Resend in {cooldown}s</span>
                : <button type="button" onClick={async()=>{ await supabase.auth.resend({type:'signup',email}); toast.success('OTP resent!'); setAttempts(0) }} className="font-semibold" style={{ color:'var(--acc)' }}>Resend OTP</button>}
            </p>
          </form>
        )}

        {/* Step 3 Profile */}
        {step === 3 && (
          <form onSubmit={saveProfile} className="space-y-[13px]">
            {/* Avatar */}
            <div className="text-center mb-[4px]">
              <div className="relative inline-block cursor-pointer" onClick={()=>fileRef.current?.click()}>
                <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[22px] overflow-hidden border-2 border-dashed transition-all"
                  style={{ background:'var(--surf2)', borderColor:'var(--bdr2)', color:'var(--txt3)' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.color='var(--acc)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--bdr2)';e.currentTarget.style.color='var(--txt3)'}}>
                  {avPrev ? <img src={avPrev} className="w-full h-full object-cover" alt="av" /> : <i className="fa-solid fa-user" />}
                </div>
                <div className="absolute bottom-[2px] right-[2px] w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] border-2 border-white" style={{ background:'var(--acc)' }}>
                  <i className="fa-solid fa-camera" />
                </div>
              </div>
              <p className="text-[11px] mt-[5px]" style={{ color:'var(--txt3)' }}>Photo (optional · auto 4KB)</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAv} />
            </div>

            <FI label="Full Name" icon="fa-solid fa-user" v={fullName} s={setFullName} ph="Your full name" req />

            {/* Username with live check */}
            <div>
              <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color:'var(--txt2)' }}>Username</label>
              <div className="relative">
                <i className="fa-solid fa-at absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color:'var(--txt3)' }} />
                <input value={username} onChange={e=>setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} placeholder="username" required
                  className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[36px] text-[13px] border focus:outline-none"
                  style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color:'var(--txt)' }}
                  onFocus={e=>{e.target.style.borderColor='var(--acc)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--bdr)'}} />
                <span className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[12px]">
                  {unSt==='checking' && <i className="fa-solid fa-spinner fa-spin" style={{ color:'var(--txt3)' }} />}
                  {unSt==='ok'      && <i className="fa-solid fa-circle-check text-green-500" />}
                  {unSt==='taken'   && <i className="fa-solid fa-circle-xmark text-red-500" />}
                </span>
              </div>
            </div>

            {/* DOB — 3 separate fields, month = dropdown */}
            <div>
              <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color:'var(--txt2)' }}>Date of Birth</label>
              <div className="grid gap-[8px]" style={{ gridTemplateColumns:'2fr 2fr 3fr' }}>
                <Inp type="number" v={dobDay} s={setDobDay} ph="Day" min={1} max={31} />
                <select value={dobMonth} onChange={e=>setDobMonth(e.target.value)} required className="rounded-[8px] py-[9px] pl-[10px] pr-[8px] text-[13px] border focus:outline-none" style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color: dobMonth ? 'var(--txt)' : 'var(--txt2)' }}>
                  <option value="">Month</option>
                  {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                </select>
                <Inp type="number" v={dobYear} s={setDobYear} ph="Year" min={1980} max={2010} />
              </div>
            </div>

            {/* Gender + Session */}
            <div className="grid grid-cols-2 gap-[9px]">
              <div>
                <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color:'var(--txt2)' }}>Gender</label>
                <div className="relative">
                  <i className="fa-solid fa-venus-mars absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color:'var(--txt3)' }} />
                  <select value={gender} onChange={e=>setGender(e.target.value)} required className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] border focus:outline-none appearance-none" style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color: gender?'var(--txt)':'var(--txt2)' }}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color:'var(--txt2)' }}>Session</label>
                <div className="relative">
                  <i className="fa-solid fa-calendar-days absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color:'var(--txt3)' }} />
                  <select value={session} onChange={e=>setSession(e.target.value)} required className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] border focus:outline-none appearance-none" style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color: session?'var(--txt)':'var(--txt2)' }}>
                    <option value="">Select</option>
                    {SESSIONS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color:'var(--txt2)' }}>Department</label>
              <div className="relative">
                <i className="fa-solid fa-building-columns absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color:'var(--txt3)' }} />
                <select value={dept} onChange={e=>setDept(e.target.value)} required className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[8px] text-[13px] border focus:outline-none appearance-none" style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color: dept?'var(--txt)':'var(--txt2)' }}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(g=>(
                    <optgroup key={g.group} label={g.group}>
                      {g.items.map(d=><option key={d}>{d}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            <FI label="Board / Class Roll" icon="fa-solid fa-id-card" v={roll} s={setRoll} ph="e.g. 2024331001" />
            <Btn loading={profLoading} label="Join SUST Connect" icon="fa-solid fa-rocket" />
          </form>
        )}
      </div>
    </div>
  )
}

function FI({ label, icon, type='text', v, s, ph, req=false }: any) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold mb-[5px] uppercase tracking-[0.4px]" style={{ color:'var(--txt2)' }}>{label}</label>
      <div className="relative">
        <i className={`${icon} absolute left-[11px] top-1/2 -translate-y-1/2 text-[12px] pointer-events-none`} style={{ color:'var(--txt3)' }} />
        <input type={type} value={v} onChange={(e:any)=>s(e.target.value)} placeholder={ph} required={req}
          className="w-full rounded-[8px] py-[9px] pl-[32px] pr-[12px] text-[13px] border focus:outline-none"
          style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color:'var(--txt)' }}
          onFocus={e=>{e.target.style.borderColor='var(--acc)'}}
          onBlur={e=>{e.target.style.borderColor='var(--bdr)'}} />
      </div>
    </div>
  )
}

function Inp({ type, v, s, ph, min, max }: any) {
  return (
    <input type={type} value={v} onChange={(e:any)=>s(e.target.value)} placeholder={ph} min={min} max={max} required
      className="w-full rounded-[8px] py-[9px] px-[10px] text-[13px] border focus:outline-none"
      style={{ background:'var(--surf2)', borderColor:'var(--bdr)', color:'var(--txt)' }}
      onFocus={e=>{e.target.style.borderColor='var(--acc)'}}
      onBlur={e=>{e.target.style.borderColor='var(--bdr)'}} />
  )
}

function Btn({ loading, label, icon }: { loading: boolean; label: string; icon: string }) {
  return (
    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-[6px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white hover:opacity-88 disabled:opacity-50 transition-opacity" style={{ background:'var(--acc)' }}>
      {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className={icon} />} {label}
    </button>
  )
}
