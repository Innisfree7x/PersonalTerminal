import { beforeEach, describe, expect, it } from 'vitest';
import {
  acknowledgeIncident,
  clearAllIncidents,
  dismissIncident,
  resolveIncident,
  upsertIncident,
} from '@/lib/monitoring/store';

describe('monitoring store incident actions', () => {
  beforeEach(() => {
    clearAllIncidents();
  });

  it('acknowledges and resolves incidents', () => {
    const fingerprint = `fp-${Date.now()}`;
    upsertIncident({
      fingerprint,
      message: 'Test incident',
      errorName: 'Error',
      source: 'server',
      severity: 'error',
    });

    expect(acknowledgeIncident(fingerprint)).toBe(true);
    expect(resolveIncident(fingerprint)).toBe(true);
  });

  it('re-opens resolved incidents when a new event arrives', () => {
    const fingerprint = `fp-reopen-${Date.now()}`;
    upsertIncident({
      fingerprint,
      message: 'Test incident',
      errorName: 'Error',
      source: 'api',
      severity: 'warning',
    });
    expect(resolveIncident(fingerprint)).toBe(true);

    const result = upsertIncident({
      fingerprint,
      message: 'Test incident again',
      errorName: 'Error',
      source: 'api',
      severity: 'warning',
    });

    expect(result.incident.status).toBe('open');
  });

  it('dismisses and clears incidents', () => {
    const fingerprint = `fp-dismiss-${Date.now()}`;
    upsertIncident({
      fingerprint,
      message: 'Dismiss me',
      errorName: 'Error',
      source: 'client',
      severity: 'info',
    });

    expect(dismissIncident(fingerprint)).toBe(true);
    expect(dismissIncident(fingerprint)).toBe(false);

    upsertIncident({
      fingerprint: `${fingerprint}-2`,
      message: 'Another incident',
      errorName: 'Error',
      source: 'client',
      severity: 'info',
    });
    expect(clearAllIncidents()).toBe(1);
  });
});
