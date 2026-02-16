'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { MonitoringHealthSnapshot } from '@/lib/monitoring';

async function fetchMonitoringHealth(): Promise<MonitoringHealthSnapshot> {
  const response = await fetch('/api/monitoring/health', {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load monitoring health');
  }
  return response.json();
}

export default function OpsHealthClient() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['monitoring', 'health'],
    queryFn: fetchMonitoringHealth,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Ops Health
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Runtime monitoring stream with deduped incidents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link href="/analytics" className="px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error">
          Failed to load monitoring health.
        </div>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-text-tertiary">Incidents</div>
              <div className="text-2xl font-bold text-text-primary">{data.totals.incidents}</div>
            </div>
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-text-tertiary">Events</div>
              <div className="text-2xl font-bold text-text-primary">{data.totals.events}</div>
            </div>
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-text-tertiary">Critical</div>
              <div className="text-2xl font-bold text-error">{data.totals.bySeverity.critical}</div>
            </div>
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-text-tertiary">Errors</div>
              <div className="text-2xl font-bold text-warning">{data.totals.bySeverity.error}</div>
            </div>
            <div className="card-surface rounded-xl p-4">
              <div className="text-xs text-text-tertiary">Warnings</div>
              <div className="text-2xl font-bold text-info">{data.totals.bySeverity.warning}</div>
            </div>
          </div>

          <div className="card-surface rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-text-primary">Top Incidents</div>
            {data.topIncidents.length === 0 ? (
              <div className="text-sm text-text-tertiary">No incidents captured yet.</div>
            ) : (
              <div className="space-y-2">
                {data.topIncidents.map((incident, index) => (
                  <motion.div
                    key={incident.fingerprint}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="rounded-lg border border-border bg-surface/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                        <span className="text-sm font-medium text-text-primary truncate">{incident.message}</span>
                      </div>
                      <span className="text-xs text-text-tertiary shrink-0">{incident.count}x</span>
                    </div>
                    <div className="mt-1 text-[11px] text-text-tertiary">
                      {incident.source} • {incident.severity} • last seen {new Date(incident.lastSeenAt).toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="card-surface rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-text-primary">Recent Admin Actions</div>
            {(data.recentAdminAuditLogs || []).length === 0 ? (
              <div className="text-sm text-text-tertiary">No audit entries yet.</div>
            ) : (
              <div className="space-y-2">
                {(data.recentAdminAuditLogs || []).slice(0, 12).map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-text-primary">{entry.action}</span>
                      <span className="text-xs text-text-tertiary">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-1">
                      {entry.resource} • actor {entry.actorUserId.slice(0, 8)}…
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
