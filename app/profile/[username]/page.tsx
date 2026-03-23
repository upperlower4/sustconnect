import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import ProfileClient, { Props as ProfileClientProps } from './ProfileClient'

interface PageProps { params: { username: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = await createSupabaseServerClient()
  const { data: user } = await supabase.from('users').select('*').eq('username', params.username).single()
  if (!user) return { title: 'User Not Found' }
  return {
    title: `${user.full_name} (@${user.username})`,
    description: `${user.full_name} — ${user.department}, SUST. ${user.bio || ''}`,
    openGraph: { images: user.avatar_url ? [user.avatar_url] : ['/og-image.png'] },
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient()
  const { data: profileUser } = await supabase.from('users').select('*').eq('username', params.username).single()
  if (!profileUser) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('user_id', profileUser.id)
    .eq('status', 'active')
    .eq('is_anonymous', false)
    .order('created_at', { ascending: false })
    .limit(20)

  return <ProfileClient profileUser={profileUser} initialPosts={posts || []} />
}
