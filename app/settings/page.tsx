'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, useThemeStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import Avatar from '@/components/ui/Avatar'
import Lightbox from '@/components/ui/Lightbox'
import toast from 'react-hot-toast'

const NAV = ['Profile','Security','Notifications','Appearance','Privacy']

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('Profile')
  const [loading, setLoading] = useState(false)
  const [lbOpen, setLbOpen] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [fbUrl, setFbUrl] = useState(user?.facebook_url || '')
  const [igUrl, setIgUrl] = useState(user?.instagram_url || '')

  useEffect(() => { if (!user) router.push('/auth/login') }, [user])

  async function saveProfile() {
    if (!user) return
    setLoading(true)
    try {
      const updates = { full_name: fullName, bio, facebook_url: fbUrl, instagram_url: igUrl }
      const { error } = await supabase.from('users').update(updates).eq('id', user.id)
      if (error) throw error
      setUser({ ...user, ...updates })
      toast.success('Profile saved! ✅')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function applyBadge() {
    if (!user) return
    const { error } = await supabase.from('badge_requests').upsert({ user_id: user.id, status: 'pending' })
    if (error) { toast.error(error.message); return }
    toast.success('Badge application submitted! Admin will review.')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/login')
  }

  return (
    <>
      <TopBar />
      <div className="pt-[44px]">
        <AppShell>
          <div className="flex min-h-[calc(100vh-44px)]">
            {/* Settings nav */}
            <div className="w-[195px] border-r border-bdr p-[14px] flex-shrink-0 hidden md:block">
              <div className="text-[14px] font-bold px-[9px] py-[7px] mb-[7px]">Settings</div>
              {NAV.map(s => (
                <button key={s} onClick={() => setActiveSection(s)}
                  className={`w-full flex items-center gap-[8px] px-[9px] py-[7px] rounded-[7px] text-[12.5px] font-medium mb-[1px] transition-all ${activeSection === s ? 'bg-surf2 text-txt font-semibold' : 'text-txt2 hover:bg-surf2 hover:text-txt'}`}>
                  <i className={`${s === 'Profile' ? 'fa-regular fa-user' : s === 'Security' ? 'fa-solid fa-lock' : s === 'Notifications' ? 'fa-regular fa-bell' : s === 'Appearance' ? 'fa-solid fa-palette' : 'fa-solid fa-shield-halved'} w-[15px] text-[12px]`} />
                  {s}
                </button>
              ))}
              <button onClick={handleLogout} className="w-full flex items-center gap-[8px] px-[9px] py-[7px] rounded-[7px] text-[12.5px] font-medium text-red-500 mt-[8px] hover:bg-surf2 transition-all">
                <i className="fa-solid fa-right-from-bracket w-[15px] text-[12px]" /> Logout
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-[22px] max-w-[520px]">
              {activeSection === 'Profile' && (
                <div>
                  <h2 className="text-[14px] font-bold pb-[11px] border-b border-bdr mb-[14px]">Profile</h2>
                  <div className="flex items-center gap-[12px] mb-[16px]">
                    <div className="relative cursor-pointer" onClick={() => user?.avatar_url && setLbOpen(true)}>
                      <Avatar user={user} size="xl" clickable />
                      <div className="absolute bottom-[3px] right-[3px] w-5 h-5 bg-surf2 border-2 border-surf rounded-full flex items-center justify-center text-[9px] text-txt2">
                        <i className="fa-solid fa-camera" />
                      </div>
                    </div>
                    <div>
                      <div className="text-[14px] font-bold">{user?.full_name}</div>
                      <div className="text-[11.5px] text-txt2">@{user?.username}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-[11px] mb-[11px]">
                    <FI label="Full Name" icon="fa-solid fa-user" value={fullName} onChange={setFullName} />
                    <FI label="Bio" icon="fa-solid fa-pen" value={bio} onChange={setBio} placeholder="Short bio..." />
                    <FI label="Facebook" icon="fa-brands fa-facebook" value={fbUrl} onChange={setFbUrl} placeholder="facebook.com/..." />
                    <FI label="Instagram" icon="fa-brands fa-instagram" value={igUrl} onChange={setIgUrl} placeholder="instagram.com/..." />
                  </div>

                  <button onClick={saveProfile} disabled={loading}
                    className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold text-white hover:opacity-88 disabled:opacity-50 transition-opacity"
                    style={{ background: 'var(--acc)' }}>
                    {loading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-floppy-disk" />} Save Changes
                  </button>

                  {/* Badge */}
                  <div className="mt-[26px]">
                    <h2 className="text-[14px] font-bold pb-[11px] border-b border-bdr mb-[14px] flex items-center gap-[5px]">
                      <i className="fa-solid fa-circle-check text-[#60a5fa] text-[13px]" /> Verified Badge
                    </h2>
                    <div className="bg-surf2 border border-bdr rounded-[9px] p-[14px]">
                      <h3 className="text-[13px] font-bold mb-[3px]">Apply for Verification</h3>
                      <p className="text-[11.5px] text-txt2 mb-[11px]">Admin will review. No reason needed.</p>
                      <div className="space-y-[6px] mb-[14px]">
                        {[
                          { ok: true, text: 'Account at least 7 days old' },
                          { ok: !!user?.avatar_url, text: 'Profile photo uploaded' },
                          { ok: (user?.post_count || 0) >= 1, text: 'At least 1 post' },
                          { ok: (user?.friend_count || 0) >= 10, text: `At least 10 friends (${user?.friend_count || 0}/10)` },
                        ].map(({ ok, text }) => (
                          <div key={text} className="flex items-center gap-[7px] text-[11.5px]">
                            <i className={`${ok ? 'fa-solid fa-circle-check text-green-500' : 'fa-solid fa-circle-xmark text-red-500'} text-[12px] w-[15px]`} />
                            {text}
                          </div>
                        ))}
                      </div>
                      <button onClick={applyBadge} className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[6px] text-[12px] font-semibold bg-surf border border-bdr hover:border-bdr2 transition-colors">
                        <i className="fa-solid fa-paper-plane" /> Apply Anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'Appearance' && (
                <div>
                  <h2 className="text-[14px] font-bold pb-[11px] border-b border-bdr mb-[14px]">Appearance</h2>
                  <div className="flex items-center justify-between py-[9px] border-b border-bdr">
                    <div><div className="text-[13px] font-medium">Theme</div><div className="text-[11px] text-txt2 mt-[1px]">Light, Dark</div></div>
                    <div className="flex gap-[5px]">
                      <button onClick={() => setTheme('dark')} className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[12px] font-semibold border transition-colors ${theme === 'dark' ? 'bg-surf3 border-bdr2 text-txt' : 'bg-surf2 border-bdr text-txt2 hover:border-bdr2'}`}>
                        <i className="fa-solid fa-moon" /> Dark
                      </button>
                      <button onClick={() => setTheme('light')} className={`flex items-center gap-[5px] px-[10px] py-[5px] rounded-[6px] text-[12px] font-semibold border transition-colors ${theme === 'light' ? 'bg-surf3 border-bdr2 text-txt' : 'bg-surf2 border-bdr text-txt2 hover:border-bdr2'}`}>
                        <i className="fa-solid fa-sun" /> Light
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </AppShell>
      </div>
      <BottomNav />
      {lbOpen && user?.avatar_url && <Lightbox src={user.avatar_url} onClose={() => setLbOpen(false)} />}
    </>
  )
}

function FI({ label, icon, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="block text-[10.5px] font-bold text-txt2 mb-[5px] tracking-[0.4px] uppercase">{label}</label>
      <div className="relative">
        <i className={`${icon} absolute left-[11px] top-1/2 -translate-y-1/2 text-txt3 text-[12px] pointer-events-none`} />
        <input value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-surf2 border border-bdr rounded-[8px] py-[9px] pl-[32px] pr-[12px] text-[13px] text-txt placeholder:text-txt3 focus:border-[var(--acc)] transition-colors" />
      </div>
    </div>
  )
}
