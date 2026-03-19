import { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import CategoryPage from '@/components/layout/CategoryPage'

export const metadata: Metadata = {
  title: 'Tuition | SUST Connect',
  description: 'SUST Tutors Available and Tuition Wanted Listings',
}

export default async function TuitionPage() {
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('type', 'tuition').eq('status', 'active')
    .order('created_at', { ascending: false }).limit(20)
  return <CategoryPage type="tuition" title="Tuition" icon="fa-solid fa-book" initialPosts={posts || []} />
}
