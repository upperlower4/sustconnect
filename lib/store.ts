'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  setUser: (user: User | null) => void
}
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({ user: null, setUser: (user) => set({ user }) }),
    { name: 'sust-auth' }
  )
)

interface ThemeStore {
  theme: 'dark' | 'light'
  setTheme: (t: 'dark' | 'light') => void
  toggle: () => void
}
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme })
        if (theme === 'light') document.documentElement.classList.add('light')
        else document.documentElement.classList.remove('light')
        localStorage.setItem('theme', theme)
      },
      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },
    }),
    { name: 'sust-theme' }
  )
)

interface LoveStore {
  loved: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
}
export const useLoveStore = create<LoveStore>()(
  persist(
    (set, get) => ({
      loved: [],
      toggle: (id) => {
        const loved = get().loved
        set({ loved: loved.includes(id) ? loved.filter(x => x !== id) : [...loved, id] })
      },
      has: (id) => get().loved.includes(id),
    }),
    { name: 'sust-loves' }
  )
)

interface DMStore {
  isOpen: boolean
  activeThreadId?: string
  openThread: (threadId?: string) => void
  toggle: () => void
  close: () => void
}
export const useDMStore = create<DMStore>()((set) => ({
  isOpen: false,
  activeThreadId: undefined,
  openThread: (threadId) => set({ isOpen: true, activeThreadId: threadId }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false, activeThreadId: undefined }),
}))
