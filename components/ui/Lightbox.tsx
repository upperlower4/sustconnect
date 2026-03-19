'use client'
import { useEffect } from 'react'

export default function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center cursor-pointer"
      style={{ background: 'rgba(0,0,0,0.92)' }} onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-3 right-3 w-9 h-9 rounded-full text-white text-[15px] flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)' }}>
        <i className="fa-solid fa-xmark" />
      </button>
      <img src={src} alt="Full view"
        className="max-w-[90vw] max-h-[88vh] rounded-md object-contain"
        onClick={e => e.stopPropagation()} />
    </div>
  )
}
