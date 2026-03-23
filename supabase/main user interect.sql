CREATE OR REPLACE FUNCTION update_user_post_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET post_count = post_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET post_count = post_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_post_count ON posts;
CREATE TRIGGER trg_user_post_count
AFTER INSERT OR DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION update_user_post_count();

CREATE OR REPLACE FUNCTION update_user_friend_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE users SET friend_count = friend_count + 1 WHERE id IN (NEW.user_id, NEW.friend_id);
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_friend_count ON friendships;
CREATE TRIGGER trg_user_friend_count
AFTER UPDATE ON friendships
FOR EACH ROW EXECUTE FUNCTION update_user_friend_count();