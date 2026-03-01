// @ts-nocheck — references unfinished ops monitoring actions; will fix with schema update
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Flame, Server, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MonitoringHealthSnapshot } from '@/lib/monitoring';
import {
  applyMonitoringIncidentAction,
  fetchMonitoringHealthAction,
  fetchOpsReliabilityAction,
  type MonitoringIncidentAction,
} from '@/app/actions/monitoring';

type IncidentActionPayload = {
  action: MonitoringIncidentAction;
  fingerprint?: string;
};

const FLOW_LABELS: Record<string, string> = {
  login: 'Login',
  create_task: 'Create Task',
  toggle_exercise: 'Toggle Exercise',
  today_load: '/today Load',
};

function formatMetric(value: number | null, suffix = ''): string {
  if (value === null) return 'n/a';
  return `${value.toFixed(2)}${suffix}`;
}

export default function OpsHealthClient() {
  const queryClient = useQueryClient();
  const [auditNextFetch, setAuditNextFetch] = useState(true);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['monitoring', 'health'],
    queryFn: async () => {
      const result: MonitoringHealthSnapshot = await fetchMonitoringHealthAction({
        auditView: auditNextFetch,
      });
      if (auditNextFetch) {
        setAuditNextFetch(false);
      }
      return result;
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });

  const incidentActionMutation = useMutation({
    mutationFn: (payload: IncidentActionPayload) => applyMonitoringIncidentAction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'health'] });
      toast.success('Incident action applied');
    },
    onError: () => {
      toast.error('Failed to apply incident action');
    },
  });

  const { data: reliability } = useQuery({
    queryKey: ['monitoring', 'reliability'],
    queryFn: () => fetchOpsReliabilityAction(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
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

          <div className="card-surface rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-text-primary">Flow SLO Snapshot (7d)</div>
                <div className="text-xs text-text-tertiary mt-1">
                  Availability, p95 latency and error-budget burn for blocker flows
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  data.flowSlo?.migrationApplied
                    ? 'bg-success/15 text-success border border-success/30'
                    : 'bg-error/15 text-error border border-error/30'
                }`}
              >
                {data.flowSlo?.migrationApplied ? 'Live' : 'Missing table'}
              </span>
            </div>

            {data.flowSlo?.migrationApplied ? (
              <div className="space-y-2">
                {data.flowSlo.flows.map((flow) => {
                  const availabilityTarget = flow.target.availabilityPct;
                  const p95Target = flow.target.p95Ms;
                  const availabilityOk =
                    flow.availabilityPct !== null && flow.availabilityPct >= availabilityTarget;
                  const p95Ok = flow.p95Ms !== null && flow.p95Ms <= p95Target;
                  const burnRate = flow.errorBudget.burnRate;

                  return (
                    <div key={flow.flow} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium text-text-primary">
                          {FLOW_LABELS[flow.flow] || flow.flow}
                        </div>
                        <div className="text-xs text-text-tertiary">{flow.total} samples</div>
                      </div>
                      <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        <div className={availabilityOk ? 'text-success' : 'text-error'}>
                          Avail: {formatMetric(flow.availabilityPct, '%')} (target {availabilityTarget}%)
                        </div>
                        <div className={p95Ok ? 'text-success' : 'text-warning'}>
                          p95: {flow.p95Ms === null ? 'n/a' : `${flow.p95Ms}ms`} (target {p95Target}ms)
                        </div>
                        <div className={burnRate !== null && burnRate > 1 ? 'text-error' : 'text-text-tertiary'}>
                          Burn: {burnRate === null ? 'n/a' : `${burnRate.toFixed(2)}x`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-text-tertiary">
                `ops_flow_metrics` migration fehlt oder ist noch nicht ausgerollt.
              </div>
            )}
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
            <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Flame className="w-4 h-4 text-warning" />
              Burn Rate Status (Multi-Window)
            </div>
            {reliability ? (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      reliability.burnRateStatus === 'critical'
                        ? 'bg-error/15 text-error border border-error/30'
                        : reliability.burnRateStatus === 'warning'
                          ? 'bg-warning/15 text-warning border border-warning/30'
                          : 'bg-success/15 text-success border border-success/30'
                    }`}
                  >
                    {reliability.burnRateStatus.toUpperCase()}
                  </span>
                  {reliability.criticalFlows.length > 0 && (
                    <span className="text-xs text-error">
                      Critical: {reliability.criticalFlows.join(', ')}
                    </span>
                  )}
                  {reliability.warningFlows.length > 0 && (
                    <span className="text-xs text-warning">
                      Warning: {reliability.warningFlows.join(', ')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {['1h', '6h', '24h'].map((windowLabel) => {
                    const windowEvals = reliability.evaluations.filter((e) => e.window === windowLabel);
                    return (
                      <div key={windowLabel} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
                        <div className="text-xs font-semibold text-text-primary mb-1">{windowLabel} Window</div>
                        {windowEvals.map((e) => {
                          const burnColor =
                            e.severity === 'critical' ? 'text-error' :
                            e.severity === 'warning' ? 'text-warning' : 'text-text-tertiary';
                          return (
                            <div key={e.flow} className="flex items-center justify-between text-[11px] py-0.5">
                              <span className="text-text-secondary">{FLOW_LABELS[e.flow] || e.flow}</span>
                              <span className={burnColor}>
                                {e.burnRate !== null ? `${e.burnRate.toFixed(2)}x` : 'n/a'}
                                {e.severity && ` ● ${e.severity}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-sm text-text-tertiary">Loading burn rate data...</div>
            )}
          </div>

          <div className="card-surface rounded-xl p-4 space-y-3">
            <div className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              Dependency Health (Circuit Breakers)
            </div>
            {reliability && reliability.dependencies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {reliability.dependencies.map((dep) => {
                  const stateColor =
                    dep.state === 'open' ? 'text-error' :
                    dep.state === 'half_open' ? 'text-warning' : 'text-success';
                  const stateBg =
                    dep.state === 'open' ? 'bg-error/15 border-error/30' :
                    dep.state === 'half_open' ? 'bg-warning/15 border-warning/30' : 'bg-success/15 border-success/30';
                  return (
                    <div key={dep.name} className="rounded-lg border border-border bg-surface/60 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">{dep.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${stateBg} ${stateColor}`}>
                          {dep.state.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-text-tertiary">
                        Failures: {dep.failureCount}
                        {dep.lastFailureAt && ` • Last: ${new Date(dep.lastFailureAt).toLocaleTimeString()}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-text-tertiary">
                {reliability ? 'No dependencies tracked yet.' : 'Loading...'}
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
