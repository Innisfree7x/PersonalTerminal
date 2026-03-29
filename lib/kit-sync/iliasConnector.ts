import type {
  IliasConnectorFavoriteInput,
  IliasConnectorItemInput,
  IliasConnectorPayloadInput,
} from '@/lib/schemas/kit-sync.schema';

type ExistingIliasItemState = {
  external_id: string;
  first_seen_at: string;
  acknowledged_at: string | null;
};

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeIliasConnectorPayload(payload: IliasConnectorPayloadInput) {
  const favorites = dedupeByKey(payload.favorites, (favorite) => favorite.externalId);
  const favoriteExternalIds = new Set(favorites.map((favorite) => favorite.externalId));

  const items = dedupeByKey(payload.items, (item) => item.externalId).filter((item) =>
    favoriteExternalIds.has(item.favoriteExternalId)
  );

  return {
    favorites,
    items,
    referencedFavoriteExternalIds: favorites.map((favorite) => favorite.externalId),
    itemsRead: payload.favorites.length + payload.items.length,
  };
}

export function buildIliasFavoriteUpsertRows(userId: string, favorites: IliasConnectorFavoriteInput[]) {
  return favorites.map((favorite) => ({
    user_id: userId,
    external_id: favorite.externalId,
    title: favorite.title,
    semester_label: favorite.semesterLabel ?? null,
    course_url: favorite.courseUrl ?? null,
    source_updated_at: favorite.sourceUpdatedAt ?? null,
  }));
}

export function buildIliasItemUpsertRows(
  userId: string,
  items: Array<{ item: IliasConnectorItemInput; favoriteId: string }>,
  existingStateByExternalId: Map<string, ExistingIliasItemState>,
  syncTimestamp: string
) {
  return items.map(({ item, favoriteId }) => {
    const existing = existingStateByExternalId.get(item.externalId);

    return {
      user_id: userId,
      favorite_id: favoriteId,
      external_id: item.externalId,
      item_type: item.itemType,
      title: item.title,
      item_url: item.itemUrl ?? null,
      summary: isNonEmptyString(item.summary) ? item.summary : null,
      published_at: item.publishedAt ?? null,
      source_updated_at: item.sourceUpdatedAt ?? null,
      first_seen_at: existing?.first_seen_at ?? syncTimestamp,
      last_seen_at: syncTimestamp,
      acknowledged_at: existing?.acknowledged_at ?? null,
    };
  });
}
