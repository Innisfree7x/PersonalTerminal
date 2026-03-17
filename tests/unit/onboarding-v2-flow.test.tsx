import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, userEvent, waitFor } from '@/tests/utils/test-utils';

const hoistedRouter = vi.hoisted(() => ({
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => hoistedRouter.router,
}));

vi.mock('@/app/actions/profile', () => ({
  fetchProfileAction: vi.fn(),
}));

vi.mock('@/app/onboarding/analytics', () => ({
  trackOnboardingEvent: vi.fn(),
}));

vi.mock('@/components/features/onboarding/OnboardingLayout', () => ({
  OnboardingLayout: ({
    currentStep,
    children,
  }: {
    currentStep: number;
    children: ReactNode;
  }) => (
    <div>
      <div data-testid="current-step">step:{currentStep}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/features/onboarding/StepWelcome', () => ({
  StepWelcome: ({ onNext }: { onNext: () => void }) => (
    <button type="button" onClick={onNext}>
      welcome-next
    </button>
  ),
}));

vi.mock('@/components/features/onboarding/StepGoalAndPlan', () => ({
  StepGoalAndPlan: ({
    onNext,
  }: {
    onNext: (
      goal: {
        goalId: string;
        goalDraft: {
          title: string;
          category: 'gmat';
          dueDate: string;
          effortHours: number;
          bufferWeeks: number;
          priority: number;
          status: 'active';
        };
      },
      draft: {
        title: string;
        category: 'gmat';
        dueDate: string;
        effortHours: number;
        bufferWeeks: number;
        capacityHoursPerWeek: number;
      },
      settings: { hoursPerWeek: number; horizonMonths: number },
      summary: {
        status: 'on_track';
        startDate: string;
        explanation: string;
        effectiveCapacityHoursPerWeek: number;
      }
    ) => void;
  }) => (
    <div data-testid="mock-step-goal-plan">
      <button
        type="button"
        onClick={() =>
          onNext(
            {
              goalId: 'goal-1',
              goalDraft: {
                title: 'GMAT Sprint',
                category: 'gmat',
                dueDate: '2026-09-01',
                effortHours: 80,
                bufferWeeks: 2,
                priority: 3,
                status: 'active',
              },
            },
            {
              title: 'GMAT Sprint',
              category: 'gmat',
              dueDate: '2026-09-01',
              effortHours: 80,
              bufferWeeks: 2,
              capacityHoursPerWeek: 10,
            },
            { hoursPerWeek: 10, horizonMonths: 24 },
            {
              status: 'on_track',
              startDate: '2026-06-01',
              explanation: 'Stable trajectory.',
              effectiveCapacityHoursPerWeek: 10,
            }
          )
        }
      >
        goal-plan-success
      </button>
    </div>
  ),
}));

vi.mock('@/components/features/onboarding/StepComplete', () => ({
  StepComplete: ({
    completedData,
  }: {
    completedData: { trajectory: { status: 'on_track' | 'tight' | 'at_risk' } | null };
  }) => <div data-testid="mock-step-complete">status:{completedData.trajectory?.status ?? 'none'}</div>,
}));

import { fetchProfileAction } from '@/app/actions/profile';
import OnboardingPage from '@/app/onboarding/page';

const mockedFetchProfileAction = vi.mocked(fetchProfileAction);
const storageState = new Map<string, string>();

function installLocalStorageMock() {
  const storage: Storage = {
    getItem: (key: string) => (storageState.has(key) ? storageState.get(key)! : null),
    setItem: (key: string, value: string) => {
      storageState.set(key, String(value));
    },
    removeItem: (key: string) => {
      storageState.delete(key);
    },
    clear: () => {
      storageState.clear();
    },
    key: (index: number) => Array.from(storageState.keys())[index] ?? null,
    get length() {
      return storageState.size;
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}

function okJson(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Onboarding V2 page flow (3-step)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageState.clear();
    installLocalStorageMock();
    localStorage.removeItem('innis_onboarding_v1');
    localStorage.removeItem('innis_onboarding_v2');
    mockedFetchProfileAction.mockResolvedValue({
      fullName: 'Ada',
      onboardingCompleted: false,
      onboardingCompletedAt: null,
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okJson({ hoursPerWeek: 8, horizonMonths: 24 }));
  });

  test('starts at step 1 with no persisted state', async () => {
    render(<OnboardingPage />);

    await waitFor(() => {
      expect(screen.getByTestId('current-step')).toHaveTextContent('step:1');
    });
  });

  test('happy path: welcome → goal+plan → complete', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    await waitFor(() => expect(screen.getByTestId('current-step')).toHaveTextContent('step:1'));
    await user.click(screen.getByRole('button', { name: 'welcome-next' }));
    await waitFor(() => expect(screen.getByTestId('current-step')).toHaveTextContent('step:2'));

    await user.click(await screen.findByRole('button', { name: 'goal-plan-success' }));
    await waitFor(() => expect(screen.getByTestId('current-step')).toHaveTextContent('step:3'));

    expect(await screen.findByTestId('mock-step-complete')).toHaveTextContent('status:on_track');
  });

  test('redirects already-onboarded users to /today', async () => {
    mockedFetchProfileAction.mockResolvedValue({
      fullName: 'Ada',
      onboardingCompleted: true,
      onboardingCompletedAt: '2026-03-01T00:00:00Z',
    });

    render(<OnboardingPage />);

    await waitFor(() => {
      expect(hoistedRouter.router.replace).toHaveBeenCalledWith('/today');
    });
  });
});
