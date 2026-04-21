import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import WeeklyTemplateGrid from '@/components/features/calendar/WeeklyTemplateGrid';
import type { CalendarEntry } from '@/lib/supabase/calendarEntries';

const noop = vi.fn();

const weekStart = new Date('2026-04-20T00:00:00.000Z');

const sampleEntry: CalendarEntry = {
  id: 'entry-1',
  source: 'kit_webcal',
  title: '2530371 - Financial Data Science',
  description: null,
  location: '10.50 Raum 701.3',
  startsAt: '2026-04-20T08:00:00.000Z',
  endsAt: '2026-04-20T09:30:00.000Z',
  allDay: false,
  kind: 'lecture',
};

describe('WeeklyTemplateGrid', () => {
  it('renders full KIT slot labels and exposes the week grid as a region', () => {
    render(
      <WeeklyTemplateGrid
        weekStart={weekStart}
        entries={[]}
        onAddAt={noop}
        onOpenEntry={noop}
      />
    );

    expect(screen.getByRole('region', { name: 'Wochenkalender' })).toBeInTheDocument();
    expect(screen.getByText('08:00 – 09:30')).toBeInTheDocument();
    expect(screen.getByText('11:30 – 13:00')).toBeInTheDocument();
    expect(screen.getByText('17:30 – 19:00')).toBeInTheDocument();
  });

  it('renders existing weekly entries with title and location', () => {
    render(
      <WeeklyTemplateGrid
        weekStart={weekStart}
        entries={[sampleEntry]}
        onAddAt={noop}
        onOpenEntry={noop}
      />
    );

    expect(screen.getByText('2530371 - Financial Data Science')).toBeInTheDocument();
    expect(screen.getByText('10.50 Raum 701.3')).toBeInTheDocument();
  });
});
