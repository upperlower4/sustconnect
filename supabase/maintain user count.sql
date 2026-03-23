UPDATE users u
SET post_count = (
  SELECT COUNT(*) FROM posts p
  WHERE p.user_id = u.id AND p.status = 'active'
);

UPDATE users u
SET friend_count = (
  SELECT COUNT(*) FROM friendships f
  WHERE (f.user_id = u.id OR f.friend_id = u.id)
  AND f.status = 'accepted'
);