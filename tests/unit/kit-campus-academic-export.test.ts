import { describe, expect, it } from 'vitest';
import {
  KIT_CAMPUS_ACADEMIC_EXPORT_TYPE,
  buildCampusAcademicExport,
  parseCampusAcademicExport,
} from '@/lib/kit-sync/campusAcademicExport';

const campusHtml = `
  <main>
    <section>
      <h2>Studienaufbau</h2>
      <table>
        <thead>
          <tr>
            <th>Modul</th>
            <th>ECTS</th>
            <th>Semester</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2530575 – Investments SS2025</td>
            <td>6</td>
            <td>SS 2025</td>
            <td>aktiv</td>
          </tr>
          <tr>
            <td>2600014 – Volkswirtschaftslehre II: Makroökonomie</td>
            <td>5</td>
            <td>SS 2024</td>
            <td>bestanden</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th>Modul</th>
            <th>Note</th>
            <th>Prüfungsdatum</th>
            <th>Veröffentlicht</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2600014 – Volkswirtschaftslehre II: Makroökonomie</td>
            <td>1,7</td>
            <td>12.02.2026</td>
            <td>15.02.2026 12:30</td>
          </tr>
        </tbody>
      </table>

      <table>
        <thead>
          <tr>
            <th>Prüfung</th>
            <th>Datum</th>
            <th>Uhrzeit</th>
            <th>Hörsaal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2530575 – Investments SS2025</td>
            <td>20.04.2026</td>
            <td>10:00</td>
            <td>Ulrich, WIWI</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
`;

describe('campusAcademicExport helpers', () => {
  it('builds a stable campus academic export from tables', () => {
    const doc = new DOMParser().parseFromString(campusHtml, 'text/html');
    const payload = buildCampusAcademicExport(doc, 'https://campus.studium.kit.edu/reports/index.php');

    expect(payload.exportType).toBe(KIT_CAMPUS_ACADEMIC_EXPORT_TYPE);
    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:2530575',
          title: 'Investments SS2025',
          semesterLabel: 'SS 2025',
          credits: 6,
        }),
        expect.objectContaining({
          externalId: 'module:2600014',
          title: 'Volkswirtschaftslehre II: Makroökonomie',
          status: 'completed',
        }),
      ])
    );
    expect(payload.grades).toEqual([
      expect.objectContaining({
        moduleExternalId: 'module:2600014',
        gradeLabel: '1,7',
        gradeValue: 1.7,
        examDate: '2026-02-12',
      }),
    ]);
    expect(payload.exams).toEqual([
      expect.objectContaining({
        moduleExternalId: 'module:2530575',
        title: 'Investments SS2025',
        location: 'Ulrich, WIWI',
        allDay: false,
      }),
    ]);
  });

  it('parses exported campus academic payloads for manual import', () => {
    const raw = JSON.stringify({
      exportType: KIT_CAMPUS_ACADEMIC_EXPORT_TYPE,
      exportVersion: 1,
      generatedAt: '2026-03-29T18:30:00.000Z',
      sourceUrl: 'https://campus.studium.kit.edu/reports/index.php',
      modules: [
        {
          externalId: 'module:2530575',
          moduleCode: '2530575',
          title: 'Investments SS2025',
          status: 'active',
          semesterLabel: 'SS 2025',
          credits: 6,
          sourceUpdatedAt: null,
        },
      ],
      grades: [],
      exams: [],
    });

    const parsed = parseCampusAcademicExport(raw);
    expect(parsed.modules[0]?.title).toBe('Investments SS2025');
    expect(parsed.grades).toEqual([]);
    expect(parsed.exams).toEqual([]);
  });
});
