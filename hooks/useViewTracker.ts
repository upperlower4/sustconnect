'use client'
import { useEffect, useRef } from 'react'

export function useViewTracker(postId: string) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Small delay so view is counted only if user actually sees the post
    const timer = setTimeout(() => {
      fetch('/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [postId])
}
