# SUST Connect 🎓

শাহজালাল বিশ্ববিদ্যালয়ের নিজস্ব সোশ্যাল নেটওয়ার্ক।

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **Images**: Cloudinary (auto-compress: PP→4KB, Post→70KB)
- **Push Notifications**: Web Push API (no Firebase needed)
- **Deploy**: Vercel (free)

## Setup

### 1. Clone & Install
```bash
git clone <repo>
cd sust-connect
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
# Fill in all values
```

### 3. Generate VAPID Keys (for Push Notifications)
```bash
npx web-push generate-vapid-keys
# Paste into .env.local
```

### 4. Setup Supabase
- Create project at supabase.com
- Run `supabase/schema.sql` in SQL Editor
- Enable Realtime for: notifications, messages, crushes, posts

### 5. Setup Cloudinary
- Create account at cloudinary.com
- Get Cloud name, API Key, API Secret

### 6. Run Locally
```bash
npm run dev
```

### 7. Deploy to Vercel
```bash
npx vercel --prod
# Add all env variables in Vercel dashboard
```

### 8. Google Search Console
- Add property with your domain
- Verify with HTML meta tag (add GOOGLE_SITE_VERIFICATION to env)
- Submit sitemap: `https://yourdomain.com/sitemap.xml`

## Features
✅ Guest feed (Quora style - no login required)
✅ View count (IP-based for guests, user_id for logged in)
✅ Signup: Email+Pass → OTP → Profile (DOB: Day/Month dropdown/Year)
✅ Images: Cloudinary auto-compress (PP=4KB, Post=70KB)
✅ PC: Side DM panel, Mobile: Full-screen DM page
✅ Job/Tuition auto-expire + notify (2 days before + grace period)
✅ Birthday notifications for friends
✅ Web Push Notifications (no Firebase)
✅ SEO: public posts indexed, confessions/DM blocked
✅ Crush system with auto-match detection
✅ Dark/Light theme

## Cron Job
Runs daily at midnight via Vercel Cron:
- Job/Tuition expiry notifications
- Auto-hide expired posts (7-day grace period then delete)
- Birthday notifications to all friends
