import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiErrors } from '@/lib/api/errors';
import { createAdminClient } from '@/lib/auth/admin';
import type { Database } from '@/lib/supabase/types';
import { decryptKitSecret, encryptKitSecret } from '@/lib/kit-sync/crypto';
import {
  fetchCampusWebcalDocument,
  maskCampusWebcalUrl,
  normalizeCampusWebcalUrl,
  parseCampusWebcalEvents,
} from '@/lib/kit-sync/webcal';

export interface KitSyncStatusPayload {
  campusWebcalConfigured: boolean;
  campusWebcalMaskedUrl: string | null;
  campusWebcalCalendarName: string | null;
  campusWebcalLastValidatedAt: string | null;
  campusWebcalLastSyncedAt: string | null;
  campusWebcalLastError: string | null;
  totalCampusEvents: number;
  nextCampusEvent: { title: string; startsAt: string; kind: string } | null;
  lastRun: {
    source: string;
    trigger: string;
    status: string;
    itemsRead: number;
    itemsWritten: number;
    finishedAt: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  } | null;
}

type AdminClient = SupabaseClient<Database>;

type KitSyncProfileRow = Database['public']['Tables']['kit_sync_profiles']['Row'];

function admin(): AdminClient {
  return createAdminClient() as AdminClient;
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

async function insertSyncRun(input: {
  userId: string;
  source: 'campus_webcal';
  trigger: 'manual' | 'cron';
  status: 'running' | 'success' | 'partial' | 'failed';
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

export async function getKitSyncStatus(userId: string): Promise<KitSyncStatusPayload> {
  const profile = await findProfileForUser(userId);

  const [{ count: eventCount, error: eventCountError }, { data: nextEvent, error: nextEventError }, { data: lastRun, error: lastRunError }] = await Promise.all([
    admin().from('kit_campus_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin()
      .from('kit_campus_events')
      .select('title, starts_at, kind')
      .eq('user_id', userId)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin()
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
  if (nextEventError) {
    throw ApiErrors.internal(`Nächstes KIT Event konnte nicht geladen werden: ${nextEventError.message}`);
  }
  if (lastRunError) {
    throw ApiErrors.internal(`Letzter KIT Sync Run konnte nicht geladen werden: ${lastRunError.message}`);
  }

  return {
    campusWebcalConfigured: Boolean(profile?.campus_webcal_url_encrypted),
    campusWebcalMaskedUrl: profile?.campus_webcal_url_masked ?? null,
    campusWebcalCalendarName: profile?.campus_webcal_calendar_name ?? null,
    campusWebcalLastValidatedAt: profile?.campus_webcal_last_validated_at ?? null,
    campusWebcalLastSyncedAt: profile?.campus_webcal_last_synced_at ?? null,
    campusWebcalLastError: profile?.campus_webcal_last_error ?? null,
    totalCampusEvents: eventCount ?? 0,
    nextCampusEvent: nextEvent
      ? {
          title: nextEvent.title,
          startsAt: nextEvent.starts_at,
          kind: nextEvent.kind,
        }
      : null,
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
