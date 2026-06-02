-- Phase A2 — Station check-in: flexible responses payload on daily_checkins.
-- Holds per-station answers (study, finance/gambling, body, focus) as JSON so
-- stations can evolve without a migration per question. Feeds the risk traffic
-- light later (Phase B). Date: 2026-06-02

alter table public.daily_checkins
  add column if not exists responses jsonb not null default '{}'::jsonb;
