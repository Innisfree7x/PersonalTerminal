import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { isMonitoringIngressAllowed } from '@/lib/monitoring';
import { recordFlowMetric, type RecordFlowMetricInput } from '@/lib/ops/flowMetrics';

const loginFlowMetricSchema = z.object({
  flow: z.literal('login'),
  status: z.enum(['success', 'failure']),
  durationMs: z.number().int().min(0).max(120000),
  route: z.string().trim().max(120).optional(),
  requestId: z.string().trim().max(120).optional(),
  errorCode: z.string().trim().max(80).optional(),
});

function firstForwardedIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded) return 'unknown';
  const first = forwarded.split(',')[0];
  return first?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const payload = loginFlowMetricSchema.parse(await request.json());
    const ingressKey = `ops-flow-login:${firstForwardedIp(request)}`;
    if (!isMonitoringIngressAllowed(ingressKey)) {
      return NextResponse.json({ ok: true, throttled: true }, { status: 202 });
    }

    const user = await getCurrentUser();
    const metricInput: RecordFlowMetricInput = {
      flow: payload.flow,
      status: payload.status,
      durationMs: payload.durationMs,
      userId: user?.id ?? null,
      route: payload.route ?? '/auth/login',
      context: { source: 'client_login' },
    };

    if (payload.requestId) {
      metricInput.requestId = payload.requestId;
    }
    if (payload.errorCode) {
      metricInput.errorCode = payload.errorCode;
    }

    await recordFlowMetric(metricInput);

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
