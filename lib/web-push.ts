import webpush from 'web-push'

// Lazy initialization to prevent build-time errors when env vars aren't available
function initWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  
  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys not configured')
  }
  
  webpush.setVapidDetails(
    'mailto:admin@sustconnect.vercel.app',
    publicKey,
    privateKey
  )
}

export interface PushPayload {
  title: string
  body: string
  url?: string
}

export async function sendPushToUser(supabase: any, userId: string, payload: PushPayload) {
  // Initialize only when needed (runtime)
  initWebPush()
  
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (!subs?.length) return

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, icon: '/icons/icon-192.png' })
      )
    } catch (e: any) {
      if (e.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
}

export default webpush
