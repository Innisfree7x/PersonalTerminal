import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/tests/utils/test-utils';

const hoisted = vi.hoisted(() => ({
  soundToastSuccess: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: hoisted.routerPush,
  }),
}));

vi.mock('@/lib/hooks/useSoundToast', () => ({
  useSoundToast: () => ({
    success: hoisted.soundToastSuccess,
    error: vi.fn(),
    plain: { success: vi.fn(), error: vi.fn() },
  }),
}));

import StrategyPage from '@/app/(dashboard)/strategy/page';

describe('Strategy career prefill integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    hoisted.soundToastSuccess.mockClear();
    hoisted.routerPush.mockClear();

    window.history.pushState(
      {},
      '',
      '/strategy?prefillDecisionTitle=Kern%20Advisory%20jetzt%20priorisieren%3F&prefillDecisionContext=TS%20Internship%20Financial%20Due%20Diligence%20in%20Hamburg%2C%20DE.%20Lead-Band%3A%20target.&prefillTargetDate=2026-04-30&prefillOptionTitle=Kern%20Advisory%20aktiv%20verfolgen&prefillOptionSummary=TS%20Internship%20Financial%20Due%20Diligence%20%C2%B7%20TS%20%C2%B7%20Industry%20accounting%20edge%20cases&prefillImpactPotential=8&prefillConfidenceLevel=6&prefillStrategicFit=7&prefillEffortCost=6&prefillDownsideRisk=5&prefillTimeToValueWeeks=4&source=career_strategy_bridge'
    );

    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url === '/api/strategy/decisions') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            decisions: [],
          }),
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
  });

  test('hydrates the decision and option draft from the career bridge and strips prefill params', async () => {
    renderWithProviders(<StrategyPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Kern Advisory jetzt priorisieren?')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue(/TS Internship Financial Due Diligence in Hamburg, DE/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-04-30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Kern Advisory aktiv verfolgen')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Industry accounting edge cases/i)).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('8').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('6').length).toBeGreaterThan(0);
    expect(hoisted.soundToastSuccess).toHaveBeenCalledWith('Career-Lead in Strategy übernommen.');

    await waitFor(() => {
      expect(window.location.search).toBe('?source=career_strategy_bridge');
    });

    const fetchMock = global.fetch as Mock;
    expect(fetchMock).toHaveBeenCalledWith('/api/strategy/decisions', expect.any(Object));
  });
});
