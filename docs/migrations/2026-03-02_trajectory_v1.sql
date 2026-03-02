-- Phase 15: Trajectory Tab V1 core schema
-- Date: 2026-03-02

begin;

create table if not exists public.trajectory_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  hours_per_week integer not null check (hours_per_week between 1 and 60),
  horizon_months integer not null default 24 check (horizon_months between 6 and 36),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trajectory_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null check (category in ('thesis', 'gmat', 'master_app', 'internship', 'other')),
  due_date date not null,
  effort_hours integer not null check (effort_hours >= 1),
  buffer_weeks integer not null default 2 check (buffer_weeks between 0 and 16),
  priority integer not null default 3 check (priority between 1 and 5),
  status text not null default 'active' check (status in ('active', 'done', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trajectory_windows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  window_type text not null check (window_type in ('internship', 'master_cycle', 'exam_period', 'other')),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trajectory_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.trajectory_goals(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  weekly_hours integer not null check (weekly_hours between 1 and 60),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'done', 'skipped')),
  source text not null default 'trajectory_v1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_trajectory_blocks_idempotent
  on public.trajectory_blocks(user_id, goal_id, start_date, end_date);

create index if not exists idx_trajectory_goals_user_due
  on public.trajectory_goals(user_id, due_date);

create index if not exists idx_trajectory_goals_user_status
  on public.trajectory_goals(user_id, status);

create index if not exists idx_trajectory_windows_user_start
  on public.trajectory_windows(user_id, start_date);

create index if not exists idx_trajectory_blocks_user_start
  on public.trajectory_blocks(user_id, start_date);

alter table public.trajectory_settings enable row level security;
alter table public.trajectory_goals enable row level security;
alter table public.trajectory_windows enable row level security;
alter table public.trajectory_blocks enable row level security;

alter table public.trajectory_settings force row level security;
alter table public.trajectory_goals force row level security;
alter table public.trajectory_windows force row level security;
alter table public.trajectory_blocks force row level security;

drop policy if exists "Users can view own trajectory settings" on public.trajectory_settings;
drop policy if exists "Users can insert own trajectory settings" on public.trajectory_settings;
drop policy if exists "Users can update own trajectory settings" on public.trajectory_settings;
drop policy if exists "Users can delete own trajectory settings" on public.trajectory_settings;

create policy "Users can view own trajectory settings"
  on public.trajectory_settings for select using (auth.uid() = user_id);
create policy "Users can insert own trajectory settings"
  on public.trajectory_settings for insert with check (auth.uid() = user_id);
create policy "Users can update own trajectory settings"
  on public.trajectory_settings for update using (auth.uid() = user_id);
create policy "Users can delete own trajectory settings"
  on public.trajectory_settings for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own trajectory goals" on public.trajectory_goals;
drop policy if exists "Users can insert own trajectory goals" on public.trajectory_goals;
drop policy if exists "Users can update own trajectory goals" on public.trajectory_goals;
drop policy if exists "Users can delete own trajectory goals" on public.trajectory_goals;

create policy "Users can view own trajectory goals"
  on public.trajectory_goals for select using (auth.uid() = user_id);
create policy "Users can insert own trajectory goals"
  on public.trajectory_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own trajectory goals"
  on public.trajectory_goals for update using (auth.uid() = user_id);
create policy "Users can delete own trajectory goals"
  on public.trajectory_goals for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own trajectory windows" on public.trajectory_windows;
drop policy if exists "Users can insert own trajectory windows" on public.trajectory_windows;
drop policy if exists "Users can update own trajectory windows" on public.trajectory_windows;
drop policy if exists "Users can delete own trajectory windows" on public.trajectory_windows;

create policy "Users can view own trajectory windows"
  on public.trajectory_windows for select using (auth.uid() = user_id);
create policy "Users can insert own trajectory windows"
  on public.trajectory_windows for insert with check (auth.uid() = user_id);
create policy "Users can update own trajectory windows"
  on public.trajectory_windows for update using (auth.uid() = user_id);
create policy "Users can delete own trajectory windows"
  on public.trajectory_windows for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own trajectory blocks" on public.trajectory_blocks;
drop policy if exists "Users can insert own trajectory blocks" on public.trajectory_blocks;
drop policy if exists "Users can update own trajectory blocks" on public.trajectory_blocks;
drop policy if exists "Users can delete own trajectory blocks" on public.trajectory_blocks;

create policy "Users can view own trajectory blocks"
  on public.trajectory_blocks for select using (auth.uid() = user_id);
create policy "Users can insert own trajectory blocks"
  on public.trajectory_blocks for insert with check (auth.uid() = user_id);
create policy "Users can update own trajectory blocks"
  on public.trajectory_blocks for update using (auth.uid() = user_id);
create policy "Users can delete own trajectory blocks"
  on public.trajectory_blocks for delete using (auth.uid() = user_id);

commit;
