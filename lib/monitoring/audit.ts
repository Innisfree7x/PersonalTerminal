import { createClient } from '@/lib/auth/server';
import type { Json } from '@/lib/supabase/types';

export interface AdminAuditLogRecord {
  id: string;
  actorUserId: string;
  action: string;
  resource: string;
  metadata: Json;
  createdAt: string;
}

interface CreateAdminAuditLogInput {
  actorUserId: string;
  action: string;
  resource: string;
  metadata?: Json;
}

interface AuditTableStatusCache {
  value: boolean;
  expiresAt: number;
}

let auditTableStatusCache: AuditTableStatusCache | null = null;
const AUDIT_TABLE_STATUS_TTL_MS = 30_000;

function mapAuditRow(row: {
  id: string;
  actor_user_id: string;
  action: string;
  resource: string;
  metadata: Json;
  created_at: string;
}): AdminAuditLogRecord {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    action: row.action,
    resource: row.resource,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export async function createAdminAuditLog(input: CreateAdminAuditLogInput): Promise<void> {
  const tableAvailable = await isAdminAuditLogTableAvailable();
  if (!tableAvailable) return;

  const supabase = createClient();
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    resource: input.resource,
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
  });

  if (error) {
    // Keep feature non-blocking if migration is not yet applied.
    // eslint-disable-next-line no-console
    console.warn('[AuditLog] failed to insert admin audit log:', error.message);
  }
}

export async function fetchRecentAdminAuditLogs(
  limit = 25
): Promise<{ migrationApplied: boolean; logs: AdminAuditLogRecord[] }> {
  const tableAvailable = await isAdminAuditLogTableAvailable();
  if (!tableAvailable) {
    return { migrationApplied: false, logs: [] };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('id, actor_user_id, action, resource, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    // Keep endpoint stable even before migration is applied.
    return { migrationApplied: false, logs: [] };
  }

  return {
    migrationApplied: true,
    logs: data.map(mapAuditRow),
  };
}

export async function isAdminAuditLogTableAvailable(): Promise<boolean> {
  const now = Date.now();
  if (auditTableStatusCache && auditTableStatusCache.expiresAt > now) {
    return auditTableStatusCache.value;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('admin_audit_logs')
    .select('id')
    .limit(1);

  const available = !error;
  auditTableStatusCache = {
    value: available,
    expiresAt: now + AUDIT_TABLE_STATUS_TTL_MS,
  };

  return available;
}
