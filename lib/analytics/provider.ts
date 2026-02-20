import type { AnalyticsEventInput } from './events';

type JsonScalar = string | number | boolean | null;

export interface AnalyticsDispatchContext {
  userId?: string | null;
}

export interface AnalyticsProviderResult {
  provider: 'vercel' | 'posthog';
  status: 'sent' | 'skipped' | 'failed';
  error?: string;
}

type FlatPayload = Record<string, JsonScalar>;

function toFlatPayload(payload: Record<string, unknown>): FlatPayload {
  const result: FlatPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      result[key] = value;
    }
  }
  return result;
}

async function sendToVercel(
  event: AnalyticsEventInput,
  context?: AnalyticsDispatchContext
): Promise<AnalyticsProviderResult> {
  try {
    const { track } = await import('@vercel/analytics/server');
    const payload = toFlatPayload(event.payload ?? {});
    if (context?.userId) {
      payload.user_id = context.userId;
    }
    await track(event.name, payload);
    return { provider: 'vercel', status: 'sent' };
  } catch (error) {
    return {
      provider: 'vercel',
      status: 'failed',
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

async function sendToPostHog(
  event: AnalyticsEventInput,
  context?: AnalyticsDispatchContext
): Promise<AnalyticsProviderResult> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey || !host) {
    return { provider: 'posthog', status: 'skipped' };
  }

  try {
    const payload = toFlatPayload(event.payload ?? {});
    const response = await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: event.name,
        distinct_id: context?.userId ?? 'anonymous',
        properties: payload,
      }),
    });

    if (!response.ok) {
      return {
        provider: 'posthog',
        status: 'failed',
        error: `http_${response.status}`,
      };
    }

    return { provider: 'posthog', status: 'sent' };
  } catch (error) {
    return {
      provider: 'posthog',
      status: 'failed',
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

export async function dispatchAnalyticsEvent(
  event: AnalyticsEventInput,
  context?: AnalyticsDispatchContext
): Promise<AnalyticsProviderResult[]> {
  const [vercelResult, posthogResult] = await Promise.all([
    sendToVercel(event, context),
    sendToPostHog(event, context),
  ]);
  return [vercelResult, posthogResult];
}

