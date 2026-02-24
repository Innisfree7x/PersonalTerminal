import { NextResponse } from 'next/server';

export interface ApiTraceContext {
  requestId: string;
  startedAt: number;
  route: string;
  method: string;
}

function sanitizeMetricName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'api';
}

function toDurationMs(startedAt: number): number {
  const raw = Date.now() - startedAt;
  if (!Number.isFinite(raw) || raw < 0) return 0;
  return Math.round(raw);
}

export function createApiTraceContext(request: Request, route: string): ApiTraceContext {
  const forwardedRequestId = request.headers.get('x-request-id')?.trim();
  return {
    requestId: forwardedRequestId || crypto.randomUUID(),
    startedAt: Date.now(),
    route,
    method: request.method,
  };
}

export function withApiTraceHeaders(
  response: NextResponse,
  trace: ApiTraceContext,
  options?: { metricName?: string }
): NextResponse {
  const metricName = sanitizeMetricName(options?.metricName ?? trace.route);
  const serverTimingMetric = `${metricName};dur=${toDurationMs(trace.startedAt)}`;
  const existingServerTiming = response.headers.get('Server-Timing');
  response.headers.set(
    'Server-Timing',
    existingServerTiming ? `${existingServerTiming}, ${serverTimingMetric}` : serverTimingMetric
  );
  response.headers.set('X-Request-Id', trace.requestId);
  response.headers.set('X-Observed-Route', trace.route);
  response.headers.set('X-Observed-Method', trace.method);
  return response;
}
