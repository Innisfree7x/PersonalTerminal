import { describe, expect, it } from 'vitest';
import { parseCommand } from '@/lib/command/parser';
import { commandIntentSchema } from '@/lib/ai/contracts';

describe('AI eval: command intent contract', () => {
  it('validates a deterministic command matrix against runtime intent schema', () => {
    const matrix: Array<{
      input: string;
      expectedKind: 'create-task' | 'create-goal' | 'plan-focus' | 'open-page';
    }> = [
      { input: 'erstelle task "VWL Blatt 9" deadline morgen', expectedKind: 'create-task' },
      { input: 'erstelle goal "GMAT 680+"', expectedKind: 'create-goal' },
      { input: 'fokus 50', expectedKind: 'plan-focus' },
      { input: 'open goals', expectedKind: 'open-page' },
    ];

    for (const scenario of matrix) {
      const parsed = parseCommand(scenario.input);
      expect(parsed).not.toBeNull();
      expect(parsed && parsed.ok).toBe(true);
      if (!parsed || !parsed.ok) continue;

      expect(parsed.intent.kind).toBe(scenario.expectedKind);
      const contractCheck = commandIntentSchema.safeParse(parsed.intent);
      expect(contractCheck.success).toBe(true);
    }
  });

  it('guards malformed or oversized command inputs', () => {
    const malformed = parseCommand('> focus');
    expect(malformed).not.toBeNull();
    expect(malformed && malformed.ok).toBe(false);

    const oversized = parseCommand(`> erstelle task "${'A'.repeat(500)}"`);
    expect(oversized).not.toBeNull();
    expect(oversized && oversized.ok).toBe(false);
    if (oversized && !oversized.ok) {
      expect(oversized.error).toContain('max 280 Zeichen');
    }
  });
});

