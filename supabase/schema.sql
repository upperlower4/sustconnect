-- SUST Connect Full Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  department TEXT NOT NULL,
  session TEXT NOT NULL,
  board_roll TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  dob_day INTEGER NOT NULL CHECK (dob_day BETWEEN 1 AND 31),
  dob_month INTEGER NOT NULL CHECK (dob_month BETWEEN 1 AND 12),
  dob_year INTEGER NOT NULL,
  facebook_url TEXT,
  instagram_url TEXT,
  custom_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POSTS
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general','confession','notice','job','tuition','sell')),
  content TEXT NOT NULL DEFAULT '',
  image_url TEXT, image_public_id TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','deleted')),
  love_count INTEGER DEFAULT 0, comment_count INTEGER DEFAULT 0, view_count INTEGER DEFAULT 0,
  job_title TEXT, company TEXT, job_type TEXT, salary_range TEXT, qualification TEXT,
  expires_at TIMESTAMPTZ, expired_notified BOOLEAN DEFAULT FALSE, contact TEXT,
  tuition_type TEXT CHECK (tuition_type IN ('available','wanted')),
  subjects TEXT, level TEXT, rate TEXT, location TEXT,
  item_name TEXT, price TEXT, category TEXT, condition TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- POST VIEWS
CREATE TABLE post_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_views_user ON post_views(post_id, user_id, viewed_at);
CREATE INDEX idx_views_ip   ON post_views(post_id, ip_address, viewed_at);

-- POST LOVES
CREATE TABLE post_loves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- COMMENTS
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  love_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_post ON comments(post_id);

-- FRIENDSHIPS
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  type TEXT DEFAULT 'friend' CHECK (type IN ('friend','prem')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- CRUSHES
CREATE TABLE crushes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_matched BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- DM THREADS
CREATE TABLE dm_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_ids UUID[] NOT NULL,
  last_message TEXT, last_message_at TIMESTAMPTZ,
  is_request BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
  link TEXT, is_read BOOLEAN DEFAULT FALSE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifs_user ON notifications(user_id, created_at DESC);

-- PUSH SUBSCRIPTIONS
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT UNIQUE NOT NULL, p256dh TEXT NOT NULL, auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BADGE REQUESTS
CREATE TABLE badge_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTIONS
CREATE OR REPLACE FUNCTION increment_view(p_post_id UUID)
RETURNS VOID AS $$ UPDATE posts SET view_count = view_count + 1 WHERE id = p_post_id; $$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION update_love_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE posts SET love_count = love_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE posts SET love_count = love_count - 1 WHERE id = OLD.post_id; END IF;
  RETURN NULL; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_love AFTER INSERT OR DELETE ON post_loves FOR EACH ROW EXECUTE FUNCTION update_love_count();

CREATE OR REPLACE FUNCTION update_comment_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id; END IF;
  RETURN NULL; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_comment AFTER INSERT OR DELETE ON comments FOR EACH ROW EXECUTE FUNCTION update_comment_count();

CREATE OR REPLACE FUNCTION check_crush_match() RETURNS TRIGGER AS $$
DECLARE v_reverse UUID;
BEGIN
  SELECT id INTO v_reverse FROM crushes WHERE sender_id = NEW.receiver_id AND receiver_id = NEW.sender_id AND is_matched = FALSE;
  IF v_reverse IS NOT NULL THEN
    UPDATE crushes SET is_matched = TRUE WHERE id IN (NEW.id, v_reverse);
    INSERT INTO dm_threads (participant_ids, is_request) VALUES (ARRAY[NEW.sender_id, NEW.receiver_id], FALSE);
    INSERT INTO notifications (user_id, type, title, body, actor_id) VALUES
      (NEW.sender_id, 'crush_match', '💑 Crush Match!', 'It''s a match! DM is now open.', NEW.receiver_id),
      (NEW.receiver_id, 'crush_match', '💑 Crush Match!', 'It''s a match! DM is now open.', NEW.sender_id);
  ELSE
    INSERT INTO notifications (user_id, type, title, body) VALUES
      (NEW.receiver_id, 'crush_received', '💘 Secret Crush!', 'Someone has a crush on you!');
  END IF;
  RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_crush AFTER INSERT ON crushes FOR EACH ROW EXECUTE FUNCTION check_crush_match();

CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_posts_ts BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_loves ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE crushes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read"   ON users FOR SELECT USING (TRUE);
CREATE POLICY "users_write"  ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "posts_read"   ON posts FOR SELECT USING (status = 'active' OR user_id = auth.uid());
CREATE POLICY "posts_write"  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "views_insert" ON post_views FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "views_read"   ON post_views FOR SELECT USING (TRUE);
CREATE POLICY "loves_all"    ON post_loves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "loves_read"   ON post_loves FOR SELECT USING (TRUE);
CREATE POLICY "comments_read"   ON comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_write"  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "notifs_own"   ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "dm_own"       ON dm_threads FOR SELECT USING (auth.uid() = ANY(participant_ids));
CREATE POLICY "msg_read"     ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM dm_threads WHERE id = thread_id AND auth.uid() = ANY(participant_ids)));
CREATE POLICY "msg_insert"   ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "push_own"     ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "crushes_read" ON crushes FOR SELECT USING (auth.uid() IN (sender_id, receiver_id));
CREATE POLICY "crushes_write" ON crushes FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE crushes;
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
