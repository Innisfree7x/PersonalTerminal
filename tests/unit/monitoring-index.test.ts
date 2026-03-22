import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/monitoring/store', () => ({
  upsertIncident: vi.fn(),
  markIncidentAlerted: vi.fn(),
  getMonitoringHealthSnapshot: vi.fn(() => ({ ok: true })),
  allowIngress: vi.fn(() => true),
  acknowledgeIncident: vi.fn(() => true),
  resolveIncident: vi.fn(() => true),
  dismissIncident: vi.fn(() => true),
  clearAllIncidents: vi.fn(() => 0),
}));

vi.mock('@/lib/monitoring/rules', () => ({
  buildMonitoringFingerprint: vi.fn(() => 'fp-test'),
  inferSeverity: vi.fn((payload) => payload.severity ?? 'error'),
}));

vi.mock('@/lib/monitoring/sentry', () => ({
  captureWithSentry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/monitoring/persistence', () => ({
  persistMonitoringEvent: vi.fn().mockResolvedValue(undefined),
}));

import {
  captureClientError,
  captureServerError,
  getMonitoringHealth,
  isMonitoringIngressAllowed,
} from '@/lib/monitoring';
import { acknowledgeIncident, allowIngress, markIncidentAlerted, upsertIncident } from '@/lib/monitoring/store';
import { buildMonitoringFingerprint, inferSeverity } from '@/lib/monitoring/rules';
import { captureWithSentry } from '@/lib/monitoring/sentry';
import { persistMonitoringEvent } from '@/lib/monitoring/persistence';

const mockedUpsertIncident = vi.mocked(upsertIncident);
const mockedMarkIncidentAlerted = vi.mocked(markIncidentAlerted);
const mockedAllowIngress = vi.mocked(allowIngress);
const mockedCaptureWithSentry = vi.mocked(captureWithSentry);
const mockedPersistMonitoringEvent = vi.mocked(persistMonitoringEvent);
const mockedInferSeverity = vi.mocked(inferSeverity);
const mockedBuildMonitoringFingerprint = vi.mocked(buildMonitoringFingerprint);

describe('monitoring index', () => {
  const originalFetch = global.fetch;
  const originalWebhook = process.env.MONITORING_ALERT_WEBHOOK_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedBuildMonitoringFingerprint.mockReturnValue('fp-test');
    mockedInferSeverity.mockImplementation((payload) => payload.severity ?? 'error');
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    process.env.MONITORING_ALERT_WEBHOOK_URL = originalWebhook;
    global.fetch = originalFetch;
  });

  it('persists low-severity incidents without external alerting', async () => {
    mockedUpsertIncident.mockReturnValue({
      incident: {} as any,
      shouldAlert: false,
    });

    await captureServerError(new Error('slow dashboard query'), {
      severity: 'warning',
      source: 'api',
      context: { route: '/today' },
    });

    expect(mockedUpsertIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        fingerprint: 'fp-test',
        severity: 'warning',
        source: 'api',
      })
    );
    expect(mockedCaptureWithSentry).toHaveBeenCalledOnce();
    expect(mockedPersistMonitoringEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'slow dashboard query',
        severity: 'warning',
      }),
      { fingerprint: 'fp-test' }
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockedMarkIncidentAlerted).not.toHaveBeenCalled();
  });

  it('alerts on error incidents and marks them as alerted', async () => {
    process.env.MONITORING_ALERT_WEBHOOK_URL = 'https://hooks.example.test/monitoring';
    mockedUpsertIncident.mockReturnValue({
      incident: {} as any,
      shouldAlert: true,
    });

    await captureServerError(new Error('database exploded'), {
      source: 'server',
      context: { route: '/career' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.example.test/monitoring',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(mockedCaptureWithSentry).toHaveBeenCalledOnce();
    expect(mockedPersistMonitoringEvent).toHaveBeenCalledOnce();
    expect(mockedMarkIncidentAlerted).toHaveBeenCalledWith('fp-test');
  });

  it('uses sendBeacon for client errors when available', () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(global.navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    });

    captureClientError({
      message: 'ui exploded',
      source: 'client',
      severity: 'error',
    });

    expect(sendBeacon).toHaveBeenCalledWith('/api/monitoring/error', expect.any(Blob));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('falls back to fetch when sendBeacon is unavailable', async () => {
    Object.defineProperty(global.navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });

    captureClientError({
      message: 'ui exploded',
      source: 'client',
      severity: 'error',
    });

    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/monitoring/error',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      })
    );
  });

  it('passes through health and ingress helpers', () => {
    expect(getMonitoringHealth()).toEqual({ ok: true });
    expect(isMonitoringIngressAllowed('ip:1')).toBe(true);
    expect(mockedAllowIngress).toHaveBeenCalledWith('ip:1');
    expect(acknowledgeIncident).toBeDefined();
  });
});
