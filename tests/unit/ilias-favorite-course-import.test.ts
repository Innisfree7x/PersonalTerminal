import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

import {
  buildIliasFavoriteCourseImports,
  collectIliasFavoriteIdsForCourseDeletion,
} from '@/lib/supabase/courses';

describe('buildIliasFavoriteCourseImports', () => {
  it('imports only curated study courses with authoritative ects and exam dates', () => {
    const imports = buildIliasFavoriteCourseImports(
      [
        { title: '10. Financial Data Science', semester_label: 'SS 2026' },
        { title: 'Einführung in das Operations Research', semester_label: 'SS 2026' },
        { title: 'Grundlagen der Unternehmensbesteuerung - WiSe 25/26', semester_label: 'WiSe 25/26' },
      ],
      [],
    );

    expect(imports).toEqual([
      {
        name: 'Financial Data Science',
        ects: 9,
        numExercises: 12,
        examDate: undefined,
        semester: 'SS 2026',
      },
      {
        name: 'Einführung in das OR',
        ects: 9,
        numExercises: 12,
        examDate: new Date('2026-08-11T00:00:00.000Z'),
        semester: 'SS 2026',
      },
    ]);
  });

  it('deduplicates alias variants and skips catalog courses that already exist locally', () => {
    const imports = buildIliasFavoriteCourseImports(
      [
        { title: 'VWL 2', semester_label: 'SS 2026' },
        { title: '2600014 - Volkswirtschaftslehre II: Makroökonomie', semester_label: 'SS 2026' },
        { title: 'Investments', semester_label: 'SS 2026' },
      ],
      [{ name: 'Volkswirtschaftslehre II: Makroökonomie', semester: 'SS 2026' }],
    );

    expect(imports).toEqual([
      {
        name: 'Investments',
        ects: 4.5,
        numExercises: 12,
        examDate: new Date('2026-08-13T00:00:00.000Z'),
        semester: 'SS 2026',
      },
    ]);
  });
});

describe('collectIliasFavoriteIdsForCourseDeletion', () => {
  it('removes all matching favorite sources for a deleted auto-import course', () => {
    const favoriteIds = collectIliasFavoriteIdsForCourseDeletion('Financial Data Science', [
      { id: 'favorite-fds-1', title: '2530371 Financial Data Science' },
      { id: 'favorite-fds-2', title: '10. Financial Data Science' },
      { id: 'favorite-other', title: 'Grundlagen der Unternehmensbesteuerung - WiSe 25/26' },
    ]);

    expect(favoriteIds).toEqual(['favorite-fds-1', 'favorite-fds-2']);
  });
});
