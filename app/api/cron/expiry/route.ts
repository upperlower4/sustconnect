import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUser } from '@/lib/web-push'
import { daysUntilExpiry } from '@/lib/utils'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  const today = new Date()
  const twoDays = new Date(today); twoDays.setDate(today.getDate() + 2)
  const sevenAgo = new Date(today); sevenAgo.setDate(today.getDate() - 7)

  const { data: expiring } = await supabase.from('posts').select('*, user:users(id)').in('type',['job','tuition']).eq('status','active').eq('expired_notified',false).lte('expires_at', twoDays.toISOString()).gte('expires_at', today.toISOString())
  for (const p of expiring || []) {
    const days = daysUntilExpiry(p.expires_at)
    await supabase.from('notifications').insert({ user_id: p.user.id, type:'job_expiring', title:'Post Expiring Soon', body:`Your ${p.type} post expires in ${days} day${days!==1?'s':''}.`, link:`/post/${p.id}` })
    await sendPushToUser(supabase, p.user.id, { title:'⏰ Post Expiring Soon', body:`Expires in ${days} day${days!==1?'s':''}`, url:`/post/${p.id}` })
    await supabase.from('posts').update({ expired_notified: true }).eq('id', p.id)
  }

  await supabase.from('posts').update({ status:'expired' }).in('type',['job','tuition']).eq('status','active').lt('expires_at', today.toISOString())
  await supabase.from('posts').delete().eq('status','expired').lt('expires_at', sevenAgo.toISOString())

  const { data: bdays } = await supabase.from('users').select('id,full_name').eq('dob_day', today.getDate()).eq('dob_month', today.getMonth()+1)
  for (const u of bdays || []) {
    const { data: friends } = await supabase.from('friendships').select('user_id,friend_id').or(`user_id.eq.${u.id},friend_id.eq.${u.id}`).eq('status','accepted')
    for (const f of friends || []) {
      const fid = f.user_id === u.id ? f.friend_id : f.user_id
      await supabase.from('notifications').insert({ user_id:fid, type:'birthday', title:'🎂 Birthday!', body:`Today is <b>${u.full_name}</b>'s birthday!`, link:`/profile/${u.id}`, actor_id:u.id })
      await sendPushToUser(supabase, fid, { title:`🎂 ${u.full_name}'s Birthday!`, body:"Today is their birthday! 🎉", url:`/profile/${u.id}` })
    }
  }

  return NextResponse.json({ ok: true })
}
