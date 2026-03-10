-- Phase 27: Strategy Lab V1
-- Date: 2026-03-10

begin;

create table if not exists public.strategy_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  context text,
  target_date date,
  status text not null default 'draft' check (status in ('draft', 'committed', 'archived')),
  last_score_total integer check (last_score_total between 0 and 100),
  last_scored_at timestamptz,
  last_winner_option_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategy_options (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  decision_id uuid not null references public.strategy_decisions(id) on delete cascade,
  title text not null,
  summary text,
  impact_potential integer not null default 5 check (impact_potential between 1 and 10),
  confidence_level integer not null default 5 check (confidence_level between 1 and 10),
  strategic_fit integer not null default 5 check (strategic_fit between 1 and 10),
  effort_cost integer not null default 5 check (effort_cost between 1 and 10),
  downside_risk integer not null default 5 check (downside_risk between 1 and 10),
  time_to_value_weeks integer not null default 4 check (time_to_value_weeks between 1 and 104),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.strategy_decision_commits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  decision_id uuid not null references public.strategy_decisions(id) on delete cascade,
  option_id uuid not null references public.strategy_options(id) on delete cascade,
  task_source_key text not null,
  note text,
  snooze_until date,
  created_at timestamptz not null default now()
);

create index if not exists idx_strategy_decisions_user_updated
  on public.strategy_decisions(user_id, updated_at desc);

create index if not exists idx_strategy_options_user_decision
  on public.strategy_options(user_id, decision_id, created_at);

create index if not exists idx_strategy_commits_user_decision
  on public.strategy_decision_commits(user_id, decision_id, created_at desc);

alter table public.strategy_decisions enable row level security;
alter table public.strategy_options enable row level security;
alter table public.strategy_decision_commits enable row level security;

alter table public.strategy_decisions force row level security;
alter table public.strategy_options force row level security;
alter table public.strategy_decision_commits force row level security;

drop policy if exists "Users can view own strategy decisions" on public.strategy_decisions;
drop policy if exists "Users can insert own strategy decisions" on public.strategy_decisions;
drop policy if exists "Users can update own strategy decisions" on public.strategy_decisions;
drop policy if exists "Users can delete own strategy decisions" on public.strategy_decisions;

create policy "Users can view own strategy decisions"
  on public.strategy_decisions for select using (auth.uid() = user_id);
create policy "Users can insert own strategy decisions"
  on public.strategy_decisions for insert with check (auth.uid() = user_id);
create policy "Users can update own strategy decisions"
  on public.strategy_decisions for update using (auth.uid() = user_id);
create policy "Users can delete own strategy decisions"
  on public.strategy_decisions for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own strategy options" on public.strategy_options;
drop policy if exists "Users can insert own strategy options" on public.strategy_options;
drop policy if exists "Users can update own strategy options" on public.strategy_options;
drop policy if exists "Users can delete own strategy options" on public.strategy_options;

create policy "Users can view own strategy options"
  on public.strategy_options for select using (auth.uid() = user_id);
create policy "Users can insert own strategy options"
  on public.strategy_options for insert with check (auth.uid() = user_id);
create policy "Users can update own strategy options"
  on public.strategy_options for update using (auth.uid() = user_id);
create policy "Users can delete own strategy options"
  on public.strategy_options for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own strategy commits" on public.strategy_decision_commits;
drop policy if exists "Users can insert own strategy commits" on public.strategy_decision_commits;
drop policy if exists "Users can update own strategy commits" on public.strategy_decision_commits;
drop policy if exists "Users can delete own strategy commits" on public.strategy_decision_commits;

create policy "Users can view own strategy commits"
  on public.strategy_decision_commits for select using (auth.uid() = user_id);
create policy "Users can insert own strategy commits"
  on public.strategy_decision_commits for insert with check (auth.uid() = user_id);
create policy "Users can update own strategy commits"
  on public.strategy_decision_commits for update using (auth.uid() = user_id);
create policy "Users can delete own strategy commits"
  on public.strategy_decision_commits for delete using (auth.uid() = user_id);

commit;
