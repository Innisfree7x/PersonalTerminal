import { describe, expect, it } from 'vitest';
import { matchExamForModule } from '@/lib/supabase/kitCourses';

describe('matchExamForModule', () => {
  const exams = [
    { title: 'Investments Klausur', starts_at: '2026-08-13T08:00:00.000Z' },
    { title: 'OR Operations Research Exam', starts_at: '2026-08-11T08:00:00.000Z' },
    { title: 'Python Algorithmen für Fahrzeugtechnik Prüfung', starts_at: '2026-08-26T08:00:00.000Z' },
    { title: 'Elektrotechnik 1 Klausur', starts_at: '2026-09-15T08:00:00.000Z' },
  ];

  it('matches by overlapping significant tokens', () => {
    const match = matchExamForModule('Investments', exams);
    expect(match?.title).toBe('Investments Klausur');
  });

  it('matches compound titles with shared keywords', () => {
    const match = matchExamForModule('Python-Algorithmen für Fahrzeugtechnik', exams);
    expect(match?.title).toContain('Python');
  });

  it('matches operations research via code token', () => {
    const match = matchExamForModule('Einführung in das Operations Research', exams);
    expect(match?.title).toContain('Operations');
  });

  it('returns null when no overlap', () => {
    const match = matchExamForModule('VWL 2', exams);
    expect(match).toBeNull();
  });

  it('handles umlauts without losing matches', () => {
    const match = matchExamForModule('Elektrotechnik 1', exams);
    expect(match?.title).toBe('Elektrotechnik 1 Klausur');
  });

  it('returns null when module title has no significant tokens', () => {
    const match = matchExamForModule('und', exams);
    expect(match).toBeNull();
  });

  it('picks exam with highest token overlap', () => {
    const competing = [
      { title: 'Generic Klausur', starts_at: '2026-08-01T08:00:00.000Z' },
      { title: 'Investments Klausur 2026', starts_at: '2026-08-13T08:00:00.000Z' },
    ];
    const match = matchExamForModule('Investments', competing);
    expect(match?.title).toBe('Investments Klausur 2026');
  });
});
