import type { PostType } from '@/types'

const styles: Record<PostType, string> = {
  general:    'bg-[rgba(99,102,241,0.1)] text-[#818cf8]',
  confession: 'bg-[rgba(244,114,182,0.1)] text-[#f472b6]',
  notice:     'bg-[rgba(96,165,250,0.1)] text-[#60a5fa]',
  job:        'bg-[rgba(52,211,153,0.1)] text-[#34d399]',
  tuition:    'bg-[rgba(251,191,36,0.1)] text-[#fbbf24]',
  sell:       'bg-[rgba(167,139,250,0.1)] text-[#a78bfa]',
}

const labels: Record<PostType, string> = {
  general: 'General', confession: 'Confession', notice: 'Notice',
  job: 'Job', tuition: 'Tuition', sell: 'Sell',
}

export default function Badge({ type }: { type: PostType }) {
  return (
    <span className={`px-[9px] py-[3px] rounded-full text-[10px] font-bold tracking-[0.3px] flex-shrink-0 ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}
