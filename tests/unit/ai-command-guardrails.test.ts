import { describe, expect, it } from 'vitest';
import { guardCommandInput, normalizeCommandInput } from '@/lib/ai/guardrails';

describe('AI command guardrails', () => {
  it('normalizes control characters and whitespace', () => {
    const normalized = normalizeCommandInput('  focus\t\t25\n\r');
    expect(normalized).toBe('focus 25');
  });

  it('rejects oversized inputs', () => {
    const result = guardCommandInput(`>${'x'.repeat(400)}`);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('max 280 Zeichen');
  });

  it('accepts valid command inputs', () => {
    const result = guardCommandInput('erstelle task "VWL Blatt 8" deadline morgen');
    expect(result.ok).toBe(true);
    expect(result.value).toBe('erstelle task "VWL Blatt 8" deadline morgen');
  });
});

