import { NextRequest, NextResponse } from 'next/server';
import { captureServerError, isMonitoringEnabled, type MonitoringPayload } from '@/lib/monitoring';

export async function POST(request: NextRequest) {
  if (!isMonitoringEnabled()) {
    return NextResponse.json({ ok: true });
  }

  try {
    const body = (await request.json()) as MonitoringPayload;
    const message = body?.message || 'Client-side error';
    await captureServerError(new Error(message), {
      message,
      severity: body?.severity ?? 'error',
      source: body?.source ?? 'client',
      ...(body?.context ? { context: body.context } : {}),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    await captureServerError(error, {
      message: 'Monitoring API failed to process payload',
      severity: 'warning',
      source: 'api',
    });
    return NextResponse.json({ ok: true });
  }
}
