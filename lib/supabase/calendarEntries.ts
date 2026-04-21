import type { SupabaseClient } from '@supabase/supabase-js';

export type CalendarEntryKind =
  | 'lecture'
  | 'exercise'
  | 'tutorial'
  | 'exam'
  | 'interview'
  | 'meeting'
  | 'deadline'
  | 'personal'
  | 'custom';

export type CalendarEntrySource = 'manual' | 'kit_webcal';

export interface CalendarEntry {
  id: string;
  source: CalendarEntrySource;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  kind: CalendarEntryKind;
}

export interface CreateCalendarEntryInput {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  allDay?: boolean;
  kind?: CalendarEntryKind;
}

export interface UpdateCalendarEntryInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string;
  allDay?: boolean;
  kind?: CalendarEntryKind;
}

function mapKitKindToCalendarKind(kitKind: string | null): CalendarEntryKind {
  switch (kitKind) {
    case 'lecture':
      return 'lecture';
    case 'exercise':
      return 'exercise';
    case 'exam':
      return 'exam';
    case 'deadline':
      return 'deadline';
    default:
      return 'custom';
  }
}

export async function listCalendarEntriesInRange(
  supabase: SupabaseClient,
  userId: string,
  fromIso: string,
  toIso: string
): Promise<CalendarEntry[]> {
  const [manualRes, kitRes] = await Promise.all([
    supabase
      .from('calendar_entries')
      .select('id, title, description, location, starts_at, ends_at, all_day, kind')
      .eq('user_id', userId)
      .gte('starts_at', fromIso)
      .lte('starts_at', toIso)
      .order('starts_at', { ascending: true }),
    supabase
      .from('kit_campus_events')
      .select('id, title, description, location, starts_at, ends_at, all_day, kind')
      .eq('user_id', userId)
      .gte('starts_at', fromIso)
      .lte('starts_at', toIso)
      .order('starts_at', { ascending: true }),
  ]);

  if (manualRes.error) {
    throw new Error(`Failed to fetch calendar entries: ${manualRes.error.message}`);
  }
  if (kitRes.error) {
    throw new Error(`Failed to fetch KIT events: ${kitRes.error.message}`);
  }

  const manual: CalendarEntry[] = (manualRes.data ?? []).map((row) => ({
    id: row.id,
    source: 'manual' as const,
    title: row.title,
    description: row.description ?? null,
    location: row.location ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day ?? false,
    kind: (row.kind as CalendarEntryKind) ?? 'custom',
  }));

  const kit: CalendarEntry[] = (kitRes.data ?? []).map((row) => ({
    id: row.id,
    source: 'kit_webcal' as const,
    title: row.title,
    description: row.description ?? null,
    location: row.location ?? null,
    startsAt: row.starts_at,
    endsAt: row.ends_at ?? row.starts_at,
    allDay: row.all_day ?? false,
    kind: mapKitKindToCalendarKind(row.kind),
  }));

  return [...manual, ...kit].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function createCalendarEntry(
  supabase: SupabaseClient,
  userId: string,
  input: CreateCalendarEntryInput
): Promise<CalendarEntry> {
  const { data, error } = await supabase
    .from('calendar_entries')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      all_day: input.allDay ?? false,
      kind: input.kind ?? 'custom',
    })
    .select('id, title, description, location, starts_at, ends_at, all_day, kind')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create calendar entry: ${error?.message ?? 'no data'}`);
  }

  return {
    id: data.id,
    source: 'manual',
    title: data.title,
    description: data.description ?? null,
    location: data.location ?? null,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    allDay: data.all_day ?? false,
    kind: (data.kind as CalendarEntryKind) ?? 'custom',
  };
}

export async function updateCalendarEntry(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  input: UpdateCalendarEntryInput
): Promise<CalendarEntry> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.location !== undefined) patch.location = input.location;
  if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt;
  if (input.allDay !== undefined) patch.all_day = input.allDay;
  if (input.kind !== undefined) patch.kind = input.kind;

  const { data, error } = await supabase
    .from('calendar_entries')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, title, description, location, starts_at, ends_at, all_day, kind')
    .single();

  if (error || !data) {
    throw new Error(`Failed to update calendar entry: ${error?.message ?? 'no data'}`);
  }

  return {
    id: data.id,
    source: 'manual',
    title: data.title,
    description: data.description ?? null,
    location: data.location ?? null,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    allDay: data.all_day ?? false,
    kind: (data.kind as CalendarEntryKind) ?? 'custom',
  };
}

export async function deleteCalendarEntry(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('calendar_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete calendar entry: ${error.message}`);
  }
}
