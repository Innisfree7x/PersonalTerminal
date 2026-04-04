-- Phase 3: Achievements & Room Customization

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_select" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owner_insert" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE user_room_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT true,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_key)
);

ALTER TABLE user_room_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON user_room_items FOR ALL USING (auth.uid() = user_id);
