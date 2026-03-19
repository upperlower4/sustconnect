import { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import CategoryPage from '@/components/layout/CategoryPage'

export const metadata: Metadata = {
  title: 'Jobs | SUST Connect',
  description: 'SUST Students এর Job Opportunities — Full-time, Part-time, Internship',
}

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('type', 'job').eq('status', 'active')
    .order('created_at', { ascending: false }).limit(20)
  return <CategoryPage type="job" title="Jobs" icon="fa-solid fa-briefcase" initialPosts={posts || []} />
}
