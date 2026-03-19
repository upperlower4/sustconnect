import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import PostDetailClient from './PostDetailClient'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createSupabaseServerClient()
  const { data: post } = await supabase
    .from('posts')
    .select('*, user:users(full_name, department)')
    .eq('id', params.id)
    .single()

  if (!post) return { title: 'Post Not Found' }

  const isConfession = post.type === 'confession'
  const title = isConfession
    ? `Confession | SUST Connect`
    : `${post.user?.full_name} on SUST Connect`
  const description = post.content.slice(0, 160)

  return {
    title,
    description,
    robots: isConfession ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      images: post.image_url ? [post.image_url] : ['/og-image.png'],
    },
  }
}

export default async function PostDetailPage({ params }: Props) {
  const supabase = await createSupabaseServerClient()

  const { data: post } = await supabase
    .from('posts')
    .select(`*, user:users(id,full_name,username,avatar_url,department,session,is_verified)`)
    .eq('id', params.id)
    .eq('status', 'active')
    .single()

  if (!post) notFound()

  const { data: comments } = await supabase
    .from('comments')
    .select(`*, user:users(id,full_name,username,avatar_url)`)
    .eq('post_id', params.id)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  return <PostDetailClient post={post} initialComments={comments || []} />
}
