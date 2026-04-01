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

const campusNestedContractHtml = `
  <main>
    <table>
      <tbody>
        <tr>
          <td>
            <table>
              <tbody>
                <tr><td>nested noise</td></tr>
              </tbody>
            </table>
          </td>
          <td>T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie</td>
          <td>PF</td>
          <td></td>
          <td>4,0</td>
          <td>22.02.2024</td>
          <td>5,0</td>
          <td>5,0</td>
        </tr>
      </tbody>
    </table>
  </main>
`;

const campusContractViewTextFallback = `
Studiengangsdetails (2464504)
Persönlicher Studienablaufplan
Titel (mit Kennung)\tArt\tStatus\tNote\tDatum\tIst-LP\tSoll-LP
82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015\t\t\t2,7 1\t12.03.2026\t101,0\t180,0
T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie\tPF\t\t4,0\t22.02.2024\t5,0\t5,0
T-WIWI-102737 – Statistik I\tPF\t\t2,0\t27.07.2024\t5,0\t5,0
M-MATH-105754 – Mathematik 1\tPF\t\t3,8\t12.03.2026\t10,0\t10,0
Bitte beachten Sie:
Art: PF Pflicht
`;

const campusContractViewCompactTextFallback = `
Studiengangsdetails (2464504)
Persönlicher Studienablaufplan
Titel (mit Kennung)
T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie PF 4,0 22.02.2024 5,0 5,0
Berufspraktikum PF be 09.04.2025 10,0 10,0
M-MATH-105754 – Mathematik 1 PF 3,8 12.03.2026 10,0 10,0
Bitte beachten Sie:
Art: PF Pflicht
`;

const campusContractViewExactUserTextFallback = `
Studiengangsdetails (2464504)
Neue Leistungsbescheinigung erstellen
Drucken
82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015
Studienablaufplan
Leistungsübersicht
ÜQ/SQ-Leistungen
Mögliche Prüfungen
Dokumentenarchiv
Startdatum:
01.10.2023
Hochschulsemester:
8
Fachsemester:
6
Urlaubssemester:
0
Studienphase:
im aktiven Studium
Teilleistungen
noch nicht begonnen
begonnen
bestanden
endgültig nicht bestanden
Filter anwenden
Persönlicher Studienablaufplan
Do, Viet Duc (2464504)
Module
Teilleistungen
Titel (mit Kennung) Art Status Note Datum Ist-LP Soll-LP
82-179-H-2015 – Wirtschaftsingenieurwesen Bachelor 2015    2,7 1 12.03.2026 101,0 180,0
Orientierungsprüfung PF   be 27.07.2024 0,0 0,0
M-WIWI-100950 – Orientierungsprüfung PF   be 27.07.2024 0,0 0,0
T-WIWI-102708 – Volkswirtschaftslehre I: Mikroökonomie PF   4,0 22.02.2024 5,0 5,0
T-WIWI-102737 – Statistik I PF   2,0 27.07.2024 5,0 5,0
Bachelorarbeit PF     0,0 12,0
M-WIWI-101601 – Bachelorarbeit PF     0,0 12,0
T-WIWI-103067 – Bachelorarbeit PF     0,0 12,0
Berufspraktikum PF   be 09.04.2025 10,0 10,0
M-WIWI-101419 – Berufspraktikum PF   be 09.04.2025 10,0 10,0
T-WIWI-102611 – Berufspraktikum PF   be 09.04.2025 10,0 10,0
Betriebswirtschaftslehre ab 01.10.2021 Module wählen PF   2,6 1 11.08.2025 19,5 24,0
M-WIWI-105768 – Management und Marketing PF   2,7 24.05.2025 5,0 5,0
T-WIWI-111594 – Management und Marketing PF   2,7 24.05.2025 5,0 5,0
M-WIWI-105769 – Finanzierung und Rechnungswesen PF   2,0 20.08.2024 5,0 5,0
T-WIWI-112820 – Grundlagen Finanzierung und Rechnungswesen: Finanzierung und Rechnungswesen PF   2,0 20.08.2024 5,0 5,0
M-WIWI-105770 – Produktion, Logistik und Wirtschaftsinformatik PF   4,0 28.02.2024 5,0 5,0
T-WIWI-111602 – Produktion, Logistik und Wirtschaftsinformatik PF   4,0 28.02.2024 5,0 5,0
M-WIWI-101435 – Essentials of Finance WP   2,3 1 11.08.2025 4,5 9,0
T-WIWI-102605 – Financial Management PF   2,3 11.08.2025 4,5 4,5
T-WIWI-102604 – Investments PF     0,0 4,5
Informatik Module wählen PF   2,1 1 06.08.2025 19,0 24,0
M-WIWI-101417 – Grundlagen der Informatik PF   2,0 1 30.07.2024 5,0 10,0
T-WIWI-102749 – Grundlagen der Informatik I: Grundlagen der Informatik I (Anmeldung verlängert bis 21.07.2024) PF   2,0 30.07.2024 5,0 5,0
T-WIWI-102707 – Grundlagen der Informatik II: Grundlagen der Informatik II (deutschsprachige Klausur, Anmeldefrist verlängert bis 16.02. – Nachmeldung nur auf Warteliste ohne Platzgarantie) PF   (3,7) 24.02.2026 0,0 5,0
M-WIWI-101581 – Einführung in die Programmierung PF   3,7 09.02.2024 5,0 5,0
T-WIWI-102735 – Programmieren I: Java PF   3,7 09.02.2024 5,0 5,0
Mathematik ab 01.10.2021 PF   3,5 12.03.2026 21,0 21,0
M-MATH-105754 – Mathematik 1 PF   3,8 12.03.2026 10,0 10,0
T-MATH-111492 – Mathematik 1 - Semesterklausur: Mathematik 1 - Semesterklausur (nach neuer Struktur) PF   3,7 11.01.2024 5,0 5,0
T-MATH-111493 – Mathematik 1 - Abschlussklausur: Mathematik 1 - Abschlussklausur (nach neuer Struktur) PF   4,0 12.03.2026 5,0 5,0
Bitte beachten Sie:
Art: PF Pflicht, PI Pflicht individuell, WP Wahlpflicht, FW Freiwillig
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

  it('ignores nested table cells when reading contractview rows', () => {
    const doc = new DOMParser().parseFromString(campusNestedContractHtml, 'text/html');
    const payload = buildCampusAcademicExport(doc, 'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp');

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:102708',
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
          credits: 5,
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
      ])
    );
  });

  it('recurses through nested frame documents and still finds academic tables', () => {
    const outerDoc = new DOMParser().parseFromString('<main><iframe id="level-1"></iframe></main>', 'text/html');
    const middleDoc = new DOMParser().parseFromString('<main><iframe id="level-2"></iframe></main>', 'text/html');
    const innerDoc = new DOMParser().parseFromString(campusContractViewRealisticHtml, 'text/html');

    const levelOne = outerDoc.getElementById('level-1');
    const levelTwo = middleDoc.getElementById('level-2');

    expect(levelOne).toBeTruthy();
    expect(levelTwo).toBeTruthy();

    Object.defineProperty(levelOne, 'contentDocument', {
      configurable: true,
      get: () => middleDoc,
    });
    Object.defineProperty(levelTwo, 'contentDocument', {
      configurable: true,
      get: () => innerDoc,
    });

    const payload = buildCampusAcademicExport(
      outerDoc,
      'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp'
    );

    expect(payload.modules.some((module) => module.moduleCode === '102708')).toBe(true);
    expect(payload.grades.some((grade) => grade.moduleExternalId === 'module:102708')).toBe(true);
  });

  it('falls back to visible academic text when the page exposes no table elements', () => {
    const doc = new DOMParser().parseFromString('<main><section id="fallback"></section></main>', 'text/html');

    Object.defineProperty(doc.body, 'innerText', {
      configurable: true,
      get: () => campusContractViewTextFallback,
    });

    const payload = buildCampusAcademicExport(
      doc,
      'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp'
    );

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:102708',
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
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

  it('falls back to compact visible academic text without tab separators', () => {
    const doc = new DOMParser().parseFromString('<main><section id="fallback"></section></main>', 'text/html');

    Object.defineProperty(doc.body, 'innerText', {
      configurable: true,
      get: () => campusContractViewCompactTextFallback,
    });

    const payload = buildCampusAcademicExport(
      doc,
      'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp'
    );

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:102708',
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
          credits: 5,
          status: 'active',
        }),
        expect.objectContaining({
          title: 'Berufspraktikum',
          credits: 10,
          status: 'completed',
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
          gradeLabel: 'be',
          gradeValue: null,
          examDate: '2025-04-09',
        }),
      ])
    );
  });

  it('parses the exact compact Studiengangsdetails text shape from KIT contractview pages', () => {
    const doc = new DOMParser().parseFromString('<main><section id="fallback"></section></main>', 'text/html');

    Object.defineProperty(doc.body, 'innerText', {
      configurable: true,
      get: () => campusContractViewExactUserTextFallback,
    });

    const payload = buildCampusAcademicExport(
      doc,
      'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp'
    );

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:102708',
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
          credits: 5,
        }),
        expect.objectContaining({
          title: 'Berufspraktikum',
          status: 'completed',
          credits: 10,
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
          gradeLabel: 'be',
          gradeValue: null,
          examDate: '2025-04-09',
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

  it('falls back to collapsed document text when innerText is empty on contractview pages', () => {
    const doc = new DOMParser().parseFromString('<main><section id="fallback"></section></main>', 'text/html');
    const collapsed = campusContractViewExactUserTextFallback.replace(/\s+/g, ' ').trim();

    Object.defineProperty(doc.body, 'innerText', {
      configurable: true,
      get: () => '',
    });

    Object.defineProperty(doc.documentElement, 'textContent', {
      configurable: true,
      get: () => collapsed,
    });

    const payload = buildCampusAcademicExport(
      doc,
      'https://campus.studium.kit.edu/exams/registration.php#!campus/student/contractview.asp'
    );

    expect(payload.modules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          externalId: 'module:102708',
          title: 'Volkswirtschaftslehre I: Mikroökonomie',
          credits: 5,
        }),
        expect.objectContaining({
          title: 'Berufspraktikum',
          status: 'completed',
          credits: 10,
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
          gradeLabel: 'be',
          gradeValue: null,
          examDate: '2025-04-09',
        }),
        expect.objectContaining({
          moduleExternalId: 'module:105754',
          gradeLabel: '3,8',
          gradeValue: 3.8,
          examDate: '2026-03-12',
        }),
      ])
    );
    expect(payload.modules.some((module) => module.title === 'PF')).toBe(false);
    expect(
      payload.modules.some((module) => module.title.includes('Informatik Module wählen'))
    ).toBe(false);
  });
});
