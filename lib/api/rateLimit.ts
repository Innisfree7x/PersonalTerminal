interface RateLimitState {
  [windowKey: string]: number[];
}

const rateLimitStore = new Map<string, RateLimitState>();

function now(): number {
  return Date.now();
}

function isRateLimitBypassed(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITS === 'true';
}

function pruneWindow(timestamps: number[], windowMs: number, at: number): number[] {
  return timestamps.filter((value) => at - value < windowMs);
}

export function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  if (isRateLimitBypassed()) {
    return {
      allowed: true,
      remaining: Math.max(0, input.limit),
      retryAfterSeconds: 0,
    };
  }

  const at = now();
  const windowKey = `${input.limit}:${input.windowMs}`;
  const state = rateLimitStore.get(input.key) ?? {};
  const existing = state[windowKey] ?? [];
  const kept = pruneWindow(existing, input.windowMs, at);

  if (kept.length >= input.limit) {
    const oldest = kept[0] ?? at;
    const retryAfterMs = Math.max(0, input.windowMs - (at - oldest));
    state[windowKey] = kept;
    rateLimitStore.set(input.key, state);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  kept.push(at);
  state[windowKey] = kept;
  rateLimitStore.set(input.key, state);
  return {
    allowed: true,
    remaining: Math.max(0, input.limit - kept.length),
    retryAfterSeconds: 0,
  };
}

export function firstForwardedIp(raw: string | null): string {
  if (!raw) return 'unknown';
  const first = raw.split(',')[0];
  return first?.trim() || 'unknown';
}

export function readForwardedIpFromRequest(request: { headers?: { get?: (key: string) => string | null } }): string {
  const raw =
    typeof request.headers?.get === 'function'
      ? request.headers.get('x-forwarded-for')
      : null;
  return firstForwardedIp(raw);
}

export function applyRateLimitHeaders(
  response: Response,
  input: { remaining: number; retryAfterSeconds: number }
): Response {
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, input.remaining)));
  if (input.retryAfterSeconds > 0) {
    response.headers.set('Retry-After', String(input.retryAfterSeconds));
  }
  return response;
}
