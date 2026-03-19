export type Theme = 'dark' | 'light'

export type PostType = 'general' | 'confession' | 'notice' | 'job' | 'tuition' | 'sell'

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted'

export type Gender = 'Male' | 'Female' | 'Other'

export interface User {
  id: string
  email: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  department: string
  session: string
  board_roll?: string
  gender: Gender
  dob_day: number
  dob_month: number
  dob_year: number
  is_verified: boolean
  is_admin: boolean
  facebook_url?: string
  instagram_url?: string
  custom_url?: string
  created_at: string
  post_count?: number
  friend_count?: number
}

export interface Post {
  id: string
  user_id: string
  type: PostType
  content: string
  image_url?: string
  image_public_id?: string
  is_anonymous: boolean
  is_pinned: boolean
  status: 'active' | 'expired' | 'deleted'
  love_count: number
  comment_count: number
  view_count: number
  // Job/Tuition fields
  job_title?: string
  company?: string
  job_type?: string
  salary_range?: string
  qualification?: string
  expires_at?: string
  expired_notified?: boolean
  contact?: string
  // Tuition fields
  tuition_type?: 'available' | 'wanted'
  subjects?: string
  level?: string
  rate?: string
  location?: string
  // Sell fields
  item_name?: string
  price?: string
  category?: string
  condition?: string
  // Relations
  user?: User
  is_loved?: boolean
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id?: string
  content: string
  love_count: number
  user?: User
  replies?: Comment[]
  is_loved?: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'friend_request' | 'friend_accepted' | 'prem_request' | 'prem_accepted' |
        'crush_received' | 'crush_match' | 'post_loved' | 'post_commented' |
        'comment_replied' | 'mentioned' | 'birthday' | 'badge_approved' |
        'post_pinned' | 'message_request' | 'dm_message' | 'job_expiring'
  title: string
  body: string
  link?: string
  is_read: boolean
  actor_id?: string
  actor?: User
  created_at: string
}

export interface Message {
  id: string
  thread_id: string
  sender_id: string
  content: string
  is_read: boolean
  sender?: User
  created_at: string
}

export interface DMThread {
  id: string
  participant_ids: string[]
  last_message?: string
  last_message_at?: string
  unread_count?: number
  other_user?: User
  is_request: boolean
}

export interface Crush {
  id: string
  sender_id: string
  receiver_id: string
  is_matched: boolean
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}
