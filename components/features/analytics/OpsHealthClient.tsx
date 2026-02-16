'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MonitoringHealthSnapshot } from '@/lib/monitoring';

async function fetchMonitoringHealth(audit = false): Promise<MonitoringHealthSnapshot> {
  const response = await fetch(`/api/monitoring/health${audit ? '?audit=1' : ''}`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to load monitoring health');
  }
  return response.json();
}

type IncidentActionPayload = {
  action: 'acknowledge' | 'resolve' | 'dismiss' | 'clear_all';
  fingerprint?: string;
};

export default function OpsHealthClient() {
  const queryClient = useQueryClient();
  const [auditNextFetch, setAuditNextFetch] = useState(true);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['monitoring', 'health'],
    queryFn: async () => {
      const result = await fetchMonitoringHealth(auditNextFetch);
      if (auditNextFetch) {
        setAuditNextFetch(false);
      }
      return result;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });

  const incidentActionMutation = useMutation({
    mutationFn: async (payload: IncidentActionPayload) => {
      const response = await fetch('/api/monitoring/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to apply incident action');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'health'] });
      toast.success('Incident action applied');
    },
    onError: () => {
      toast.error('Failed to apply incident action');
    },
  });

  const handleRefresh = () => {
    setAuditNextFetch(true);
    void refetch();
  };

  const applyIncidentAction = (payload: IncidentActionPayload) => {
    incidentActionMutation.mutate(payload);
  };

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
            onClick={handleRefresh}
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
          <div className="card-surface rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-text-tertiary uppercase tracking-wider">Audit Log Migration</div>
              <div className="text-sm text-text-secondary mt-1">
                {data.auditLogMigrationApplied ? 'admin_audit_logs table detected' : 'admin_audit_logs table missing'}
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                data.auditLogMigrationApplied
                  ? 'bg-success/15 text-success border border-success/30'
                  : 'bg-error/15 text-error border border-error/30'
              }`}
            >
              {data.auditLogMigrationApplied ? 'Applied' : 'Missing'}
            </span>
          </div>

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
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-text-primary">Top Incidents</div>
              {data.topIncidents.length > 0 && (
                <button
                  onClick={() => applyIncidentAction({ action: 'clear_all' })}
                  disabled={incidentActionMutation.isPending}
                  className="text-xs px-2 py-1 rounded border border-border bg-surface hover:bg-surface-hover text-text-secondary disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
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
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            incident.status === 'resolved'
                              ? 'border-success/30 text-success bg-success/10'
                              : incident.status === 'acknowledged'
                                ? 'border-info/30 text-info bg-info/10'
                                : 'border-warning/30 text-warning bg-warning/10'
                          }`}
                        >
                          {incident.status}
                        </span>
                        <span className="text-xs text-text-tertiary">{incident.count}x</span>
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-text-tertiary">
                      {incident.source} • {incident.severity} • last seen {new Date(incident.lastSeenAt).toLocaleTimeString()}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => applyIncidentAction({ action: 'acknowledge', fingerprint: incident.fingerprint })}
                        disabled={incidentActionMutation.isPending || incident.status !== 'open'}
                        className="text-xs px-2 py-1 rounded border border-border bg-surface hover:bg-surface-hover text-text-secondary disabled:opacity-40"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => applyIncidentAction({ action: 'resolve', fingerprint: incident.fingerprint })}
                        disabled={incidentActionMutation.isPending || incident.status === 'resolved'}
                        className="text-xs px-2 py-1 rounded border border-border bg-surface hover:bg-surface-hover text-text-secondary disabled:opacity-40"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => applyIncidentAction({ action: 'dismiss', fingerprint: incident.fingerprint })}
                        disabled={incidentActionMutation.isPending}
                        className="text-xs px-2 py-1 rounded border border-error/30 bg-error/10 hover:bg-error/20 text-error disabled:opacity-40"
                      >
                        Dismiss
                      </button>
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
