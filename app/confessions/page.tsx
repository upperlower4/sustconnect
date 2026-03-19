import { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import CategoryPage from '@/components/layout/CategoryPage'

export const metadata: Metadata = {
  title: 'Confessions | SUST Connect',
  description: 'Anonymous confessions from SUST students',
  robots: { index: false, follow: false },
}

export default async function ConfessionsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('type', 'confession').eq('status', 'active')
    .order('created_at', { ascending: false }).limit(20)
  return <CategoryPage type="confession" title="Confessions" icon="fa-regular fa-face-smile-wink" initialPosts={posts || []} />
}
