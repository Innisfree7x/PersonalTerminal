import { describe, expect, it } from 'vitest';
import {
  buildIliasFavoriteUpsertRows,
  buildIliasItemUpsertRows,
  normalizeIliasConnectorPayload,
} from '@/lib/kit-sync/iliasConnector';

describe('iliasConnector helpers', () => {
  it('dedupes favorites and drops items without known favorite refs', () => {
    const normalized = normalizeIliasConnectorPayload({
      favorites: [
        { externalId: 'fav-1', title: 'Investments SS2025' },
        { externalId: 'fav-1', title: 'Investments SS2025 duplicate' },
      ],
      items: [
        {
          externalId: 'item-1',
          favoriteExternalId: 'fav-1',
          title: 'Neue Datei',
          itemType: 'document',
        },
        {
          externalId: 'item-2',
          favoriteExternalId: 'missing-fav',
          title: 'Sollte rausfallen',
          itemType: 'announcement',
        },
      ],
    });

    expect(normalized.favorites).toHaveLength(1);
    expect(normalized.items).toHaveLength(1);
    expect(normalized.itemsRead).toBe(4);
  });

  it('builds ilias favorite rows for upsert', () => {
    const rows = buildIliasFavoriteUpsertRows('user-1', [
      {
        externalId: 'fav-1',
        title: 'Makroökonomie',
        semesterLabel: 'SS 2025',
        courseUrl: 'https://ilias.studium.kit.edu/course-1',
      },
    ]);

    expect(rows).toEqual([
      {
        user_id: 'user-1',
        external_id: 'fav-1',
        title: 'Makroökonomie',
        semester_label: 'SS 2025',
        course_url: 'https://ilias.studium.kit.edu/course-1',
        source_updated_at: null,
      },
    ]);
  });

  it('preserves first_seen_at and acknowledged_at for existing items', () => {
    const rows = buildIliasItemUpsertRows(
      'user-1',
      [
        {
          favoriteId: 'favorite-row-1',
          item: {
            externalId: 'item-1',
            favoriteExternalId: 'fav-1',
            title: 'Neue Ankündigung',
            itemType: 'announcement',
            summary: 'Klausurtermin verschoben',
          },
        },
      ],
      new Map([
        [
          'item-1',
          {
            external_id: 'item-1',
            first_seen_at: '2026-03-29T10:00:00.000Z',
            acknowledged_at: '2026-03-29T12:00:00.000Z',
          },
        ],
      ]),
      '2026-03-29T13:00:00.000Z'
    );

    expect(rows[0]).toMatchObject({
      user_id: 'user-1',
      favorite_id: 'favorite-row-1',
      external_id: 'item-1',
      item_type: 'announcement',
      first_seen_at: '2026-03-29T10:00:00.000Z',
      last_seen_at: '2026-03-29T13:00:00.000Z',
      acknowledged_at: '2026-03-29T12:00:00.000Z',
    });
  });
});
