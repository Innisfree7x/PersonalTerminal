import { describe, expect, test } from 'vitest';
import { alertCooldownMs, buildMonitoringFingerprint, inferSeverity } from '@/lib/monitoring/rules';

describe('monitoring-rules', () => {
  test('infers critical severity from crash-like payloads', () => {
    const severity = inferSeverity({
      message: 'Fatal crash in dashboard runtime',
      source: 'client',
    });
    expect(severity).toBe('critical');
  });

  test('infers warning severity for API auth/validation style errors', () => {
    const severity = inferSeverity({
      message: 'Validation failed for request',
      source: 'api',
    });
    expect(severity).toBe('warning');
  });

  test('fingerprint is stable for similar messages with different numbers', () => {
    const a = buildMonitoringFingerprint({
      message: 'Timeout after 1234ms on request',
      source: 'api',
      errorName: 'FetchError',
    });
    const b = buildMonitoringFingerprint({
      message: 'Timeout after 5678ms on request',
      source: 'api',
      errorName: 'FetchError',
    });
    expect(a).toBe(b);
  });

  test('cooldown scales by severity', () => {
    expect(alertCooldownMs('critical')).toBeLessThan(alertCooldownMs('error'));
    expect(alertCooldownMs('error')).toBeLessThan(alertCooldownMs('warning'));
  });
});
