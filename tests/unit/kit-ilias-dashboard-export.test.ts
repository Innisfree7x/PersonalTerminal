import { describe, expect, it } from 'vitest';
import {
  KIT_ILIAS_DASHBOARD_EXPORT_TYPE,
  buildIliasDashboardExport,
  extractIliasDashboardFavorites,
  parseIliasDashboardExport,
} from '@/lib/kit-sync/iliasDashboardExport';

const dashboardHtml = `
  <main>
    <aside>
      <a href="/dashboard">Dashboard</a>
      <a href="/support">Support</a>
    </aside>
    <section class="dashboard-block">
      <h2>Favoriten</h2>
      <div class="group">Bachelor</div>
      <div class="group">SS 2025</div>
      <div class="entry">
        <a href="/goto.php?target=crs_2530575">2530575 – Investments SS2025</a>
      </div>
      <div class="entry">
        <a href="/goto.php?target=crs_2600014">2600014 – Volkswirtschaftslehre II: Makroökonomie</a>
      </div>
      <div class="group">WS 2025</div>
      <div class="entry">
        <a href="/goto.php?ref_id=9911">Einführung in das Operations Research I</a>
      </div>
      <button>Abonnieren</button>
    </section>
  </main>
`;

describe('iliasDashboardExport helpers', () => {
  it('extracts dashboard favorites with semester context', () => {
    const doc = new DOMParser().parseFromString(dashboardHtml, 'text/html');
    const favorites = extractIliasDashboardFavorites(doc, 'https://ilias.studium.kit.edu/dashboard');

    expect(favorites).toHaveLength(3);
    expect(favorites[0]).toMatchObject({
      title: '2530575 – Investments SS2025',
      semesterLabel: 'SS 2025',
      courseUrl: 'https://ilias.studium.kit.edu/goto.php?target=crs_2530575',
    });
    expect(favorites[2]).toMatchObject({
      title: 'Einführung in das Operations Research I',
      semesterLabel: 'WS 2025',
      externalId: 'ref:9911',
    });
  });

  it('builds a stable export wrapper for the dashboard connector', () => {
    const doc = new DOMParser().parseFromString(dashboardHtml, 'text/html');
    const exportPayload = buildIliasDashboardExport(doc, 'https://ilias.studium.kit.edu/dashboard');

    expect(exportPayload.exportType).toBe(KIT_ILIAS_DASHBOARD_EXPORT_TYPE);
    expect(exportPayload.favorites).toHaveLength(3);
    expect(exportPayload.items).toEqual([]);
  });

  it('parses exported dashboard payloads for manual import', () => {
    const raw = JSON.stringify({
      exportType: KIT_ILIAS_DASHBOARD_EXPORT_TYPE,
      exportVersion: 1,
      generatedAt: '2026-03-29T18:30:00.000Z',
      sourceUrl: 'https://ilias.studium.kit.edu/dashboard',
      favorites: [
        {
          externalId: 'target:crs_2530575',
          title: '2530575 – Investments SS2025',
          semesterLabel: 'SS 2025',
          courseUrl: 'https://ilias.studium.kit.edu/goto.php?target=crs_2530575',
          sourceUpdatedAt: null,
        },
      ],
      items: [],
    });

    const parsed = parseIliasDashboardExport(raw);
    expect(parsed.favorites[0]?.title).toBe('2530575 – Investments SS2025');
    expect(parsed.items).toEqual([]);
  });
});
