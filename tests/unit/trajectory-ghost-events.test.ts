import { addDays, startOfWeek } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { buildTrajectoryGhostEventsForWeek } from '@/lib/calendar/trajectoryGhostEvents';

function getWeekDays(baseDate: Date): Date[] {
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

describe('buildTrajectoryGhostEventsForWeek', () => {
  it('maps milestones, prep blocks and windows into day buckets', () => {
    const weekDays = getWeekDays(new Date('2026-03-04T10:00:00.000Z'));
    const result = buildTrajectoryGhostEventsForWeek({
      weekDays,
      goals: [
        {
          id: 'goal-1',
          title: 'GMAT',
          dueDate: '2026-03-05',
          status: 'active',
        },
      ],
      generatedBlocks: [
        {
          goalId: 'goal-1',
          title: 'GMAT Prep',
          startDate: '2026-03-03',
          endDate: '2026-03-06',
          status: 'tight',
        },
      ],
      windows: [
        {
          id: 'window-1',
          title: 'Internship Q2',
          startDate: '2026-03-04',
          endDate: '2026-03-07',
          confidence: 'medium',
        },
      ],
    });

    expect(result['2026-03-05']?.some((event) => event.kind === 'milestone')).toBe(true);
    expect(result['2026-03-03']?.some((event) => event.kind === 'prep_block')).toBe(true);
    expect(result['2026-03-07']?.some((event) => event.kind === 'window')).toBe(true);
  });

  it('ignores non-active goals and out-of-range entries', () => {
    const weekDays = getWeekDays(new Date('2026-03-04T10:00:00.000Z'));
    const result = buildTrajectoryGhostEventsForWeek({
      weekDays,
      goals: [
        {
          id: 'goal-archived',
          title: 'Archived goal',
          dueDate: '2026-03-05',
          status: 'archived',
        },
      ],
      generatedBlocks: [
        {
          goalId: 'goal-x',
          title: 'Out of range prep',
          startDate: '2026-04-01',
          endDate: '2026-04-10',
          status: 'on_track',
        },
      ],
      windows: [],
    });

    const allEvents = Object.values(result).flat();
    expect(allEvents).toHaveLength(0);
  });
});
