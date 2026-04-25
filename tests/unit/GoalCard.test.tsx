import { describe, expect, it, vi } from 'vitest';
import GoalCard from '@/components/features/goals/GoalCard';
import type { Goal } from '@/lib/schemas/goal.schema';
import { render, screen, userEvent } from '@/tests/utils/test-utils';

const sampleGoal: Goal = {
  id: 'goal-1',
  title: 'Makrooekonomie bestehen',
  description: 'Woechentliche Wiederholung und Klausurvorbereitung.',
  category: 'learning',
  targetDate: new Date('2026-08-20T00:00:00.000Z'),
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  metrics: {
    current: 3,
    target: 12,
    unit: 'Blatt',
  },
};

describe('GoalCard', () => {
  it('calls onClick with the goal when the card is pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<GoalCard goal={sampleGoal} onClick={onClick} />);

    await user.click(screen.getByText('Makrooekonomie bestehen'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(sampleGoal);
  });

  it('deletes without bubbling the click handler', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDelete = vi.fn();

    render(<GoalCard goal={sampleGoal} onClick={onClick} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete goal' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('goal-1');
    expect(onClick).not.toHaveBeenCalled();
  });
});
