import { fireEvent, render, screen, waitFor } from '@/tests/utils/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OpportunityRadar from '@/components/features/career/OpportunityRadar';
import type { OpportunitySearchResponse } from '@/lib/schemas/opportunity-radar.schema';

const originalFetch = globalThis.fetch;

const payload: OpportunitySearchResponse = {
  items: [
    {
      id: 'opp_1',
      title: 'Intern M&A Advisory',
      company: 'Rothenstein Partners',
      city: 'Frankfurt',
      country: 'DE',
      track: 'M&A',
      fitScore: 82,
      band: 'realistic',
      topReasons: ['Direkter Track-Match zu M&A'],
      topGaps: ['Interview case speed'],
      sourceLabels: ['Campus Board', 'Employer Feed'],
      targetFirm: true,
      nextAction: 'CV auf DCF-Projekte zuspitzen und dann einreichen.',
      jobUrl: 'https://example.com/1',
    },
    {
      id: 'opp_2',
      title: 'TS Internship Financial Due Diligence',
      company: 'Kern Advisory',
      city: 'Hamburg',
      country: 'DE',
      track: 'TS',
      fitScore: 74,
      band: 'target',
      topReasons: ['Track-Nähe zu M&A'],
      topGaps: ['Industry accounting edge cases'],
      sourceLabels: ['Adzuna'],
      targetFirm: false,
      nextAction: 'Transaction-Cases wiederholen und TS-Bezug im CV schärfen.',
      jobUrl: 'https://example.com/2',
    },
  ],
  meta: {
    query: '',
    priorityTrack: 'M&A',
    totalBeforeLimit: 2,
    sourcesQueried: 3,
    liveSourceConfigured: true,
    liveSourceHealthy: true,
    liveSourceContributed: true,
    cvProfileApplied: true,
    cvRankTier: 'strong',
    cvTargetTracks: ['M&A', 'TS'],
    llm: {
      enabled: true,
      maxDailyUnits: 50,
      usedUnits: 2,
      remainingUnits: 48,
      enrichedThisRequest: 2,
    },
  },
};

describe('OpportunityRadar', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => payload,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('shows a dossier for the selected lead and lets the user switch selection', async () => {
    render(<OpportunityRadar onAdoptToPipeline={vi.fn()} />);

    await screen.findByText('Career Dossier', undefined, { timeout: 3000 });
    expect(screen.getAllByText('Intern M&A Advisory').length).toBeGreaterThan(0);
    expect(screen.getByText('Rothenstein Partners ist aktuell dein klarster Decision-Lead')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dossier öffnen: TS Internship Financial Due Diligence bei Kern Advisory/i }));

    await waitFor(() => {
      expect(screen.getByText('Kern Advisory ist aktuell dein klarster Decision-Lead')).toBeInTheDocument();
    });
    expect(screen.getByText('Dossier aktiv')).toBeInTheDocument();
  });

  it('shows cv signal details when a persisted cv profile is active', async () => {
    render(<OpportunityRadar onAdoptToPipeline={vi.fn()} />);

    await screen.findByText('CV-Signal', undefined, { timeout: 3000 });
    expect(screen.getByText('Stärkste Signale')).toBeInTheDocument();
    expect(screen.getByText('Nächste CV-Hebel')).toBeInTheDocument();
    expect(screen.getByText('Starkes Profil im Radar aktiv')).toBeInTheDocument();
  });

  it('shows recovery guidance when only ambitious matches remain', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...payload,
        items: [
          {
            ...payload.items[1],
            fitScore: 63,
            band: 'target',
          },
        ],
      } satisfies OpportunitySearchResponse),
    } as Response);

    render(<OpportunityRadar onAdoptToPipeline={vi.fn()} onOpenCvUpload={vi.fn()} />);

    await screen.findByText('Radar findet nur ambitionierte Optionen', undefined, { timeout: 3000 });
    expect(screen.getByRole('button', { name: 'CV-Profil schärfen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Band öffnen/i })).toBeInTheDocument();
  });
});
