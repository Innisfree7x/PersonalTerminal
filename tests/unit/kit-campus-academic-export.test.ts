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

const campusLegacyHtml = `
  <main>
    <section>
      <h2>Studiengangsdetails</h2>
      <table>
        <tbody>
          <tr>
            <td>Titel (mit Kennung)</td>
            <td>Art</td>
            <td>Status</td>
            <td>Note</td>
            <td>Datum</td>
            <td>Ist-LP</td>
            <td>Soll-LP</td>
          </tr>
          <tr>
            <td>82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>101,0</td>
            <td>180,0</td>
          </tr>
          <tr>
            <td>T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie</td>
            <td>PF</td>
            <td>bestanden</td>
            <td>4,0</td>
            <td>22.02.2024</td>
            <td>5,0</td>
            <td>5,0</td>
          </tr>
          <tr>
            <td>T-WIWI-102737 – Statistik I</td>
            <td>PF</td>
            <td>bestanden</td>
            <td>2,0</td>
            <td>27.07.2024</td>
            <td>5,0</td>
            <td>5,0</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
`;

const campusHeaderlessContractHtml = `
  <main>
    <section>
      <h2>Studiengangsdetails</h2>
      <table>
        <tbody>
          <tr>
            <td>82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>101,0</td>
            <td>180,0</td>
          </tr>
          <tr>
            <td>2530575 – Investments SS2025</td>
            <td>PF</td>
            <td>bestanden</td>
            <td>1,7</td>
            <td>12.03.2026</td>
            <td>6,0</td>
            <td>6,0</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
`;

const campusIndentedContractHtml = `
  <main>
    <section>
      <h2>Studiengangsdetails</h2>
      <table>
        <tbody>
          <tr>
            <td></td>
            <td>Titel (mit Kennung)</td>
            <td>Art</td>
            <td>Status</td>
            <td>Note</td>
            <td>Datum</td>
            <td>Ist-LP</td>
            <td>Soll-LP</td>
          </tr>
          <tr>
            <td></td>
            <td>82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>101,0</td>
            <td>180,0</td>
          </tr>
          <tr>
            <td></td>
            <td>T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie</td>
            <td>PF</td>
            <td>bestanden</td>
            <td>4,0</td>
            <td>22.02.2024</td>
            <td>5,0</td>
            <td>5,0</td>
          </tr>
          <tr>
            <td></td>
            <td>T-WIWI-102737 – Statistik I</td>
            <td>PF</td>
            <td>bestanden</td>
            <td>2,0</td>
            <td>27.07.2024</td>
            <td>5,0</td>
            <td>5,0</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
`;


const campusContractViewRealisticHtml = `
  <main>
    <section>
      <h2>Studiengangsdetails (2464504)</h2>
      <table>
        <tbody>
          <tr>
            <td></td>
            <td>Titel (mit Kennung)</td>
            <td>Art</td>
            <td>Status</td>
            <td>Note</td>
            <td>Datum</td>
            <td>Ist-LP</td>
            <td>Soll-LP</td>
          </tr>
          <tr>
            <td></td>
            <td>82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015</td>
            <td></td>
            <td></td>
            <td>2,7 1</td>
            <td>12.03.2026</td>
            <td>101,0</td>
            <td>180,0</td>
          </tr>
          <tr>
            <td></td>
            <td>Orientierungsprüfung</td>
            <td>PF</td>
            <td></td>
            <td>be</td>
            <td>27.07.2024</td>
            <td>0,0</td>
            <td>0,0</td>
          </tr>
          <tr>
            <td></td>
            <td>M-WIWI-100950 – Orientierungsprüfung</td>
            <td>PF</td>
            <td></td>
            <td>be</td>
            <td>27.07.2024</td>
            <td>0,0</td>
            <td>0,0</td>
          </tr>
          <tr>
            <td></td>
            <td>T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie</td>
            <td>PF</td>
            <td></td>
            <td>4,0</td>
            <td>22.02.2024</td>
            <td>5,0</td>
            <td>5,0</td>
          </tr>
          <tr>
            <td></td>
            <td>T-WIWI-102737 – Statistik I</td>
            <td>PF</td>
            <td></td>
            <td>2,0</td>
            <td>27.07.2024</td>
            <td>5,0</td>
            <td>5,0</td>
          </tr>
          <tr>
            <td></td>
            <td>M-MATH-105754 – Mathematik 1</td>
            <td>PF</td>
            <td></td>
            <td>3,8</td>
            <td>12.03.2026</td>
            <td>10,0</td>
            <td>10,0</td>
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

  it('extracts grades from legacy td-header CAMPUS tables', () => {
    const doc = new DOMParser().parseFromString(campusLegacyHtml, 'text/html');
    const payload = buildCampusAcademicExport(doc, 'https://campus.studium.kit.edu/campus/student/contractview.asp');

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
        }),
        expect.objectContaining({
          title: 'Statistik I',
        }),
      ])
    );
    expect(payload.grades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gradeLabel: '4,0',
          gradeValue: 4,
          examDate: '2024-02-22',
        }),
        expect.objectContaining({
          gradeLabel: '2,0',
          gradeValue: 2,
          examDate: '2024-07-27',
        }),
      ])
    );
  });

  it('extracts modules and grades from headerless contractview rows', () => {
    const doc = new DOMParser().parseFromString(campusHeaderlessContractHtml, 'text/html');
    const payload = buildCampusAcademicExport(doc, 'https://campus.studium.kit.edu/campus/student/contractview.asp');

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:2530575',
          title: 'Investments SS2025',
          status: 'completed',
          credits: 6,
        }),
      ])
    );
    expect(payload.modules).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Wirtschaftsingenieurwesen Bachelor 2015',
        }),
      ])
    );
    expect(payload.grades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleExternalId: 'module:2530575',
          gradeLabel: '1,7',
          gradeValue: 1.7,
          examDate: '2026-03-12',
        }),
      ])
    );
  });

  it('extracts grades when contractview tables have a leading blank expander column', () => {
    const doc = new DOMParser().parseFromString(campusIndentedContractHtml, 'text/html');
    const payload = buildCampusAcademicExport(doc, 'https://campus.studium.kit.edu/campus/student/contractview.asp');

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
          credits: 5,
          status: 'completed',
        }),
        expect.objectContaining({
          title: 'Statistik I',
          credits: 5,
          status: 'completed',
        }),
      ])
    );
    expect(payload.grades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          gradeLabel: '4,0',
          gradeValue: 4,
          examDate: '2024-02-22',
        }),
        expect.objectContaining({
          gradeLabel: '2,0',
          gradeValue: 2,
          examDate: '2024-07-27',
        }),
      ])
    );
  });

  it('extracts realistic contractview rows from Studiengangsdetails with leading blank cells', () => {
    const doc = new DOMParser().parseFromString(campusContractViewRealisticHtml, 'text/html');
    const payload = buildCampusAcademicExport(doc, 'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp');

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:102708',
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
          credits: 5,
        }),
        expect.objectContaining({
          externalId: 'module:102737',
          title: 'Statistik I',
          credits: 5,
        }),
        expect.objectContaining({
          externalId: 'module:105754',
          title: 'Mathematik 1',
          credits: 10,
        }),
      ])
    );
    expect(payload.grades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleExternalId: 'module:102708',
          gradeLabel: '4,0',
          gradeValue: 4,
          examDate: '2024-02-22',
        }),
        expect.objectContaining({
          moduleExternalId: 'module:105754',
          gradeLabel: '3,8',
          gradeValue: 3.8,
          examDate: '2026-03-12',
        }),
      ])
    );
  });
});
