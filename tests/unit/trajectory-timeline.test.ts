import { describe, expect, it } from 'vitest';
import { startOfDay } from 'date-fns';
import {
  buildTimelineRuler,
  getMonthLabelFormat,
  selectTicksWithMinGap,
} from '@/lib/trajectory/timeline';

describe('trajectory timeline ruler', () => {
  it('uses compact numeric month labels for long horizons', () => {
    expect(getMonthLabelFormat(17)).toBe("MMM ''yy");
    expect(getMonthLabelFormat(18)).toBe('MM.yy');
    expect(getMonthLabelFormat(36)).toBe('MM.yy');
  });

  it('keeps first and last ticks and avoids tight label collisions', () => {
    const timelineStart = startOfDay(new Date('2026-03-01T00:00:00.000Z'));
    const { monthLabelTicks } = buildTimelineRuler(timelineStart, 36);

    expect(monthLabelTicks.length).toBeGreaterThan(2);
    expect(monthLabelTicks[0]?.monthOffset).toBe(0);
    expect(monthLabelTicks[monthLabelTicks.length - 1]?.monthOffset).toBe(36);

    for (let i = 1; i < monthLabelTicks.length; i += 1) {
      const previous = monthLabelTicks[i - 1];
      const current = monthLabelTicks[i];
      expect(current && previous ? current.offsetPercent - previous.offsetPercent : 0).toBeGreaterThanOrEqual(7);
    }
  });

  it('builds quarter segments across the horizon', () => {
    const timelineStart = startOfDay(new Date('2026-03-01T00:00:00.000Z'));
    const { quarterSegments } = buildTimelineRuler(timelineStart, 21);

    expect(quarterSegments.length).toBeGreaterThanOrEqual(7);
    expect(quarterSegments[0]?.label.startsWith('Q')).toBe(true);

    for (const segment of quarterSegments) {
      expect(segment.endPercent).toBeGreaterThan(segment.startPercent);
    }
  });

  it('drops overcrowded intermediate ticks but preserves the final tick', () => {
    const ticks = [
      { offsetPercent: 0, label: 'A' },
      { offsetPercent: 5, label: 'B' },
      { offsetPercent: 9, label: 'C' },
      { offsetPercent: 13, label: 'D' },
    ];

    const filtered = selectTicksWithMinGap(ticks, 7, {
      alwaysKeepFirst: true,
      alwaysKeepLast: true,
    });

    expect(filtered[0]?.label).toBe('A');
    expect(filtered[filtered.length - 1]?.label).toBe('D');
    expect(filtered.some((tick) => tick.label === 'C')).toBe(false);
  });
});
