/**
 * Dependency Degradation Mode — Phase 12 P0.1
 *
 * Detects slow or unavailable dependencies and activates degradation mode.
 * In degraded mode, non-critical features fail fast instead of timing out.
 *
 * Strategy:
 * - Track dependency health via circuit breaker pattern
 * - 3 states: CLOSED (normal), OPEN (degraded), HALF_OPEN (probing)
 * - Configurable per dependency
 */

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface DependencyConfig {
  name: string;
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** ms to wait before attempting half-open probe */
  resetTimeoutMs: number;
  /** Max acceptable latency (ms) — exceeding counts as failure */
  latencyThresholdMs: number;
}

interface CircuitBreaker {
  config: DependencyConfig;
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number;
  lastSuccessAt: number;
  consecutiveSuccesses: number;
}

const DEFAULT_DEPS: DependencyConfig[] = [
  {
    name: 'supabase',
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    latencyThresholdMs: 5_000,
  },
  {
    name: 'google_calendar',
    failureThreshold: 3,
    resetTimeoutMs: 60_000,
    latencyThresholdMs: 8_000,
  },
  {
    name: 'resend_email',
    failureThreshold: 3,
    resetTimeoutMs: 60_000,
    latencyThresholdMs: 10_000,
  },
];

// ── In-memory circuit breaker store ──────────────────────────────────────
const circuits = new Map<string, CircuitBreaker>();

function getOrCreateCircuit(name: string): CircuitBreaker {
  const existing = circuits.get(name);
  if (existing) return existing;

  const config = DEFAULT_DEPS.find((d) => d.name === name) ?? {
    name,
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    latencyThresholdMs: 5_000,
  };

  const circuit: CircuitBreaker = {
    config,
    state: 'closed',
    failureCount: 0,
    lastFailureAt: 0,
    lastSuccessAt: Date.now(),
    consecutiveSuccesses: 0,
  };
  circuits.set(name, circuit);
  return circuit;
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Check if a dependency is currently in degraded mode.
 * Returns true if the circuit is OPEN (degraded).
 */
export function isDegraded(depName: string): boolean {
  const circuit = getOrCreateCircuit(depName);

  if (circuit.state === 'closed') return false;

  if (circuit.state === 'open') {
    // Check if reset timeout has passed → move to half_open
    const elapsed = Date.now() - circuit.lastFailureAt;
    if (elapsed >= circuit.config.resetTimeoutMs) {
      circuit.state = 'half_open';
      return false; // Allow one probe request
    }
    return true; // Still degraded
  }

  // half_open: allow requests through for probing
  return false;
}

/**
 * Record a successful dependency call.
 */
export function recordDependencySuccess(depName: string): void {
  const circuit = getOrCreateCircuit(depName);

  if (circuit.state === 'half_open') {
    circuit.consecutiveSuccesses += 1;
    // Require 2 consecutive successes to close
    if (circuit.consecutiveSuccesses >= 2) {
      circuit.state = 'closed';
      circuit.failureCount = 0;
      circuit.consecutiveSuccesses = 0;
    }
  } else {
    circuit.failureCount = Math.max(0, circuit.failureCount - 1);
    circuit.consecutiveSuccesses = 0;
  }

  circuit.lastSuccessAt = Date.now();
}

/**
 * Record a failed dependency call or timeout.
 */
export function recordDependencyFailure(depName: string): void {
  const circuit = getOrCreateCircuit(depName);
  circuit.failureCount += 1;
  circuit.lastFailureAt = Date.now();
  circuit.consecutiveSuccesses = 0;

  if (circuit.state === 'half_open') {
    // Probe failed, go back to open
    circuit.state = 'open';
    return;
  }

  if (circuit.failureCount >= circuit.config.failureThreshold) {
    circuit.state = 'open';
  }
}

/**
 * Record a dependency call with latency tracking.
 * If latency exceeds threshold, counts as failure.
 */
export function recordDependencyCall(depName: string, durationMs: number, success: boolean): void {
  const circuit = getOrCreateCircuit(depName);

  if (!success || durationMs > circuit.config.latencyThresholdMs) {
    recordDependencyFailure(depName);
  } else {
    recordDependencySuccess(depName);
  }
}

/**
 * Get current state of all tracked dependencies.
 */
export function getDependencyHealthStatus(): Array<{
  name: string;
  state: CircuitState;
  failureCount: number;
  lastFailureAt: string | null;
  lastSuccessAt: string | null;
}> {
  return Array.from(circuits.values()).map((c) => ({
    name: c.config.name,
    state: c.state,
    failureCount: c.failureCount,
    lastFailureAt: c.lastFailureAt > 0 ? new Date(c.lastFailureAt).toISOString() : null,
    lastSuccessAt: c.lastSuccessAt > 0 ? new Date(c.lastSuccessAt).toISOString() : null,
  }));
}

/**
 * Helper: wrap a dependency call with automatic circuit breaker tracking.
 * Throws original error if circuit is closed/half_open and call fails.
 * Throws DegradedError if circuit is open (fast fail).
 */
export class DegradedError extends Error {
  constructor(depName: string) {
    super(`Dependency "${depName}" is in degraded mode. Failing fast.`);
    this.name = 'DegradedError';
  }
}

export async function withDegradationGuard<T>(
  depName: string,
  fn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  if (isDegraded(depName)) {
    if (fallback !== undefined) return fallback;
    throw new DegradedError(depName);
  }

  const start = Date.now();
  try {
    const result = await fn();
    recordDependencyCall(depName, Date.now() - start, true);
    return result;
  } catch (err) {
    recordDependencyCall(depName, Date.now() - start, false);
    throw err;
  }
}
