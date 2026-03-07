import { describe, expect, it } from 'vitest';
import { buildSentryEnvelope, parseSentryDsn } from '@/lib/monitoring/sentry';

describe('monitoring sentry transport', () => {
  it('parses valid DSN', () => {
    const parsed = parseSentryDsn('https://publicKey@example.ingest.sentry.io/123456');
    expect(parsed).toEqual({
      origin: 'https://example.ingest.sentry.io',
      pathPrefix: '',
      projectId: '123456',
      publicKey: 'publicKey',
    });
  });

  it('parses DSN with path prefix', () => {
    const parsed = parseSentryDsn('https://publicKey@example.ingest.sentry.io/sentry/project/123456');
    expect(parsed).toEqual({
      origin: 'https://example.ingest.sentry.io',
      pathPrefix: '/sentry/project',
      projectId: '123456',
      publicKey: 'publicKey',
    });
  });

  it('returns null for invalid DSN', () => {
    expect(parseSentryDsn('not-a-dsn')).toBeNull();
  });

  it('builds a valid envelope payload', () => {
    const envelope = buildSentryEnvelope(
      {
        message: 'test error',
        severity: 'error',
        errorName: 'TestError',
        stack: 'line1\nline2',
        context: { route: '/today' },
        source: 'server',
      },
      'https://publicKey@example.ingest.sentry.io/123456'
    );

    expect(envelope).toBeTruthy();
    const parts = envelope!.split('\n');
    expect(parts.length).toBe(3);
    expect(parts[0]).toContain('"dsn":"https://publicKey@example.ingest.sentry.io/123456"');
    expect(parts[2]).toContain('"message":"test error"');
  });
});
