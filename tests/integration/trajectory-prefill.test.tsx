import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';
import React from 'react';

const hoisted = vi.hoisted(() => ({
  soundToastSuccess: vi.fn(),
}));

vi.mock('framer-motion', () => {
  const create = (tag: string) => ({ children, ...props }: any) => {
    const sanitized = { ...props };
    delete sanitized.animate;
    delete sanitized.exit;
    delete sanitized.initial;
    delete sanitized.layout;
    delete sanitized.transition;
    delete sanitized.variants;
    delete sanitized.whileHover;
    delete sanitized.whileTap;
    delete sanitized.whileInView;
    delete sanitized.viewport;
    return <>{React.createElement(tag, sanitized, children)}</>;
  };

  return {
    motion: {
      div: create('div'),
      aside: create('aside'),
      header: create('header'),
      main: create('main'),
      button: create('button'),
      span: create('span'),
      p: create('p'),
      circle: create('circle'),
      section: create('section'),
    },
  };
});

vi.mock('@/lib/hooks/useSoundToast', () => ({
  useSoundToast: () => ({
    success: hoisted.soundToastSuccess,
    error: vi.fn(),
    plain: { success: vi.fn(), error: vi.fn() },
  }),
}));

import TrajectoryPage from '@/app/(dashboard)/career/trajectory/page';

function installStorageMock() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, String(value)),
      removeItem: (key: string) => void store.delete(key),
      clear: () => void store.clear(),
    },
  });
}

describe('Trajectory prefill integration', () => {
  beforeEach(() => {
    installStorageMock();
    vi.restoreAllMocks();
    hoisted.soundToastSuccess.mockClear();
    window.history.pushState(
      {},
      '',
      '/trajectory?prefillTitle=GMAT%20Prep&prefillCategory=gmat&prefillDueDate=2027-03-01&prefillEffortHours=120&prefillBufferWeeks=2&source=career_gap_bridge'
    );

    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url === '/api/trajectory/overview') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            settings: {
              id: 'settings-1',
              hoursPerWeek: 10,
              horizonMonths: 24,
              createdAt: '2026-03-21T10:00:00.000Z',
              updatedAt: '2026-03-21T10:00:00.000Z',
            },
            goals: [],
            windows: [],
            blocks: [],
            computed: {
              effectiveCapacityHoursPerWeek: 10,
              generatedBlocks: [],
              alerts: [],
              summary: {
                total: 0,
                onTrack: 0,
                tight: 0,
                atRisk: 0,
              },
            },
          }),
        } as Response);
      }

      if (url === '/api/trajectory/plan') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            settings: {
              id: 'settings-1',
              hoursPerWeek: 10,
              horizonMonths: 24,
              createdAt: '2026-03-21T10:00:00.000Z',
              updatedAt: '2026-03-21T10:00:00.000Z',
            },
            simulation: {
              used: false,
              effectiveCapacityHoursPerWeek: 10,
            },
            computed: {
              effectiveCapacityHoursPerWeek: 10,
              generatedBlocks: [],
              alerts: [],
              summary: {
                total: 0,
                onTrack: 0,
                tight: 0,
                atRisk: 0,
              },
            },
          }),
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
  });

  test('hydrates the milestone form from URL params and strips the prefill params from the address bar', async () => {
    renderWithProviders(<TrajectoryPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('GMAT Prep')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('2027-03-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(hoisted.soundToastSuccess).toHaveBeenCalledWith('Strategy-Entscheidung in das Trajectory-Formular übernommen.');

    await waitFor(() => {
      expect(window.location.search).toBe('?source=career_gap_bridge');
    });

    const fetchMock = global.fetch as Mock;
    expect(fetchMock).toHaveBeenCalledWith('/api/trajectory/overview', expect.any(Object));
  });
});
