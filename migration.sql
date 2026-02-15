-- ============================================================================
-- 🛠️ PRISM DATABASE REPAIR SCRIPT 🛠️
-- ============================================================================
-- This script fixes the "500 Internal Server Error" and "Missing Data" issues.
-- It adds the required 'user_id' column to all tables so the new Auth system works.
-- ============================================================================

-- 1. Add user_id column to tables if missing
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE daily_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE exercise_progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE focus_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. IMPORTANT: DATA RECOVERY
-- This connects your old "orphan" data to your current user.
-- We found your ID from the debug output: 875026f0-1d5c-4d37-ab7b-9923c6506d96

UPDATE job_applications SET user_id = '875026f0-1d5c-4d37-ab7b-9923c6506d96' WHERE user_id IS NULL;
UPDATE courses SET user_id = '875026f0-1d5c-4d37-ab7b-9923c6506d96' WHERE user_id IS NULL;
UPDATE goals SET user_id = '875026f0-1d5c-4d37-ab7b-9923c6506d96' WHERE user_id IS NULL;
UPDATE daily_tasks SET user_id = '875026f0-1d5c-4d37-ab7b-9923c6506d96' WHERE user_id IS NULL;
UPDATE exercise_progress SET user_id = '875026f0-1d5c-4d37-ab7b-9923c6506d96' WHERE user_id IS NULL;
UPDATE focus_sessions SET user_id = '875026f0-1d5c-4d37-ab7b-9923c6506d96' WHERE user_id IS NULL;


-- 3. Enable RLS (Row Level Security) - Security Best Practice
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- 4. Create Access Policies (So you can see your own data)
-- Drop existing policies first to avoid formatting errors if they exist
DROP POLICY IF EXISTS "Users can manage own applications" ON job_applications;
DROP POLICY IF EXISTS "Users can manage own courses" ON courses;
DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
DROP POLICY IF EXISTS "Users can manage own tasks" ON daily_tasks;
DROP POLICY IF EXISTS "Users can manage own progress" ON exercise_progress;
DROP POLICY IF EXISTS "Users can manage own sessions" ON focus_sessions;

CREATE POLICY "Users can manage own applications" ON job_applications USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own courses" ON courses USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON daily_tasks USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own progress" ON exercise_progress USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON focus_sessions USING (auth.uid() = user_id);

-- 5. Fix permissions for standard users
GRANT ALL ON job_applications TO authenticated;
GRANT ALL ON courses TO authenticated;
GRANT ALL ON goals TO authenticated;
GRANT ALL ON daily_tasks TO authenticated;
GRANT ALL ON exercise_progress TO authenticated;
GRANT ALL ON focus_sessions TO authenticated;
