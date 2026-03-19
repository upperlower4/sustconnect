'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function MyProfileRedirect() {
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace(`/profile/${user.username}`)
    else router.replace('/auth/login')
  }, [user])

  return null
}
