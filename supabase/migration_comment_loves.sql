-- Migration: Add comment_loves table + Fix RLS policies (Safe for existing database)
-- এই script টা আপনার existing database এ run করুন - data নষ্ট হবে না

-- ============================================
-- PART 1: Comment Loves Table
-- ============================================

-- 1. comment_loves table তৈরি করুন (যদি না থাকে)
CREATE TABLE IF NOT EXISTS comment_loves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 2. RLS enable করুন
ALTER TABLE comment_loves ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies তৈরি করুন (যদি না থাকে)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_loves' AND policyname = 'comment_loves_all') THEN
    CREATE POLICY "comment_loves_all" ON comment_loves FOR ALL USING (TRUE) WITH CHECK (TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comment_loves' AND policyname = 'comment_loves_read') THEN
    CREATE POLICY "comment_loves_read" ON comment_loves FOR SELECT USING (TRUE);
  END IF;
END $$;

-- 4. Trigger function তৈরি করুন
CREATE OR REPLACE FUNCTION update_comment_love_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN 
    UPDATE comments SET love_count = love_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN 
    UPDATE comments SET love_count = love_count - 1 WHERE id = OLD.comment_id; 
  END IF;
  RETURN NULL; 
END; $$ LANGUAGE plpgsql;

-- 5. Trigger তৈরি করুন (যদি না থাকে)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_comment_love') THEN
    CREATE TRIGGER trg_comment_love 
    AFTER INSERT OR DELETE ON comment_loves 
    FOR EACH ROW EXECUTE FUNCTION update_comment_love_count();
  END IF;
END $$;

-- ============================================
-- PART 2: Fix Friendships RLS Policy
-- ============================================

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_read') THEN
    CREATE POLICY "friendships_read" ON friendships FOR SELECT USING (TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_write') THEN
    CREATE POLICY "friendships_write" ON friendships FOR INSERT WITH CHECK (TRUE);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'friendships_update') THEN
    CREATE POLICY "friendships_update" ON friendships FOR UPDATE USING (TRUE);
  END IF;
END $$;

-- ============================================
-- PART 3: Fix Comments RLS Policy
-- ============================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "comments_write" ON comments;

-- Create new permissive policy
CREATE POLICY "comments_write" ON comments FOR INSERT WITH CHECK (TRUE);

-- ✅ Done! আপনার existing data safe আছে
