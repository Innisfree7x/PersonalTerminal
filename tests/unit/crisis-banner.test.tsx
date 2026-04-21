import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CrisisBanner from '@/components/features/trajectory/CrisisBanner';
import type { CrisisCollision } from '@/lib/trajectory/crisis';

describe('CrisisBanner', () => {
  it('renders nothing when there are no collisions', () => {
    const { container } = render(<CrisisBanner collisions={[]} goalsById={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders one collision with resolved goal titles', () => {
    const collision: CrisisCollision = {
      code: 'FIXED_WINDOW_COLLISION',
      severity: 'critical',
      conflictingGoalIds: ['g1', 'g2'],
      window: { startDate: '2026-09-01', endDate: '2026-10-15' },
      message: 'overlap',
    };
    render(
      <CrisisBanner
        collisions={[collision]}
        goalsById={{ g1: { title: 'GMAT' }, g2: { title: 'Thesis' } }}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Crisis erkannt — 1 Kollision/)).toBeInTheDocument();
    expect(screen.getByText(/Fixed-Window Kollision/i)).toBeInTheDocument();
    expect(screen.getByText(/GMAT ↔ Thesis/)).toBeInTheDocument();
    expect(screen.getByText(/01\.09\.2026 – 15\.10\.2026/)).toBeInTheDocument();
  });

  it('falls back to goal id when title is missing', () => {
    const collision: CrisisCollision = {
      code: 'LEAD_TIME_TOO_SHORT',
      severity: 'critical',
      conflictingGoalIds: ['unknown-id'],
      window: { startDate: '2026-05-01', endDate: '2026-05-15' },
      message: 'too tight',
    };
    render(<CrisisBanner collisions={[collision]} goalsById={{}} />);
    expect(screen.getByText(/unknown-id/)).toBeInTheDocument();
    expect(screen.getByText(/Lead-Time zu kurz/i)).toBeInTheDocument();
  });

  it('pluralises header for multiple collisions', () => {
    const base: Omit<CrisisCollision, 'code'> = {
      severity: 'critical',
      conflictingGoalIds: ['g1'],
      window: { startDate: '2026-05-01', endDate: '2026-05-15' },
      message: 'x',
    };
    render(
      <CrisisBanner
        collisions={[
          { ...base, code: 'FIXED_WINDOW_COLLISION' },
          { ...base, code: 'NO_FLEXIBLE_SLOT' },
        ]}
        goalsById={{ g1: { title: 'Goal A' } }}
      />
    );
    expect(screen.getByText(/Crisis erkannt — 2 Kollisionen/)).toBeInTheDocument();
  });
});
