import { MetadataRoute } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://sustconnect.vercel.app'
  const supabase = await createSupabaseServerClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('id, updated_at')
    .in('type', ['general','notice','job','tuition','sell'])
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1000)

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/jobs`,    lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/notices`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/tuition`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/sell`,    lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...(posts || []).map(p => ({ url: `${base}/post/${p.id}`, lastModified: new Date(p.updated_at), changeFrequency: 'weekly' as const, priority: 0.7 })),
  ]
}
