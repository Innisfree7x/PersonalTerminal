import { describe, expect, it } from 'vitest';
import {
  KIT_ILIAS_COURSE_EXPORT_TYPE,
  extractIliasCourseExport,
  parseIliasCourseExport,
} from '@/lib/kit-sync/iliasCourseExport';

const courseHtml = `
  <main>
    <h1>2530575 – Investments SS2025</h1>
    <article class="il-item">
      <a href="/goto.php?target=file_9001">Vorlesung 03 – Bewertungsmodelle.pdf</a>
      <div>Veröffentlicht 27.03.2026 09:15</div>
    </article>
    <article class="il-item">
      <a href="/goto.php?target=fold_17">Übungsblätter</a>
      <div>Ordner mit aktuellen Aufgaben</div>
    </article>
    <article class="il-item">
      <a href="https://example.com/zoom-link">Zoom Sprechstunde</a>
      <div>Ankündigung 28.03.2026 18:00</div>
    </article>
  </main>
`;

describe('iliasCourseExport helpers', () => {
  it('extracts a course payload with favorites and item metadata', () => {
    const doc = new DOMParser().parseFromString(courseHtml, 'text/html');
    const payload = extractIliasCourseExport(doc, 'https://ilias.studium.kit.edu/goto.php?target=crs_2530575');

    expect(payload.exportType).toBe(KIT_ILIAS_COURSE_EXPORT_TYPE);
    expect(payload.favorites).toEqual([
      expect.objectContaining({
        title: '2530575 – Investments SS2025',
        courseUrl: 'https://ilias.studium.kit.edu/goto.php?target=crs_2530575',
      }),
    ]);
    expect(payload.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Vorlesung 03 – Bewertungsmodelle.pdf',
          itemType: 'document',
        }),
        expect.objectContaining({
          title: 'Übungsblätter',
          itemType: 'folder',
        }),
        expect.objectContaining({
          title: 'Zoom Sprechstunde',
          itemType: 'announcement',
        }),
      ])
    );
  });

  it('parses exported course payloads for manual import', () => {
    const raw = JSON.stringify({
      exportType: KIT_ILIAS_COURSE_EXPORT_TYPE,
      exportVersion: 1,
      generatedAt: '2026-03-29T18:30:00.000Z',
      sourceUrl: 'https://ilias.studium.kit.edu/goto.php?target=crs_2530575',
      favorites: [
        {
          externalId: 'target:crs_2530575',
          title: '2530575 – Investments SS2025',
          semesterLabel: 'SS 2025',
          courseUrl: 'https://ilias.studium.kit.edu/goto.php?target=crs_2530575',
          sourceUpdatedAt: null,
        },
      ],
      items: [
        {
          externalId: 'target:crs_2530575:target:file_9001',
          favoriteExternalId: 'target:crs_2530575',
          title: 'Vorlesung 03 – Bewertungsmodelle.pdf',
          itemType: 'document',
          itemUrl: 'https://ilias.studium.kit.edu/goto.php?target=file_9001',
          summary: null,
          publishedAt: null,
          sourceUpdatedAt: null,
        },
      ],
    });

    const parsed = parseIliasCourseExport(raw);
    expect(parsed.items[0]?.itemType).toBe('document');
    expect(parsed.favorites[0]?.title).toBe('2530575 – Investments SS2025');
  });
});
