import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="text-center">
        <div className="text-[72px] font-black leading-none mb-[6px]" style={{ color: 'var(--txt3)' }}>404</div>
        <div className="text-[18px] font-bold mb-[6px]" style={{ color: 'var(--txt)' }}>Page not found</div>
        <div className="text-[13px] mb-[20px]" style={{ color: 'var(--txt2)' }}>এই page টা খুঁজে পাওয়া যাচ্ছে না।</div>
        <Link href="/" className="inline-flex items-center gap-[6px] px-[16px] py-[8px] rounded-[8px] text-[13px] font-semibold text-white hover:opacity-88 transition-opacity" style={{ background: 'var(--acc)' }}>
          <i className="fa-solid fa-house" /> Go to Feed
        </Link>
      </div>
    </div>
  )
}
