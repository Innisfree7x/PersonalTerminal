-- Phase 30 - Career Intelligence: CV Profiles
-- Date: 2026-03-14

begin;

create table if not exists public.career_cv_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_text text not null check (char_length(cv_text) between 80 and 120000),
  cv_rank integer not null check (cv_rank between 0 and 100),
  rank_tier text not null check (rank_tier in ('top', 'strong', 'developing', 'early')),
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  skills text[] not null default '{}',
  target_tracks text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_career_cv_profiles_user_id on public.career_cv_profiles(user_id);
create index if not exists idx_career_cv_profiles_rank on public.career_cv_profiles(cv_rank);

alter table public.career_cv_profiles enable row level security;
alter table public.career_cv_profiles force row level security;

drop policy if exists "Users can view own cv profile" on public.career_cv_profiles;
create policy "Users can view own cv profile"
  on public.career_cv_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cv profile" on public.career_cv_profiles;
create policy "Users can insert own cv profile"
  on public.career_cv_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own cv profile" on public.career_cv_profiles;
create policy "Users can update own cv profile"
  on public.career_cv_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cv profile" on public.career_cv_profiles;
create policy "Users can delete own cv profile"
  on public.career_cv_profiles
  for delete
  using (auth.uid() = user_id);

create or replace function public.set_career_cv_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_career_cv_profiles_updated_at on public.career_cv_profiles;
create trigger trg_career_cv_profiles_updated_at
before update on public.career_cv_profiles
for each row
execute function public.set_career_cv_profiles_updated_at();

commit;
