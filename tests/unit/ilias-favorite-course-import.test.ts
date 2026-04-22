import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/server', () => ({
  createClient: vi.fn(),
}));

import { buildIliasFavoriteCourseImports } from '@/lib/supabase/courses';

describe('buildIliasFavoriteCourseImports', () => {
  it('builds missing local courses from ILIAS favorites with 12 exercise sheets', () => {
    const imports = buildIliasFavoriteCourseImports(
      [
        { title: 'Financial Data Science', semester_label: 'SS 2026' },
        { title: 'Einführung in die Volkswirtschaftslehre', semester_label: 'SS 2026' },
      ],
      [],
      [
        { title: 'Financial Data Science', semester_label: 'SS 2026', credits: 4.5 },
        { title: 'Einführung in die Volkswirtschaftslehre', semester_label: 'SS 2026', credits: 5 },
      ]
    );

    expect(imports).toEqual([
      {
        name: 'Financial Data Science',
        ects: 4.5,
        numExercises: 12,
        semester: 'SS 2026',
      },
      {
        name: 'Einführung in die Volkswirtschaftslehre',
        ects: 5,
        numExercises: 12,
        semester: 'SS 2026',
      },
    ]);
  });

  it('skips courses that already exist locally and deduplicates repeated favorites', () => {
    const imports = buildIliasFavoriteCourseImports(
      [
        { title: 'Operations Research', semester_label: 'SS 2026' },
        { title: 'Operations   Research', semester_label: 'SS 2026' },
        { title: 'Investments', semester_label: 'SS 2026' },
      ],
      [{ name: 'Operations Research', semester: 'SS 2026' }],
      [{ title: 'Investments', semester_label: 'SS 2026', credits: 6 }],
    );

    expect(imports).toEqual([
      {
        name: 'Investments',
        ects: 6,
        numExercises: 12,
        semester: 'SS 2026',
      },
    ]);
  });

  it('falls back to default ects and semester when no clean module match exists', () => {
    const imports = buildIliasFavoriteCourseImports(
      [{ title: 'Mein Sonderkurs', semester_label: null }],
      [],
      [{ title: 'Ganz anderes Modul', semester_label: 'WS 2025/26', credits: 19.5 }],
    );

    expect(imports).toEqual([
      {
        name: 'Mein Sonderkurs',
        ects: 5,
        numExercises: 12,
        semester: 'ILIAS',
      },
    ]);
  });
});
