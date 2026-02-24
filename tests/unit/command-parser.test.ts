import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCommand } from '@/lib/command/parser';

describe('command parser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-24T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for normal search text', () => {
    expect(parseCommand('analysis exam prep')).toBeNull();
  });

  it('parses create-task with deadline', () => {
    const result = parseCommand('erstelle task "VWL Blatt 3" deadline morgen');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(true);
    if (!result || !result.ok) return;
    expect(result.intent.kind).toBe('create-task');
    if (result.intent.kind !== 'create-task') return;
    expect(result.intent.title).toBe('VWL Blatt 3');
    expect(result.intent.deadline).toBe('2026-02-25');
  });

  it('parses focus intent with duration', () => {
    const result = parseCommand('fokus 25');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(true);
    if (!result || !result.ok) return;
    expect(result.intent.kind).toBe('plan-focus');
    if (result.intent.kind !== 'plan-focus') return;
    expect(result.intent.durationMin).toBe(25);
  });

  it('parses create-goal intent', () => {
    const result = parseCommand('erstelle goal "Fitness"');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(true);
    if (!result || !result.ok) return;
    expect(result.intent.kind).toBe('create-goal');
    if (result.intent.kind !== 'create-goal') return;
    expect(result.intent.title).toBe('Fitness');
  });

  it('parses open-page intent', () => {
    const result = parseCommand('open goals');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(true);
    if (!result || !result.ok) return;
    expect(result.intent.kind).toBe('open-page');
    if (result.intent.kind !== 'open-page') return;
    expect(result.intent.path).toBe('/goals');
  });

  it('returns inline error for malformed focus command', () => {
    const result = parseCommand('focus');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(false);
  });

  it('rejects invalid dd.mm date values', () => {
    const result = parseCommand('erstelle task "Mathe" deadline 31.02.');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(false);
  });

  it('supports forced mode with unknown command error', () => {
    const result = parseCommand('> irgendwas');
    expect(result).not.toBeNull();
    expect(result && result.ok).toBe(false);
  });
});
