-- Phase 31 - Career LLM usage budget tracking
-- Date: 2026-03-15

begin;

create table if not exists public.llm_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null check (char_length(route) > 0 and char_length(route) <= 180),
  model text not null check (char_length(model) > 0 and char_length(model) <= 120),
  units integer not null check (units > 0 and units <= 5000),
  usage_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_llm_usage_logs_user_date_route
  on public.llm_usage_logs(user_id, usage_date, route);

alter table public.llm_usage_logs enable row level security;
alter table public.llm_usage_logs force row level security;

drop policy if exists "Users can read own llm usage logs" on public.llm_usage_logs;
create policy "Users can read own llm usage logs"
  on public.llm_usage_logs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own llm usage logs" on public.llm_usage_logs;
create policy "Users can insert own llm usage logs"
  on public.llm_usage_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own llm usage logs" on public.llm_usage_logs;
create policy "Users can update own llm usage logs"
  on public.llm_usage_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own llm usage logs" on public.llm_usage_logs;
create policy "Users can delete own llm usage logs"
  on public.llm_usage_logs
  for delete
  using (auth.uid() = user_id);

commit;
