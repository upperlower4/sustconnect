import { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import CategoryPage from '@/components/layout/CategoryPage'

export const metadata: Metadata = {
  title: 'Buy & Sell | SUST Connect',
  description: 'SUST Students Buy and Sell — Electronics, Books, Furniture and more',
}

export default async function SellPage() {
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('type', 'sell').eq('status', 'active')
    .order('created_at', { ascending: false }).limit(20)
  return <CategoryPage type="sell" title="Buy & Sell" icon="fa-solid fa-tag" initialPosts={posts || []} />
}
