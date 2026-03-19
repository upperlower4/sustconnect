import { createSupabaseServerClient } from '@/lib/supabase-server'
import FeedClient from './FeedClient'

export default async function HomePage() {
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('status', 'active')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)
  return <FeedClient initialPosts={posts || []} />
}
