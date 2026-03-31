import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrors } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/auth/admin';
import { createEmptyKitSyncStatus, type KitSyncStatus } from '@/lib/kit-sync/types';
import type { Database } from '@/lib/supabase/types';
import { decryptKitSecret, encryptKitSecret } from '@/lib/kit-sync/crypto';
import {
  buildCampusExamEventUpsertRows,
  buildCampusGradeUpsertRows,
  buildCampusModuleUpsertRows,
  normalizeCampusConnectorPayload,
} from '@/lib/kit-sync/campusConnector';
import {
  buildIliasFavoriteUpsertRows,
  buildIliasItemUpsertRows,
  normalizeIliasConnectorPayload,
} from '@/lib/kit-sync/iliasConnector';
import { KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION } from '@/lib/kit-sync/iliasDashboardExport';
import type {
  CampusConnectorPayloadInput,
  IliasConnectorPayloadInput,
  KitSyncResetScope,
} from '@/lib/schemas/kit-sync.schema';
import {
  fetchCampusWebcalDocument,
  maskCampusWebcalUrl,
  normalizeCampusWebcalUrl,
  parseCampusWebcalEvents,
} from '@/lib/kit-sync/webcal';

type AdminClient = SupabaseClient<Database>;

type KitSyncProfileRow = Database['public']['Tables']['kit_sync_profiles']['Row'];
type KitSyncRunSource = Database['public']['Tables']['kit_sync_runs']['Row']['source'];
type KitSyncRunTrigger = Database['public']['Tables']['kit_sync_runs']['Row']['trigger'];
type KitSyncRunStatus = Database['public']['Tables']['kit_sync_runs']['Row']['status'];
type ResettableKitTable =
  | 'kit_campus_events'
  | 'kit_campus_modules'
  | 'kit_campus_grades'
  | 'kit_ilias_favorites'
  | 'kit_ilias_items';

let adminClient: AdminClient | null = null;

function admin(): AdminClient {
  if (!adminClient) {
    adminClient = createAdminClient() as AdminClient;
  }
  return adminClient;
}

function formatSyncError(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    const maybeApi = error as Error & { code?: string };
    return {
      code: maybeApi.code ?? 'SYNC_FAILED',
      message: error.message,
    };
  }

  return {
    code: 'SYNC_FAILED',
    message: 'Unbekannter KIT-Sync-Fehler.',
  };
}

function isMissingRelationError(error: { code?: string } | null | undefined) {
  return error?.code === '42P01' || error?.code === '42703';
}

async function findProfileForUser(userId: string): Promise<KitSyncProfileRow | null> {
  const { data, error } = await admin()
    .from('kit_sync_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw ApiErrors.internal(`KIT Sync Profil konnte nicht geladen werden: ${error.message}`);
  }

  return data;
}

async function ensureProfileForUser(userId: string, connectorVersion?: string | null): Promise<KitSyncProfileRow> {
  const existing = await findProfileForUser(userId);
  if (existing) {
    if (connectorVersion && existing.connector_version !== connectorVersion) {
      const { data, error } = await admin()
        .from('kit_sync_profiles')
        .update({ connector_version: connectorVersion })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) {
        throw ApiErrors.internal(`KIT Sync Profil konnte nicht aktualisiert werden: ${error.message}`);
      }

      return data;
    }

    return existing;
  }

  const { data, error } = await admin()
    .from('kit_sync_profiles')
    .insert({
      user_id: userId,
      connector_version: connectorVersion ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw ApiErrors.internal(`KIT Sync Profil konnte nicht angelegt werden: ${error.message}`);
  }

  return data;
}

async function insertSyncRun(input: {
  userId: string;
  source: KitSyncRunSource;
  trigger: KitSyncRunTrigger;
  status: KitSyncRunStatus;
  connectorVersion?: string | null;
}): Promise<string> {
  const { data, error } = await admin()
    .from('kit_sync_runs')
    .insert({
      user_id: input.userId,
      source: input.source,
      trigger: input.trigger,
      status: input.status,
      connector_version: input.connectorVersion ?? null,
      items_read: 0,
      items_written: 0,
      started_at: new Date().toISOString(),
      finished_at: input.status === 'running' ? null : new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw ApiErrors.internal(`KIT Sync Run konnte nicht angelegt werden: ${error.message}`);
  }

  return data.id;
}

async function finalizeSyncRun(runId: string, input: {
  status: 'success' | 'partial' | 'failed';
  itemsRead: number;
  itemsWritten: number;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const { error } = await admin()
    .from('kit_sync_runs')
    .update({
      status: input.status,
      items_read: input.itemsRead,
      items_written: input.itemsWritten,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId);

  if (error) {
    throw ApiErrors.internal(`KIT Sync Run konnte nicht aktualisiert werden: ${error.message}`);
  }
}

export async function getKitSyncStatus(userId: string): Promise<KitSyncStatus> {
  const profile = await findProfileForUser(userId);
  if (!profile) {
    return createEmptyKitSyncStatus();
  }

  const client = admin();
  const freshIliasThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [
    { count: eventCount, error: eventCountError },
    { count: moduleCount, error: moduleCountError },
    { count: gradeCount, error: gradeCountError },
    { data: nextEvent, error: nextEventError },
    { data: nextExam, error: nextExamError },
    { data: latestGrade, error: latestGradeError },
    { data: gradesWithModules },
    iliasFavoritesResult,
    iliasItemsResult,
    iliasFreshResult,
    iliasLatestItemResult,
    iliasFreshPreviewResult,
    iliasPreviewResult,
    { data: lastRun, error: lastRunError },
  ] = await Promise.all([
    client.from('kit_campus_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client.from('kit_campus_modules').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client.from('kit_campus_grades').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client
      .from('kit_campus_events')
      .select('title, starts_at, kind')
      .eq('user_id', userId)
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    client
      .from('kit_campus_events')
      .select('title, starts_at, location')
      .eq('user_id', userId)
      .eq('kind', 'exam')
      .gte('starts_at', nowIso)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    client
      .from('kit_campus_grades')
      .select('module_id, grade_label, published_at')
      .eq('user_id', userId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('kit_campus_grades')
      .select('grade_value, grade_label, exam_date, module_id, kit_campus_modules!inner(title, module_code, credits, status)')
      .eq('user_id', userId)
      .not('grade_value', 'is', null)
      .order('exam_date', { ascending: false, nullsFirst: false }),
    client.from('kit_ilias_favorites').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client.from('kit_ilias_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    client
      .from('kit_ilias_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('acknowledged_at', null)
      .gte('first_seen_at', freshIliasThreshold),
    client
      .from('kit_ilias_items')
      .select('title, item_type, published_at, item_url, favorite_id')
      .eq('user_id', userId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('first_seen_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from('kit_ilias_items')
      .select('id, title, item_type, published_at, item_url, first_seen_at, favorite_id')
      .eq('user_id', userId)
      .is('acknowledged_at', null)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('first_seen_at', { ascending: false })
      .limit(5),
    client
      .from('kit_ilias_favorites')
      .select('id, title, semester_label, course_url')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    client
      .from('kit_sync_runs')
      .select('source, trigger, status, items_read, items_written, finished_at, error_code, error_message')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (eventCountError) {
    throw ApiErrors.internal(`KIT Events konnten nicht gezählt werden: ${eventCountError.message}`);
  }
  if (moduleCountError) {
    throw ApiErrors.internal(`KIT Module konnten nicht gezählt werden: ${moduleCountError.message}`);
  }
  if (gradeCountError) {
    throw ApiErrors.internal(`KIT Noten konnten nicht gezählt werden: ${gradeCountError.message}`);
  }
  if (nextEventError) {
    throw ApiErrors.internal(`Nächstes KIT Event konnte nicht geladen werden: ${nextEventError.message}`);
  }
  if (nextExamError) {
    throw ApiErrors.internal(`Nächste KIT Prüfung konnte nicht geladen werden: ${nextExamError.message}`);
  }
  if (latestGradeError) {
    throw ApiErrors.internal(`Letzte KIT Note konnte nicht geladen werden: ${latestGradeError.message}`);
  }
  if (iliasFavoritesResult.error && !isMissingRelationError(iliasFavoritesResult.error)) {
    throw ApiErrors.internal(`ILIAS Favoriten konnten nicht gezählt werden: ${iliasFavoritesResult.error.message}`);
  }
  if (iliasItemsResult.error && !isMissingRelationError(iliasItemsResult.error)) {
    throw ApiErrors.internal(`ILIAS Items konnten nicht gezählt werden: ${iliasItemsResult.error.message}`);
  }
  if (iliasFreshResult.error && !isMissingRelationError(iliasFreshResult.error)) {
    throw ApiErrors.internal(`Neue ILIAS Items konnten nicht gezählt werden: ${iliasFreshResult.error.message}`);
  }
  if (iliasLatestItemResult.error && !isMissingRelationError(iliasLatestItemResult.error)) {
    throw ApiErrors.internal(`Letztes ILIAS Item konnte nicht geladen werden: ${iliasLatestItemResult.error.message}`);
  }
  if (iliasFreshPreviewResult.error && !isMissingRelationError(iliasFreshPreviewResult.error)) {
    throw ApiErrors.internal(`Neue ILIAS Items konnten nicht geladen werden: ${iliasFreshPreviewResult.error.message}`);
  }
  if (iliasPreviewResult.error && !isMissingRelationError(iliasPreviewResult.error)) {
    throw ApiErrors.internal(`ILIAS Favoriten-Preview konnte nicht geladen werden: ${iliasPreviewResult.error.message}`);
  }
  if (lastRunError) {
    throw ApiErrors.internal(`Letzter KIT Sync Run konnte nicht geladen werden: ${lastRunError.message}`);
  }

  let latestGradeModuleTitle: string | null = null;
  if (latestGrade?.module_id) {
    const { data: moduleRow, error: moduleError } = await client
      .from('kit_campus_modules')
      .select('title')
      .eq('id', latestGrade.module_id)
      .maybeSingle();

    if (moduleError) {
      throw ApiErrors.internal(`Modultitel für letzte KIT Note konnte nicht geladen werden: ${moduleError.message}`);
    }

    latestGradeModuleTitle = moduleRow?.title ?? null;
  }

  // Build graded modules list and compute average
  const modulesWithGrades: KitSyncStatus['campusModulesWithGrades'] = (gradesWithModules ?? [])
    .map((row) => {
      const mod = row.kit_campus_modules as unknown as { title: string; module_code: string | null; credits: number | null; status: string };
      return {
        moduleTitle: mod.title,
        moduleCode: mod.module_code,
        credits: mod.credits,
        gradeValue: row.grade_value,
        gradeLabel: row.grade_label,
        examDate: row.exam_date,
        status: mod.status,
      };
    })
    // Clean "Module wählen" suffix from category titles (e.g. "Operations Research Module wählen" → "Operations Research")
    .map((m) => ({
      ...m,
      moduleTitle: m.moduleTitle.replace(/\s*Module wählen$/i, '').trim(),
    }))
    // Clean gradeLabel: strip trailing attempt number (e.g. "3,0 1" → "3,0")
    .map((m) => ({
      ...m,
      gradeLabel: m.gradeLabel.replace(/\s+\d+$/, ''),
    }));

  const numericGrades = modulesWithGrades.filter((m) => m.gradeValue !== null).map((m) => m.gradeValue as number);
  const gradeAverage = numericGrades.length > 0
    ? Math.round((numericGrades.reduce((sum, g) => sum + g, 0) / numericGrades.length) * 100) / 100
    : null;

  let latestIliasFavoriteTitle: string | null = null;
  if (iliasLatestItemResult.data?.favorite_id && !isMissingRelationError(iliasLatestItemResult.error)) {
    const { data: favoriteRow, error: favoriteError } = await client
      .from('kit_ilias_favorites')
      .select('title')
      .eq('id', iliasLatestItemResult.data.favorite_id)
      .maybeSingle();

    if (favoriteError && !isMissingRelationError(favoriteError)) {
      throw ApiErrors.internal(`Favoritentitel für letztes ILIAS Item konnte nicht geladen werden: ${favoriteError.message}`);
    }

    latestIliasFavoriteTitle = favoriteRow?.title ?? null;
  }

  const freshFavoriteIds = Array.from(
    new Set((iliasFreshPreviewResult.data ?? []).map((item) => item.favorite_id).filter(Boolean))
  );
  const favoriteTitleById = new Map<string, string>();

  if (freshFavoriteIds.length > 0) {
    const { data: favoriteRows, error: favoriteTitlesError } = await client
      .from('kit_ilias_favorites')
      .select('id, title')
      .in('id', freshFavoriteIds);

    if (favoriteTitlesError && !isMissingRelationError(favoriteTitlesError)) {
      throw ApiErrors.internal(`Favoritentitel für neue ILIAS Items konnten nicht geladen werden: ${favoriteTitlesError.message}`);
    }

    for (const favorite of favoriteRows ?? []) {
      favoriteTitleById.set(favorite.id, favorite.title);
    }
  }

  return {
    campusWebcalConfigured: Boolean(profile?.campus_webcal_url_encrypted),
    campusWebcalMaskedUrl: profile?.campus_webcal_url_masked ?? null,
    campusWebcalCalendarName: profile?.campus_webcal_calendar_name ?? null,
    campusWebcalLastValidatedAt: profile?.campus_webcal_last_validated_at ?? null,
    campusWebcalLastSyncedAt: profile?.campus_webcal_last_synced_at ?? null,
    campusWebcalLastError: profile?.campus_webcal_last_error ?? null,
    connectorVersion: profile?.connector_version ?? null,
    totalCampusEvents: eventCount ?? 0,
    totalCampusModules: moduleCount ?? 0,
    totalCampusGrades: gradeCount ?? 0,
    totalIliasFavorites: iliasFavoritesResult.count ?? 0,
    totalIliasItems: iliasItemsResult.count ?? 0,
    freshIliasItems: iliasFreshResult.count ?? 0,
    nextCampusEvent: nextEvent
      ? {
          title: nextEvent.title,
          startsAt: nextEvent.starts_at,
          kind: nextEvent.kind,
        }
      : null,
    nextCampusExam: nextExam
      ? {
          title: nextExam.title,
          startsAt: nextExam.starts_at,
          location: nextExam.location,
        }
      : null,
    latestCampusGrade:
      latestGrade && latestGradeModuleTitle
        ? {
            moduleTitle: latestGradeModuleTitle,
            gradeLabel: latestGrade.grade_label,
            publishedAt: latestGrade.published_at,
          }
        : null,
    campusGradeAverage: gradeAverage,
    campusGradedModuleCount: numericGrades.length,
    campusModulesWithGrades: modulesWithGrades,
    latestIliasItem:
      iliasLatestItemResult.data && latestIliasFavoriteTitle
        ? {
            favoriteTitle: latestIliasFavoriteTitle,
            title: iliasLatestItemResult.data.title,
            itemType: iliasLatestItemResult.data.item_type,
            publishedAt: iliasLatestItemResult.data.published_at,
            itemUrl: iliasLatestItemResult.data.item_url,
          }
        : null,
    freshIliasPreview: (iliasFreshPreviewResult.data ?? [])
      .map((item) => ({
        id: item.id,
        favoriteTitle: favoriteTitleById.get(item.favorite_id) ?? 'ILIAS Kurs',
        title: item.title,
        itemType: item.item_type,
        publishedAt: item.published_at,
        itemUrl: item.item_url,
        firstSeenAt: item.first_seen_at,
      }))
      .filter((item) => Boolean(item.favoriteTitle)),
    iliasFavoritePreview: (iliasPreviewResult.data ?? []).map((favorite) => ({
      id: favorite.id,
      title: favorite.title,
      semesterLabel: favorite.semester_label,
      courseUrl: favorite.course_url,
    })),
    lastRun: lastRun
      ? {
          source: lastRun.source,
          trigger: lastRun.trigger,
          status: lastRun.status,
          itemsRead: lastRun.items_read,
          itemsWritten: lastRun.items_written,
          finishedAt: lastRun.finished_at,
          errorCode: lastRun.error_code,
          errorMessage: lastRun.error_message,
        }
      : null,
  };
}

export async function acknowledgeIliasItemsForUser(userId: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) {
    return {
      acknowledgedCount: 0,
      nextStatus: await getKitSyncStatus(userId),
    };
  }

  const { data, error } = await admin()
    .from('kit_ilias_items')
    .update({
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .in('id', uniqueIds)
    .is('acknowledged_at', null)
    .select('id');

  if (error) {
    throw ApiErrors.internal(`ILIAS Items konnten nicht bestätigt werden: ${error.message}`);
  }

  return {
    acknowledgedCount: data?.length ?? 0,
    nextStatus: await getKitSyncStatus(userId),
  };
}

export async function removeIliasFavoriteForUser(userId: string, favoriteId: string) {
  const client = admin();

  const { data: favorite, error: favoriteError } = await client
    .from('kit_ilias_favorites')
    .select('id, title')
    .eq('user_id', userId)
    .eq('id', favoriteId)
    .maybeSingle();

  if (favoriteError) {
    throw ApiErrors.internal(`ILIAS Favorit konnte nicht geladen werden: ${favoriteError.message}`);
  }

  if (!favorite) {
    throw ApiErrors.notFound('ILIAS favorite', favoriteId);
  }

  const runId = await insertSyncRun({
    userId,
    source: 'ilias_connector',
    trigger: 'manual',
    status: 'running',
  });

  try {
    const deletedItems = await deleteRows(client, 'kit_ilias_items', [
      ['user_id', userId],
      ['favorite_id', favoriteId],
    ]);
    const deletedFavorites = await deleteRows(client, 'kit_ilias_favorites', [
      ['user_id', userId],
      ['id', favoriteId],
    ]);

    await finalizeSyncRun(runId, {
      status: 'success',
      itemsRead: 0,
      itemsWritten: 0,
    });

    return {
      removedFavoriteId: favoriteId,
      removedTitle: favorite.title,
      itemsDeleted: deletedItems + deletedFavorites,
      nextStatus: await getKitSyncStatus(userId),
    };
  } catch (error) {
    const normalizedError = formatSyncError(error);
    await finalizeSyncRun(runId, {
      status: 'failed',
      itemsRead: 0,
      itemsWritten: 0,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
    });
    throw error;
  }
}

export async function saveCampusWebcalForUser(userId: string, rawUrl: string) {
  const normalizedUrl = normalizeCampusWebcalUrl(rawUrl);
  const { rawIcs, calendarName } = await fetchCampusWebcalDocument(normalizedUrl);
  const encryptedUrl = encryptKitSecret(normalizedUrl);
  const maskedUrl = maskCampusWebcalUrl(normalizedUrl);
  const now = new Date().toISOString();
  const fingerprint = createHash('sha256').update(rawIcs).digest('hex');

  const { error } = await admin().from('kit_sync_profiles').upsert(
    {
      user_id: userId,
      campus_webcal_url_encrypted: encryptedUrl,
      campus_webcal_url_masked: maskedUrl,
      campus_webcal_calendar_name: calendarName,
      campus_webcal_last_validated_at: now,
      campus_webcal_last_error: null,
      campus_webcal_last_feed_fingerprint: fingerprint,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    throw ApiErrors.internal(`WebCal-URL konnte nicht gespeichert werden: ${error.message}`);
  }

  return {
    maskedUrl,
    calendarName,
    validatedAt: now,
  };
}

export async function syncCampusWebcalForUser(userId: string, trigger: 'manual' | 'cron' = 'manual') {
  const profile = await findProfileForUser(userId);
  if (!profile?.campus_webcal_url_encrypted) {
    throw ApiErrors.badRequest('Keine CAMPUS-WebCal-URL hinterlegt.');
  }

  const runId = await insertSyncRun({
    userId,
    source: 'campus_webcal',
    trigger,
    status: 'running',
    connectorVersion: profile.connector_version,
  });

  try {
    const url = decryptKitSecret(profile.campus_webcal_url_encrypted);
    const { rawIcs, calendarName } = await fetchCampusWebcalDocument(url);
    const parsedEvents = parseCampusWebcalEvents(rawIcs);

    const upsertRows = parsedEvents.map((event) => ({
      user_id: userId,
      profile_id: profile.id,
      external_id: event.externalId,
      source: 'campus_webcal' as const,
      title: event.title,
      description: event.description,
      location: event.location,
      starts_at: event.startsAt,
      ends_at: event.endsAt,
      all_day: event.allDay,
      kind: event.kind,
      source_updated_at: event.sourceUpdatedAt,
      content_hash: event.contentHash,
    }));

    if (upsertRows.length > 0) {
      const { error: upsertError } = await admin().from('kit_campus_events').upsert(upsertRows, {
        onConflict: 'user_id,external_id',
      });

      if (upsertError) {
        throw ApiErrors.internal(`KIT Events konnten nicht gespeichert werden: ${upsertError.message}`);
      }
    }

    const { error: profileError } = await admin()
      .from('kit_sync_profiles')
      .update({
        campus_webcal_calendar_name: calendarName,
        campus_webcal_last_validated_at: new Date().toISOString(),
        campus_webcal_last_synced_at: new Date().toISOString(),
        campus_webcal_last_error: null,
        campus_webcal_last_feed_fingerprint: createHash('sha256').update(rawIcs).digest('hex'),
      })
      .eq('id', profile.id);

    if (profileError) {
      throw ApiErrors.internal(`KIT Sync Profil konnte nach dem Sync nicht aktualisiert werden: ${profileError.message}`);
    }

    await finalizeSyncRun(runId, {
      status: 'success',
      itemsRead: parsedEvents.length,
      itemsWritten: upsertRows.length,
    });

    return {
      source: 'campus_webcal' as const,
      itemsRead: parsedEvents.length,
      itemsWritten: upsertRows.length,
      calendarName,
      nextStatus: await getKitSyncStatus(userId),
    };
  } catch (error) {
    const normalized = formatSyncError(error);

    await admin()
      .from('kit_sync_profiles')
      .update({ campus_webcal_last_error: normalized.message })
      .eq('id', profile.id);

    await finalizeSyncRun(runId, {
      status: 'failed',
      itemsRead: 0,
      itemsWritten: 0,
      errorCode: normalized.code,
      errorMessage: normalized.message,
    });

    throw error;
  }
}

export async function syncCampusConnectorSnapshotForUser(
  userId: string,
  input: {
    connectorVersion: string;
    payload: CampusConnectorPayloadInput;
  }
) {
  const normalized = normalizeCampusConnectorPayload(input.payload);
  const profile = await ensureProfileForUser(userId, input.connectorVersion);
  const runId = await insertSyncRun({
    userId,
    source: 'campus_connector',
    trigger: 'connector',
    status: 'running',
    connectorVersion: input.connectorVersion,
  });

  try {
    const moduleRows = buildCampusModuleUpsertRows(userId, normalized.modules);
    if (moduleRows.length > 0) {
      const { error: moduleUpsertError } = await admin().from('kit_campus_modules').upsert(moduleRows, {
        onConflict: 'user_id,external_id',
      });

      if (moduleUpsertError) {
        throw ApiErrors.internal(`KIT Module konnten nicht gespeichert werden: ${moduleUpsertError.message}`);
      }
    }

    const moduleExternalIds = normalized.referencedModuleExternalIds;
    const { data: moduleMappings, error: moduleMappingError } = await admin()
      .from('kit_campus_modules')
      .select('id, external_id')
      .eq('user_id', userId)
      .in('external_id', moduleExternalIds.length > 0 ? moduleExternalIds : ['__none__']);

    if (moduleMappingError) {
      throw ApiErrors.internal(`KIT Modulmappings konnten nicht geladen werden: ${moduleMappingError.message}`);
    }

    const moduleIdByExternalId = new Map((moduleMappings ?? []).map((row) => [row.external_id, row.id]));

    const validGrades = normalized.grades
      .map((grade) => {
        const moduleId = moduleIdByExternalId.get(grade.moduleExternalId);
        return moduleId ? { grade, moduleId } : null;
      })
      .filter(Boolean) as Array<{ grade: (typeof normalized.grades)[number]; moduleId: string }>;

    const validExams = normalized.exams.filter(
      (exam) => !exam.moduleExternalId || moduleIdByExternalId.has(exam.moduleExternalId)
    );

    const gradeRows = buildCampusGradeUpsertRows(userId, validGrades);
    if (gradeRows.length > 0) {
      const { error: gradeUpsertError } = await admin().from('kit_campus_grades').upsert(gradeRows, {
        onConflict: 'user_id,external_grade_id',
      });

      if (gradeUpsertError) {
        throw ApiErrors.internal(`KIT Noten konnten nicht gespeichert werden: ${gradeUpsertError.message}`);
      }
    }

    const examRows = buildCampusExamEventUpsertRows(userId, profile.id, validExams);
    if (examRows.length > 0) {
      const { error: examUpsertError } = await admin().from('kit_campus_events').upsert(examRows, {
        onConflict: 'user_id,external_id',
      });

      if (examUpsertError) {
        throw ApiErrors.internal(`KIT Prüfungen konnten nicht gespeichert werden: ${examUpsertError.message}`);
      }
    }

    const skippedGrades = normalized.grades.length - validGrades.length;
    const skippedExams = normalized.exams.length - validExams.length;
    const status: KitSyncRunStatus = skippedGrades > 0 || skippedExams > 0 ? 'partial' : 'success';

    const { error: profileError } = await admin()
      .from('kit_sync_profiles')
      .update({
        connector_version: input.connectorVersion,
      })
      .eq('id', profile.id);

    if (profileError) {
      throw ApiErrors.internal(`KIT Sync Profil konnte nach Connector-Sync nicht aktualisiert werden: ${profileError.message}`);
    }

    await finalizeSyncRun(runId, {
      status,
      itemsRead: normalized.itemsRead,
      itemsWritten: moduleRows.length + gradeRows.length + examRows.length,
      errorCode: status === 'partial' ? 'PARTIAL_REFERENCE_MISS' : null,
      errorMessage:
        status === 'partial'
          ? `${skippedGrades} Noten und ${skippedExams} Prüfungen wurden wegen fehlender Modulreferenzen übersprungen.`
          : null,
    });

    return {
      source: 'campus_connector' as const,
      itemsRead: normalized.itemsRead,
      itemsWritten: moduleRows.length + gradeRows.length + examRows.length,
      skippedGrades,
      skippedExams,
      nextStatus: await getKitSyncStatus(userId),
    };
  } catch (error) {
    const normalizedError = formatSyncError(error);
    await finalizeSyncRun(runId, {
      status: 'failed',
      itemsRead: normalized.itemsRead,
      itemsWritten: 0,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
    });
    throw error;
  }
}

export async function syncIliasConnectorSnapshotForUser(
  userId: string,
  input: {
    connectorVersion: string;
    payload: IliasConnectorPayloadInput;
  }
) {
  const normalized = normalizeIliasConnectorPayload(input.payload);
  const isDashboardSnapshot = input.connectorVersion === KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION;
  const profile = await ensureProfileForUser(userId, input.connectorVersion);
  const runId = await insertSyncRun({
    userId,
    source: 'ilias_connector',
    trigger: 'connector',
    status: 'running',
    connectorVersion: input.connectorVersion,
  });

  try {
    const syncTimestamp = new Date().toISOString();
    const favoriteRows = buildIliasFavoriteUpsertRows(userId, normalized.favorites);
    if (favoriteRows.length > 0) {
      const { error: favoriteUpsertError } = await admin().from('kit_ilias_favorites').upsert(favoriteRows, {
        onConflict: 'user_id,external_id',
      });

      if (favoriteUpsertError) {
        throw ApiErrors.internal(`ILIAS Favoriten konnten nicht gespeichert werden: ${favoriteUpsertError.message}`);
      }
    }

    if (isDashboardSnapshot) {
      const incomingExternalIds = new Set(normalized.favorites.map((favorite) => favorite.externalId));
      const { data: existingFavorites, error: existingFavoritesError } = await admin()
        .from('kit_ilias_favorites')
        .select('id, external_id')
        .eq('user_id', userId);

      if (existingFavoritesError) {
        throw ApiErrors.internal(`Bestehende ILIAS Favoriten konnten nicht geladen werden: ${existingFavoritesError.message}`);
      }

      const staleFavoriteIds = (existingFavorites ?? [])
        .filter((favorite) => !incomingExternalIds.has(favorite.external_id))
        .map((favorite) => favorite.id);

      if (staleFavoriteIds.length > 0) {
        const { data: deletedFavorites, error: staleFavoriteDeleteError } = await admin()
          .from('kit_ilias_favorites')
          .delete()
          .eq('user_id', userId)
          .in('id', staleFavoriteIds)
          .select('id');

        if (staleFavoriteDeleteError) {
          throw ApiErrors.internal(`Veraltete ILIAS Favoriten konnten nicht entfernt werden: ${staleFavoriteDeleteError.message}`);
        }

        void deletedFavorites;
      }
    }

    const favoriteExternalIds = normalized.referencedFavoriteExternalIds;
    const { data: favoriteMappings, error: favoriteMappingError } = await admin()
      .from('kit_ilias_favorites')
      .select('id, external_id')
      .eq('user_id', userId)
      .in('external_id', favoriteExternalIds.length > 0 ? favoriteExternalIds : ['__none__']);

    if (favoriteMappingError) {
      throw ApiErrors.internal(`ILIAS Favoriten-Mappings konnten nicht geladen werden: ${favoriteMappingError.message}`);
    }

    const favoriteIdByExternalId = new Map((favoriteMappings ?? []).map((row) => [row.external_id, row.id]));

    const validItems = normalized.items
      .map((item) => {
        const favoriteId = favoriteIdByExternalId.get(item.favoriteExternalId);
        return favoriteId ? { item, favoriteId } : null;
      })
      .filter(Boolean) as Array<{ item: (typeof normalized.items)[number]; favoriteId: string }>;

    const itemExternalIds = validItems.map(({ item }) => item.externalId);
    const { data: existingItems, error: existingItemsError } = await admin()
      .from('kit_ilias_items')
      .select('external_id, first_seen_at, acknowledged_at')
      .eq('user_id', userId)
      .in('external_id', itemExternalIds.length > 0 ? itemExternalIds : ['__none__']);

    if (existingItemsError && !isMissingRelationError(existingItemsError)) {
      throw ApiErrors.internal(`Bestehende ILIAS Items konnten nicht geladen werden: ${existingItemsError.message}`);
    }

    const existingStateByExternalId = new Map((existingItems ?? []).map((item) => [item.external_id, item]));
    const itemRows = buildIliasItemUpsertRows(userId, validItems, existingStateByExternalId, syncTimestamp);

    if (itemRows.length > 0) {
      const { error: itemUpsertError } = await admin().from('kit_ilias_items').upsert(itemRows, {
        onConflict: 'user_id,external_id',
      });

      if (itemUpsertError) {
        throw ApiErrors.internal(`ILIAS Items konnten nicht gespeichert werden: ${itemUpsertError.message}`);
      }
    }

    const skippedItems = normalized.items.length - validItems.length;
    const status: KitSyncRunStatus = skippedItems > 0 ? 'partial' : 'success';

    const { error: profileError } = await admin()
      .from('kit_sync_profiles')
      .update({
        connector_version: input.connectorVersion,
      })
      .eq('id', profile.id);

    if (profileError) {
      throw ApiErrors.internal(`KIT Sync Profil konnte nach ILIAS-Sync nicht aktualisiert werden: ${profileError.message}`);
    }

    await finalizeSyncRun(runId, {
      status,
      itemsRead: normalized.itemsRead,
      itemsWritten: favoriteRows.length + itemRows.length,
      errorCode: status === 'partial' ? 'PARTIAL_FAVORITE_REFERENCE_MISS' : null,
      errorMessage:
        status === 'partial'
          ? `${skippedItems} ILIAS-Items wurden wegen fehlender Favoritenreferenzen übersprungen.`
          : null,
    });

    return {
      source: 'ilias_connector' as const,
      itemsRead: normalized.itemsRead,
      itemsWritten: favoriteRows.length + itemRows.length,
      skippedItems,
      nextStatus: await getKitSyncStatus(userId),
    };
  } catch (error) {
    const normalizedError = formatSyncError(error);
    await finalizeSyncRun(runId, {
      status: 'failed',
      itemsRead: normalized.itemsRead,
      itemsWritten: 0,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
    });
    throw error;
  }
}

export async function syncAllCampusWebcalProfiles() {
  const { data: profiles, error } = await admin()
    .from('kit_sync_profiles')
    .select('user_id')
    .not('campus_webcal_url_encrypted', 'is', null);

  if (error) {
    throw ApiErrors.internal(`KIT Sync Profile konnten nicht geladen werden: ${error.message}`);
  }

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const profile of profiles ?? []) {
    processed += 1;
    try {
      await syncCampusWebcalForUser(profile.user_id, 'cron');
      succeeded += 1;
    } catch {
      failed += 1;
    }
  }

  return { processed, succeeded, failed };
}

async function deleteRows(client: AdminClient, table: ResettableKitTable, filters: Array<[column: string, value: string]>) {
  let query = client.from(table).delete().select('id');
  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error)) return 0;
    throw ApiErrors.internal(`${table} konnten nicht zurückgesetzt werden: ${error.message}`);
  }

  return data?.length ?? 0;
}

export async function resetKitSyncScopeForUser(userId: string, scope: KitSyncResetScope) {
  const client = admin();
  const runSource: KitSyncRunSource =
    scope === 'campus_webcal'
      ? 'campus_webcal'
      : scope === 'campus_connector'
        ? 'campus_connector'
        : 'ilias_connector';

  const runId = await insertSyncRun({
    userId,
    source: runSource,
    trigger: 'manual',
    status: 'running',
  });

  try {
    let itemsDeleted = 0;

    if (scope === 'campus_webcal') {
      itemsDeleted += await deleteRows(client, 'kit_campus_events', [
        ['user_id', userId],
        ['source', 'campus_webcal'],
      ]);
    }

    if (scope === 'campus_connector') {
      itemsDeleted += await deleteRows(client, 'kit_campus_events', [
        ['user_id', userId],
        ['source', 'campus_connector'],
      ]);
      itemsDeleted += await deleteRows(client, 'kit_campus_grades', [['user_id', userId]]);
      itemsDeleted += await deleteRows(client, 'kit_campus_modules', [['user_id', userId]]);
    }

    if (scope === 'ilias_items') {
      itemsDeleted += await deleteRows(client, 'kit_ilias_items', [['user_id', userId]]);
    }

    if (scope === 'ilias_dashboard') {
      const itemDeleteCount = await deleteRows(client, 'kit_ilias_items', [['user_id', userId]]);
      const favoriteDeleteCount = await deleteRows(client, 'kit_ilias_favorites', [['user_id', userId]]);
      itemsDeleted += itemDeleteCount + favoriteDeleteCount;
    }

    await finalizeSyncRun(runId, {
      status: 'success',
      itemsRead: 0,
      itemsWritten: 0,
    });

    return {
      scope,
      itemsDeleted,
      nextStatus: await getKitSyncStatus(userId),
    };
  } catch (error) {
    const normalizedError = formatSyncError(error);
    await finalizeSyncRun(runId, {
      status: 'failed',
      itemsRead: 0,
      itemsWritten: 0,
      errorCode: normalizedError.code,
      errorMessage: normalizedError.message,
    });
    throw error;
  }
}
