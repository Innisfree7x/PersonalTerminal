import { describe, expect, it } from 'vitest';
import { computePipelineScore } from '@/lib/career/pipelineScore';

describe('computePipelineScore', () => {
  it('returns zero for empty pipeline', () => {
    const result = computePipelineScore({ applied: 0, interviews: 0, offers: 0 });
    expect(result.score).toBe(0);
    expect(result.label).toBe('Noch wenig aktiv');
  });

  it('scores applied * 10', () => {
    const result = computePipelineScore({ applied: 3, interviews: 0, offers: 0 });
    expect(result.score).toBe(30);
    expect(result.label).toBe('Im Aufbau');
  });

  it('scores interviews * 25', () => {
    const result = computePipelineScore({ applied: 0, interviews: 2, offers: 0 });
    expect(result.score).toBe(50);
    expect(result.label).toBe('Im Aufbau');
  });

  it('scores offers * 50', () => {
    const result = computePipelineScore({ applied: 0, interviews: 0, offers: 1 });
    expect(result.score).toBe(50);
    expect(result.label).toBe('Im Aufbau');
  });

  it('combines all inputs correctly', () => {
    const result = computePipelineScore({ applied: 2, interviews: 1, offers: 0 });
    expect(result.score).toBe(45); // 20 + 25
    expect(result.label).toBe('Im Aufbau');
  });

  it('caps at 100', () => {
    const result = computePipelineScore({ applied: 10, interviews: 5, offers: 3 });
    expect(result.score).toBe(100);
    expect(result.label).toBe('Starke Pipeline');
  });

  it('labels "Gut aufgestellt" at 60-79', () => {
    const result = computePipelineScore({ applied: 1, interviews: 2, offers: 0 });
    expect(result.score).toBe(60);
    expect(result.label).toBe('Gut aufgestellt');
  });

  it('labels "Starke Pipeline" at 80+', () => {
    const result = computePipelineScore({ applied: 3, interviews: 2, offers: 0 });
    expect(result.score).toBe(80);
    expect(result.label).toBe('Starke Pipeline');
  });

  it('labels "Noch wenig aktiv" below 30', () => {
    const result = computePipelineScore({ applied: 2, interviews: 0, offers: 0 });
    expect(result.score).toBe(20);
    expect(result.label).toBe('Noch wenig aktiv');
  });
});
