import { describe, expect, it } from 'vitest';
import {
  buildCampusExamEventUpsertRows,
  buildCampusGradeUpsertRows,
  buildCampusModuleUpsertRows,
  normalizeCampusConnectorPayload,
} from '@/lib/kit-sync/campusConnector';

describe('campus connector helpers', () => {
  it('dedupliziert Connector-Payloads stabil über externe IDs', () => {
    const normalized = normalizeCampusConnectorPayload({
      modules: [
        { externalId: 'module-1', title: 'OR', status: 'active' },
        { externalId: 'module-1', title: 'OR aktualisiert', status: 'completed' },
      ],
      grades: [
        { externalGradeId: 'grade-1', moduleExternalId: 'module-1', gradeLabel: '1,7' },
        { externalGradeId: 'grade-1', moduleExternalId: 'module-1', gradeLabel: '1,3' },
      ],
      exams: [
        {
          externalId: 'exam-1',
          moduleExternalId: 'module-1',
          title: 'OR Klausur',
          startsAt: '2026-04-10T08:00:00.000Z',
        },
        {
          externalId: 'exam-1',
          moduleExternalId: 'module-1',
          title: 'OR Klausur verschoben',
          startsAt: '2026-04-11T08:00:00.000Z',
        },
      ],
    });

    expect(normalized.modules).toHaveLength(1);
    expect(normalized.modules[0]?.title).toBe('OR aktualisiert');
    expect(normalized.grades).toHaveLength(1);
    expect(normalized.grades[0]?.gradeLabel).toBe('1,3');
    expect(normalized.exams).toHaveLength(1);
    expect(normalized.exams[0]?.title).toBe('OR Klausur verschoben');
    expect(normalized.referencedModuleExternalIds).toEqual(['module-1']);
    expect(normalized.itemsRead).toBe(3);
  });

  it('erstellt konsistente Upsert-Zeilen für Module, Noten und Prüfungen', () => {
    const moduleRows = buildCampusModuleUpsertRows('user-1', [
      {
        externalId: 'module-1',
        moduleCode: '260014',
        title: 'Makroökonomie',
        status: 'active',
        semesterLabel: 'SS 2025',
        credits: 6,
      },
    ]);

    const gradeRows = buildCampusGradeUpsertRows('user-1', [
      {
        moduleId: 'internal-module-1',
        grade: {
          externalGradeId: 'grade-1',
          moduleExternalId: 'module-1',
          gradeValue: 1.7,
          gradeLabel: '1,7',
          examDate: '2026-02-10',
          publishedAt: '2026-03-01T10:00:00.000Z',
        },
      },
    ]);

    const examRows = buildCampusExamEventUpsertRows('user-1', 'profile-1', [
      {
        externalId: 'exam-1',
        moduleExternalId: 'module-1',
        title: 'Makro Klausur',
        startsAt: '2026-04-10T08:00:00.000Z',
        location: 'Audimax',
      },
    ]);

    expect(moduleRows[0]).toMatchObject({
      user_id: 'user-1',
      external_id: 'module-1',
      module_code: '260014',
      title: 'Makroökonomie',
    });
    expect(gradeRows[0]).toMatchObject({
      user_id: 'user-1',
      module_id: 'internal-module-1',
      external_grade_id: 'grade-1',
      grade_label: '1,7',
    });
    expect(examRows[0]).toMatchObject({
      user_id: 'user-1',
      profile_id: 'profile-1',
      external_id: 'exam-1',
      source: 'campus_connector',
      kind: 'exam',
      title: 'Makro Klausur',
    });
    expect(examRows[0]?.content_hash).toBeTruthy();
  });
});
