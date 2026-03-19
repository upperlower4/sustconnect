import { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import CategoryPage from '@/components/layout/CategoryPage'

export const metadata: Metadata = {
  title: 'Notices | SUST Connect',
  description: 'SUST Official Notices, Exam Schedules, University Updates',
}

export default async function NoticesPage() {
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('type', 'notice').eq('status', 'active')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false }).limit(20)
  return <CategoryPage type="notice" title="Notices" icon="fa-solid fa-bullhorn" initialPosts={posts || []} />
}
