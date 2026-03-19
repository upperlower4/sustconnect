import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'
    const today = new Date().toISOString().split('T')[0]

    if (user) {
      const { data } = await supabase.from('post_views').select('id').eq('post_id', postId).eq('user_id', user.id).gte('viewed_at', today).single()
      if (data) return NextResponse.json({ ok: false })
    } else {
      const { count } = await supabase.from('post_views').select('id', { count: 'exact' }).eq('ip_address', ip).gte('viewed_at', today)
      if ((count || 0) >= 50) return NextResponse.json({ ok: false, reason: 'rate_limit' })
      const { data } = await supabase.from('post_views').select('id').eq('post_id', postId).eq('ip_address', ip).gte('viewed_at', today).single()
      if (data) return NextResponse.json({ ok: false })
    }

    await supabase.from('post_views').insert({ post_id: postId, user_id: user?.id || null, ip_address: user ? null : ip })
    await supabase.rpc('increment_view', { p_post_id: postId })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
