-- Calendar Entries: unified table for user-authored events.
-- Joins with kit_campus_events at the query layer for a combined calendar view.
-- Date: 2026-04-21

begin;

create table if not exists public.calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  kind text not null default 'custom'
    check (kind in ('lecture','exercise','tutorial','exam','interview','meeting','deadline','personal','custom')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_entries_time_order check (ends_at >= starts_at)
);

create index if not exists idx_calendar_entries_user_starts
  on public.calendar_entries (user_id, starts_at asc);

alter table public.calendar_entries enable row level security;

drop policy if exists calendar_entries_select_own on public.calendar_entries;
create policy calendar_entries_select_own on public.calendar_entries
  for select using (auth.uid() = user_id);

drop policy if exists calendar_entries_insert_own on public.calendar_entries;
create policy calendar_entries_insert_own on public.calendar_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists calendar_entries_update_own on public.calendar_entries;
create policy calendar_entries_update_own on public.calendar_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists calendar_entries_delete_own on public.calendar_entries;
create policy calendar_entries_delete_own on public.calendar_entries
  for delete using (auth.uid() = user_id);

create or replace function public.set_calendar_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_calendar_entries_updated_at on public.calendar_entries;
create trigger trg_calendar_entries_updated_at
before update on public.calendar_entries
for each row execute function public.set_calendar_entries_updated_at();

commit;
