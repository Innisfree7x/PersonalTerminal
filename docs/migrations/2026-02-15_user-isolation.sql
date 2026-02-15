-- User isolation migration for Prism
-- Date: 2026-02-15
--
-- IMPORTANT:
-- 1) Run this in a maintenance window.
-- 2) Set migration owner id before execution:
--      select set_config('app.migration_user_id', '<auth.users.id>', false);
-- 3) Backfill runs automatically and aborts if null user_id values remain.

begin;

-- 1) Add user_id columns
alter table if exists goals add column if not exists user_id uuid references auth.users(id);
alter table if exists job_applications add column if not exists user_id uuid references auth.users(id);
alter table if exists courses add column if not exists user_id uuid references auth.users(id);
alter table if exists exercise_progress add column if not exists user_id uuid references auth.users(id);
alter table if exists daily_tasks add column if not exists user_id uuid references auth.users(id);
alter table if exists focus_sessions add column if not exists user_id uuid references auth.users(id);

-- 2) Backfill existing rows (single-user migration path)
do $$
declare
  migration_user_id uuid;
begin
  migration_user_id := nullif(current_setting('app.migration_user_id', true), '')::uuid;

  if migration_user_id is null then
    raise exception 'Missing app.migration_user_id. Set it with select set_config(...) before running this migration.';
  end if;

  update goals set user_id = migration_user_id where user_id is null;
  update job_applications set user_id = migration_user_id where user_id is null;
  update courses set user_id = migration_user_id where user_id is null;
  update daily_tasks set user_id = migration_user_id where user_id is null;
  update focus_sessions set user_id = migration_user_id where user_id is null;

  -- Prefer course owner for existing exercise rows.
  update exercise_progress ep
  set user_id = c.user_id
  from courses c
  where ep.course_id = c.id
    and ep.user_id is null
    and c.user_id is not null;

  update exercise_progress set user_id = migration_user_id where user_id is null;

  if exists (select 1 from goals where user_id is null) then
    raise exception 'Backfill failed: goals.user_id still contains null values';
  end if;
  if exists (select 1 from job_applications where user_id is null) then
    raise exception 'Backfill failed: job_applications.user_id still contains null values';
  end if;
  if exists (select 1 from courses where user_id is null) then
    raise exception 'Backfill failed: courses.user_id still contains null values';
  end if;
  if exists (select 1 from exercise_progress where user_id is null) then
    raise exception 'Backfill failed: exercise_progress.user_id still contains null values';
  end if;
  if exists (select 1 from daily_tasks where user_id is null) then
    raise exception 'Backfill failed: daily_tasks.user_id still contains null values';
  end if;
  if exists (select 1 from focus_sessions where user_id is null) then
    raise exception 'Backfill failed: focus_sessions.user_id still contains null values';
  end if;
end $$;

-- 3) Enforce not null after backfill
alter table if exists goals alter column user_id set not null;
alter table if exists job_applications alter column user_id set not null;
alter table if exists courses alter column user_id set not null;
alter table if exists exercise_progress alter column user_id set not null;
alter table if exists daily_tasks alter column user_id set not null;
alter table if exists focus_sessions alter column user_id set not null;

-- 4) Add indexes
create index if not exists idx_goals_user_id on goals(user_id);
create index if not exists idx_job_applications_user_id on job_applications(user_id);
create index if not exists idx_courses_user_id on courses(user_id);
create index if not exists idx_exercise_progress_user_id on exercise_progress(user_id);
create index if not exists idx_daily_tasks_user_id on daily_tasks(user_id);
create index if not exists idx_focus_sessions_user_id on focus_sessions(user_id);

-- 5) Enable RLS
alter table if exists goals enable row level security;
alter table if exists job_applications enable row level security;
alter table if exists courses enable row level security;
alter table if exists exercise_progress enable row level security;
alter table if exists daily_tasks enable row level security;
alter table if exists focus_sessions enable row level security;
alter table if exists goals force row level security;
alter table if exists job_applications force row level security;
alter table if exists courses force row level security;
alter table if exists exercise_progress force row level security;
alter table if exists daily_tasks force row level security;
alter table if exists focus_sessions force row level security;

-- 6) Drop broad dev policies if present
drop policy if exists "Allow all access" on goals;
drop policy if exists "Allow all access" on job_applications;
drop policy if exists "Allow all access" on courses;
drop policy if exists "Allow all access" on exercise_progress;
drop policy if exists "Allow all access" on daily_tasks;
drop policy if exists "Allow all access" on focus_sessions;

-- 7) Create owner-only policies
drop policy if exists "Users can view own goals" on goals;
drop policy if exists "Users can insert own goals" on goals;
drop policy if exists "Users can update own goals" on goals;
drop policy if exists "Users can delete own goals" on goals;
create policy "Users can view own goals" on goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on goals for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own applications" on job_applications;
drop policy if exists "Users can insert own applications" on job_applications;
drop policy if exists "Users can update own applications" on job_applications;
drop policy if exists "Users can delete own applications" on job_applications;
create policy "Users can view own applications" on job_applications for select using (auth.uid() = user_id);
create policy "Users can insert own applications" on job_applications for insert with check (auth.uid() = user_id);
create policy "Users can update own applications" on job_applications for update using (auth.uid() = user_id);
create policy "Users can delete own applications" on job_applications for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own courses" on courses;
drop policy if exists "Users can insert own courses" on courses;
drop policy if exists "Users can update own courses" on courses;
drop policy if exists "Users can delete own courses" on courses;
create policy "Users can view own courses" on courses for select using (auth.uid() = user_id);
create policy "Users can insert own courses" on courses for insert with check (auth.uid() = user_id);
create policy "Users can update own courses" on courses for update using (auth.uid() = user_id);
create policy "Users can delete own courses" on courses for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own exercise progress" on exercise_progress;
drop policy if exists "Users can insert own exercise progress" on exercise_progress;
drop policy if exists "Users can update own exercise progress" on exercise_progress;
drop policy if exists "Users can delete own exercise progress" on exercise_progress;
create policy "Users can view own exercise progress" on exercise_progress for select using (auth.uid() = user_id);
create policy "Users can insert own exercise progress" on exercise_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own exercise progress" on exercise_progress for update using (auth.uid() = user_id);
create policy "Users can delete own exercise progress" on exercise_progress for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own daily tasks" on daily_tasks;
drop policy if exists "Users can insert own daily tasks" on daily_tasks;
drop policy if exists "Users can update own daily tasks" on daily_tasks;
drop policy if exists "Users can delete own daily tasks" on daily_tasks;
create policy "Users can view own daily tasks" on daily_tasks for select using (auth.uid() = user_id);
create policy "Users can insert own daily tasks" on daily_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own daily tasks" on daily_tasks for update using (auth.uid() = user_id);
create policy "Users can delete own daily tasks" on daily_tasks for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own focus sessions" on focus_sessions;
drop policy if exists "Users can insert own focus sessions" on focus_sessions;
drop policy if exists "Users can update own focus sessions" on focus_sessions;
drop policy if exists "Users can delete own focus sessions" on focus_sessions;
create policy "Users can view own focus sessions" on focus_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own focus sessions" on focus_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own focus sessions" on focus_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own focus sessions" on focus_sessions for delete using (auth.uid() = user_id);

commit;
