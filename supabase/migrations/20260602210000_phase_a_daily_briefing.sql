-- Phase A — Daily Briefing: commitments + daily_checkins
-- Kern-Loop: morgens Commitments festlegen, abends ehrlich abrechnen.

begin;

create table if not exists public.commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  title text not null,
  status text not null default 'pending'
    check (status in ('pending','done','missed')),
  missed_reason text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists commitments_user_date_idx
  on public.commitments (user_id, date);

alter table public.commitments enable row level security;

drop policy if exists commitments_owner_all on public.commitments;
create policy commitments_owner_all on public.commitments
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('morning','evening')),
  energy smallint check (energy between 1 and 3),
  journal_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, type)
);

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, date);

alter table public.daily_checkins enable row level security;

drop policy if exists daily_checkins_owner_all on public.daily_checkins;
create policy daily_checkins_owner_all on public.daily_checkins
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_daily_checkins_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_daily_checkins_updated_at on public.daily_checkins;
create trigger trg_daily_checkins_updated_at
before update on public.daily_checkins
for each row execute function public.set_daily_checkins_updated_at();

commit;
