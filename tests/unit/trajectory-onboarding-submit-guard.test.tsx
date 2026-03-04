import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render, screen, userEvent, waitFor } from '@/tests/utils/test-utils';
import { StepTrajectoryGoal } from '@/components/features/onboarding/StepTrajectoryGoal';

vi.mock('@/app/onboarding/analytics', () => ({
  trackOnboardingEvent: vi.fn(),
}));

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Onboarding V2 trajectory goal step', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('prevents duplicate goal create on rapid double submit', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    let callCount = 0;
    let resolvePending: ((value: Response) => void) | null = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === '/api/trajectory/goals' && init?.method === 'POST') {
        callCount += 1;
        if (callCount === 1) {
          return new Promise<Response>((resolve) => {
            resolvePending = resolve;
          });
        }
        return Promise.resolve(jsonResponse({ id: `goal-${callCount}` }, 201));
      }
      return Promise.reject(new Error(`Unexpected call: ${init?.method ?? 'GET'} ${url}`));
    });

    render(
      <StepTrajectoryGoal
        capacityHoursPerWeek={8}
        onNext={onNext}
      />
    );

    await user.type(screen.getByPlaceholderText('e.g. GMAT 680+ or thesis submission'), 'GMAT Sprint');
    const form = screen.getByRole('button', { name: /create goal & continue/i }).closest('form');
    expect(form).not.toBeNull();

    fireEvent.submit(form!);
    fireEvent.submit(form!);

    expect(callCount).toBe(1);

    resolvePending?.(jsonResponse({ id: 'goal-1' }, 201));
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });

  test('shows API error and supports retry path', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    let attempt = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url === '/api/trajectory/goals' && init?.method === 'POST') {
        attempt += 1;
        if (attempt === 1) {
          return Promise.resolve(
            jsonResponse({ error: { message: 'temporary goal create failure' } }, 500)
          );
        }
        return Promise.resolve(jsonResponse({ id: 'goal-retry' }, 201));
      }
      return Promise.reject(new Error(`Unexpected call: ${init?.method ?? 'GET'} ${url}`));
    });

    render(
      <StepTrajectoryGoal
        capacityHoursPerWeek={8}
        onNext={onNext}
      />
    );

    await user.type(screen.getByPlaceholderText('e.g. GMAT 680+ or thesis submission'), 'Thesis Sprint');
    await user.click(screen.getByRole('button', { name: /create goal & continue/i }));
    await screen.findByText(/temporary goal create failure/i);
    expect(onNext).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /create goal & continue/i }));
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });
});
