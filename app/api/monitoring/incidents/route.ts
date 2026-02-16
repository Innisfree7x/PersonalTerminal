import { NextRequest, NextResponse } from 'next/server';
import { requireApiAdmin } from '@/lib/api/auth';
import {
  acknowledgeMonitoringIncident,
  clearMonitoringIncidents,
  dismissMonitoringIncident,
  resolveMonitoringIncident,
} from '@/lib/monitoring';
import { createAdminAuditLog } from '@/lib/monitoring/audit';

type IncidentAction = 'acknowledge' | 'resolve' | 'dismiss' | 'clear_all';

function isValidAction(value: unknown): value is IncidentAction {
  return (
    value === 'acknowledge' ||
    value === 'resolve' ||
    value === 'dismiss' ||
    value === 'clear_all'
  );
}

export async function POST(request: NextRequest) {
  const { user, errorResponse } = await requireApiAdmin();
  if (errorResponse) return errorResponse;

  const payload = (await request.json().catch(() => ({}))) as {
    action?: IncidentAction;
    fingerprint?: string;
  };

  if (!isValidAction(payload.action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const fingerprint = payload.fingerprint?.trim();
  let ok = false;
  let affected = 0;

  if (payload.action === 'clear_all') {
    affected = clearMonitoringIncidents();
    ok = true;
  } else {
    if (!fingerprint) {
      return NextResponse.json({ error: 'Missing fingerprint' }, { status: 400 });
    }
    if (payload.action === 'acknowledge') {
      ok = acknowledgeMonitoringIncident(fingerprint);
    } else if (payload.action === 'resolve') {
      ok = resolveMonitoringIncident(fingerprint);
    } else if (payload.action === 'dismiss') {
      ok = dismissMonitoringIncident(fingerprint);
    }
    affected = ok ? 1 : 0;
  }

  if (!ok) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  const actionName = `monitoring.incident.${payload.action}`;
  await createAdminAuditLog({
    actorUserId: user.id,
    action: actionName,
    resource: 'monitoring/incidents',
    metadata: {
      userEmail: user.email || null,
      action: payload.action,
      affected,
      ...(fingerprint ? { fingerprint } : {}),
    },
  });

  return NextResponse.json({ ok: true, affected });
}
