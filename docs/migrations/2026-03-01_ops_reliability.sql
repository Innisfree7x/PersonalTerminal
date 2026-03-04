-- Phase 12 P0.1: Persistent Incident Store + Cron Health Tracking
-- Run against your Supabase database

-- ═══════════════════════════════════════════════════════════════
-- 1) ops_incidents — Persistent incident store (replaces in-memory Map)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ops_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  message TEXT NOT NULL,
  error_name TEXT NOT NULL DEFAULT 'Error',
  source TEXT NOT NULL CHECK (source IN ('client', 'server', 'api')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  count INTEGER NOT NULL DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_alert_at TIMESTAMPTZ,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on fingerprint for upsert pattern
CREATE UNIQUE INDEX IF NOT EXISTS idx_ops_incidents_fingerprint ON ops_incidents (fingerprint);
CREATE INDEX IF NOT EXISTS idx_ops_incidents_status ON ops_incidents (status);
CREATE INDEX IF NOT EXISTS idx_ops_incidents_severity ON ops_incidents (severity);
CREATE INDEX IF NOT EXISTS idx_ops_incidents_last_seen ON ops_incidents (last_seen_at DESC);

-- Retention: auto-cleanup incidents older than 30 days (run via cron or manual)
-- DELETE FROM ops_incidents WHERE last_seen_at < now() - INTERVAL '30 days' AND status IN ('resolved', 'dismissed');

-- ═══════════════════════════════════════════════════════════════
-- 2) ops_cron_executions — Cron health tracking
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ops_cron_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'timeout')),
  duration_ms INTEGER NOT NULL DEFAULT 0,
  result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_cron_executions_name ON ops_cron_executions (cron_name);
CREATE INDEX IF NOT EXISTS idx_ops_cron_executions_started ON ops_cron_executions (started_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- 3) ops_burn_rate_snapshots — Historical burn-rate evaluations
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ops_burn_rate_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow TEXT NOT NULL,
  window_label TEXT NOT NULL,
  window_hours INTEGER NOT NULL,
  burn_rate NUMERIC(10, 4),
  availability_pct NUMERIC(10, 4),
  p95_ms INTEGER,
  total_samples INTEGER NOT NULL DEFAULT 0,
  budget_remaining_pct NUMERIC(10, 4),
  severity TEXT CHECK (severity IN ('critical', 'warning', NULL)),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ops_burn_rate_flow ON ops_burn_rate_snapshots (flow);
CREATE INDEX IF NOT EXISTS idx_ops_burn_rate_evaluated ON ops_burn_rate_snapshots (evaluated_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE ops_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_cron_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops_burn_rate_snapshots ENABLE ROW LEVEL SECURITY;

-- Service role (cron, admin) can do everything
CREATE POLICY "service_role_ops_incidents" ON ops_incidents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_ops_cron" ON ops_cron_executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_ops_burn_rate" ON ops_burn_rate_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can read (for ops dashboard)
CREATE POLICY "auth_read_ops_incidents" ON ops_incidents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_ops_cron" ON ops_cron_executions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_ops_burn_rate" ON ops_burn_rate_snapshots
  FOR SELECT TO authenticated USING (true);

-- Server-side API routes can insert incidents (using anon key with RLS)
CREATE POLICY "anon_insert_ops_incidents" ON ops_incidents
  FOR INSERT TO anon WITH CHECK (true);
