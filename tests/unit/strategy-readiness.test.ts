import { describe, expect, it } from 'vitest';
import { buildStrategyCommitReadiness } from '@/lib/strategy/readiness';

describe('buildStrategyCommitReadiness', () => {
  it('returns success when the winner margin is clearly high', () => {
    const result = buildStrategyCommitReadiness({
      hasWinner: true,
      optionCount: 3,
      winnerTitle: 'IB',
      winnerMargin: 14,
      scoreMode: 'standard',
    });

    expect(result.tone).toBe('success');
    expect(result.title).toContain('IB');
    expect(result.nextStep).toContain('Commit');
  });

  it('returns warning when the winner margin is mid-range', () => {
    const result = buildStrategyCommitReadiness({
      hasWinner: true,
      optionCount: 2,
      winnerTitle: 'PE',
      winnerMargin: 8,
      scoreMode: 'deadline',
    });

    expect(result.tone).toBe('warning');
    expect(result.summary).toContain('+8');
  });

  it('returns error when there is no usable winner signal', () => {
    const result = buildStrategyCommitReadiness({
      hasWinner: false,
      optionCount: 0,
      winnerMargin: 0,
      scoreMode: 'standard',
    });

    expect(result.tone).toBe('error');
    expect(result.nextStep).toContain('Score run');
  });
});
