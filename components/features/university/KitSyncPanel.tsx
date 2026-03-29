'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  CalendarClock,
  Copy,
  ExternalLink,
  FileJson,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Signal,
  Upload,
} from 'lucide-react';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import type { KitSyncStatus } from '@/lib/kit-sync/types';
import {
  KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION,
  parseIliasDashboardExport,
} from '@/lib/kit-sync/iliasDashboardExport';
import { cn } from '@/lib/utils';

const iliasItemTypeLabels: Record<string, string> = {
  announcement: 'Ankündigung',
  document: 'Dokument',
  folder: 'Ordner',
  link: 'Link',
  other: 'Item',
};

async function fetchKitStatus(): Promise<KitSyncStatus> {
  const response = await fetch('/api/kit/status', { cache: 'no-store' });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'KIT Sync Status konnte nicht geladen werden.');
  }
  return response.json() as Promise<KitSyncStatus>;
}

async function saveWebcal(url: string) {
  const response = await fetch('/api/kit/webcal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'CAMPUS WebCal konnte nicht gespeichert werden.');
  }

  return response.json();
}

async function triggerSync() {
  const response = await fetch('/api/kit/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'campus_webcal' }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'KIT Sync konnte nicht gestartet werden.');
  }

  return response.json();
}

async function importIliasDashboardPayload(rawValue: string) {
  const parsed = parseIliasDashboardExport(rawValue);
  if (parsed.favorites.length === 0) {
    throw new Error('Der ILIAS-Export enthält 0 Favoriten. Bitte prüfe, ob du das Skript wirklich auf dem ILIAS-Dashboard mit sichtbaren Favoriten ausgeführt hast.');
  }

  const response = await fetch('/api/kit/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'ilias_connector',
      connectorVersion: KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION,
      payload: {
        favorites: parsed.favorites,
        items: parsed.items,
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'ILIAS Dashboard Export konnte nicht importiert werden.');
  }

  return {
    ...(await response.json()),
    favoritesImported: parsed.favorites.length,
    itemsImported: parsed.items.length,
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  return format(new Date(value), 'dd.MM.yyyy HH:mm');
}

function SignalCard({
  icon,
  label,
  title,
  meta,
  accent,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  meta: string;
  accent: 'amber' | 'sky' | 'emerald' | 'violet';
}) {
  const accents = {
    amber: 'border-amber-500/25 bg-amber-500/[0.07] text-amber-100',
    sky: 'border-sky-500/25 bg-sky-500/[0.07] text-sky-100',
    emerald: 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-100',
    violet: 'border-violet-500/25 bg-violet-500/[0.08] text-violet-100',
  } as const;

  return (
    <div className={cn('rounded-xl border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]', accents[accent])}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/65">
        <span className="opacity-80">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs leading-relaxed text-white/70">{meta}</div>
    </div>
  );
}

function statusBadgeVariant(status: string | null | undefined): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'success') return 'success';
  if (status === 'failed') return 'error';
  if (status === 'partial' || status === 'running') return 'warning';
  return 'default';
}

export default function KitSyncPanel() {
  const queryClient = useQueryClient();
  const soundToast = useSoundToast();
  const [webcalUrl, setWebcalUrl] = useState('');
  const [iliasExportText, setIliasExportText] = useState('');
  const [isCopyingConnector, setIsCopyingConnector] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(true);
  const [isManualImportOpen, setIsManualImportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, error } = useQuery({
    queryKey: ['kit-sync-status'],
    queryFn: fetchKitStatus,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!data) return;
    if (!data.campusWebcalConfigured || data.totalIliasFavorites === 0) {
      setIsManageOpen(true);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveWebcal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      setWebcalUrl('');
      soundToast.success('CAMPUS WebCal gespeichert.');
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: async (result: { itemsWritten?: number }) => {
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      soundToast.success(`KIT Sync abgeschlossen${typeof result.itemsWritten === 'number' ? ` · ${result.itemsWritten} Events aktualisiert` : ''}.`);
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const iliasImportMutation = useMutation({
    mutationFn: importIliasDashboardPayload,
    onSuccess: async (result: { favoritesImported: number; itemsImported: number }) => {
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      setIliasExportText('');
      soundToast.success(`ILIAS Export importiert · ${result.favoritesImported} Favoriten${result.itemsImported > 0 ? ` · ${result.itemsImported} Items` : ''}.`);
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  async function handleCopyConnectorScript() {
    setIsCopyingConnector(true);
    try {
      const response = await fetch('/connectors/kit-ilias-dashboard-exporter.js', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Connector-Skript konnte nicht geladen werden.');
      }

      const script = await response.text();
      await navigator.clipboard.writeText(script);
      soundToast.success('ILIAS Dashboard Export-Skript kopiert.');
    } catch (copyError) {
      soundToast.error(copyError instanceof Error ? copyError.message : 'Connector-Skript konnte nicht kopiert werden.');
    } finally {
      setIsCopyingConnector(false);
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;

    try {
      const content = await file.text();
      setIliasExportText(content);
      iliasImportMutation.mutate(content);
    } catch (fileError) {
      soundToast.error(fileError instanceof Error ? fileError.message : 'Datei konnte nicht gelesen werden.');
    }
  }

  const chips = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: data.campusWebcalConfigured ? 'KIT-Kalender verbunden' : 'KIT-Kalender fehlt',
        tone: data.campusWebcalConfigured ? 'success' as const : 'warning' as const,
      },
      {
        label: data.totalIliasFavorites > 0 ? `${data.totalIliasFavorites} ILIAS-Kurse` : 'ILIAS noch leer',
        tone: data.totalIliasFavorites > 0 ? 'info' as const : 'default' as const,
      },
      {
        label: data.totalCampusModules > 0 || data.totalCampusGrades > 0 ? 'Academic Snapshot aktiv' : 'Noten folgen',
        tone: data.totalCampusModules > 0 || data.totalCampusGrades > 0 ? 'success' as const : 'default' as const,
      },
    ];
  }, [data]);

  const panelTone = error
    ? 'error'
    : data?.campusWebcalConfigured || (data?.totalIliasFavorites ?? 0) > 0
      ? 'info'
      : 'warning';

  const nextExamTitle = data?.nextCampusExam?.title ?? 'Noch keine Prüfung im KIT-Hub';
  const nextExamMeta = data?.nextCampusExam
    ? `${formatDateTime(data.nextCampusExam.startsAt)}${data.nextCampusExam.location ? ` · ${data.nextCampusExam.location}` : ''}`
    : 'Prüfungen und Noten kommen mit dem CAMPUS Academic Snapshot.';

  const nextEventTitle = data?.nextCampusEvent?.title ?? 'Noch kein KIT-Termin sichtbar';
  const nextEventMeta = data?.nextCampusEvent
    ? formatDateTime(data.nextCampusEvent.startsAt) ?? 'Zeit folgt'
    : data?.campusWebcalConfigured
      ? 'Kalender ist verbunden. Neue Termine landen nach dem nächsten Sync hier.'
      : 'Verbinde zuerst deinen CAMPUS-Kalender.';

  const iliasTitle = data?.freshIliasItems
    ? `${data.freshIliasItems} neue ILIAS-Signale`
    : data?.totalIliasFavorites
      ? `${data.totalIliasFavorites} Kurse verbunden`
      : 'Noch keine ILIAS-Kurse importiert';
  const iliasMeta = data?.latestIliasItem
    ? `${iliasItemTypeLabels[data.latestIliasItem.itemType] ?? 'Item'} · ${data.latestIliasItem.favoriteTitle}`
    : data?.totalIliasFavorites
      ? 'Kurs-Updates und Dokument-Metadaten folgen im nächsten Schritt.'
      : 'Importiere zuerst deine Favoriten aus dem ILIAS-Dashboard.';

  const latestGradeTitle = data?.latestCampusGrade
    ? data.latestCampusGrade.gradeLabel
    : 'Noch keine Note importiert';
  const latestGradeMeta = data?.latestCampusGrade
    ? data.latestCampusGrade.moduleTitle
    : 'Sobald der CAMPUS-Connector live ist, erscheinen Noten direkt hier.';

  return (
    <DecisionSurfaceCard
      eyebrow="KIT Hub"
      title="Dein KIT-Hub"
      summary={
        error
          ? 'Der KIT-Hub ist gerade nicht verfügbar. Deine Kursdaten bleiben nutzbar; den Sync kannst du danach separat neu laden.'
          : 'CAMPUS und ILIAS laufen in INNIS zusammen. Oben siehst du die relevanten Signale; die Technik bleibt unten klein im Hintergrund.'
      }
      chips={chips}
      tone={panelTone}
      icon={<GraduationCap className="h-4 w-4" />}
      footer={
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-4">
            <SignalCard
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Nächste Prüfung"
              title={nextExamTitle}
              meta={nextExamMeta}
              accent="amber"
            />
            <SignalCard
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              label="Nächstes KIT-Ereignis"
              title={nextEventTitle}
              meta={nextEventMeta}
              accent="sky"
            />
            <SignalCard
              icon={<Signal className="h-3.5 w-3.5" />}
              label="Neu in ILIAS"
              title={iliasTitle}
              meta={iliasMeta}
              accent="emerald"
            />
            <SignalCard
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label="Letzte Note"
              title={latestGradeTitle}
              meta={latestGradeMeta}
              accent="violet"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Favoriten</div>
                  <div className="mt-2 text-sm font-semibold text-text-primary">
                    {data ? `${data.totalIliasFavorites} Kurse verbunden` : 'Lädt …'}
                  </div>
                </div>
                {data?.totalIliasFavorites ? (
                  <Badge variant="success" size="sm">Favoriten live</Badge>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {data?.iliasFavoritePreview.length ? (
                  data.iliasFavoritePreview.map((favorite) => (
                    <div
                      key={favorite.title}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-primary">{favorite.title}</div>
                        <div className="mt-0.5 text-[11px] text-text-tertiary">
                          {favorite.semesterLabel ?? 'Favorit'}
                        </div>
                      </div>
                      {favorite.courseUrl ? (
                        <a
                          href={favorite.courseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] p-2 text-text-tertiary transition-colors hover:text-text-primary"
                          aria-label={`${favorite.title} in ILIAS öffnen`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-text-secondary">
                    Noch keine ILIAS-Favoriten sichtbar. Importiere den Dashboard-Export im Verwaltungsblock unten.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">Studienlage</div>
                  <div className="mt-2 text-sm font-semibold text-text-primary">
                    {data?.totalCampusModules || data?.totalCampusGrades
                      ? `${data.totalCampusModules} Module · ${data.totalCampusGrades} Noten`
                      : 'Academic Snapshot folgt'}
                  </div>
                </div>
                <Badge variant={data?.totalCampusModules || data?.totalCampusGrades ? 'success' : 'warning'} size="sm">
                  {data?.totalCampusModules || data?.totalCampusGrades ? 'Aktiv' : 'Nächster Schritt'}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                {data?.nextCampusExam ? (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-amber-200/70">Prüfungsdruck</div>
                    <div className="mt-1 font-medium text-amber-50">{data.nextCampusExam.title}</div>
                    <div className="mt-1 text-xs text-amber-100/75">{formatDateTime(data.nextCampusExam.startsAt)}</div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3">
                    <div className="font-medium text-text-primary">Noch keine Module und Noten verbunden</div>
                    <div className="mt-1 text-xs text-text-secondary">
                      Der nächste Connector-Schritt bringt Module, Prüfungen und Noten direkt in diesen Hub.
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-text-secondary">
                  <Badge variant={statusBadgeVariant(data?.lastRun?.status)} size="sm">
                    {data?.lastRun ? `Sync ${data.lastRun.status}` : 'Wartet auf nächsten Sync'}
                  </Badge>
                  {data?.campusWebcalCalendarName ? (
                    <span>Kalender: {data.campusWebcalCalendarName}</span>
                  ) : null}
                  {data?.campusWebcalLastError ? (
                    <Badge variant="error" size="sm">{data.campusWebcalLastError}</Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <details
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
            open={isManageOpen}
            onToggle={(event) => setIsManageOpen(event.currentTarget.open)}
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-text-primary">
              KIT Sync verwalten
            </summary>
            <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">CAMPUS Kalender</div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                  <Input
                    label="CAMPUS WebCal-URL"
                    placeholder="webcal://campus.studium.kit.edu/..."
                    value={webcalUrl}
                    onChange={(event) => setWebcalUrl(event.target.value)}
                    fullWidth
                    description="Serverseitig validiert und verschlüsselt gespeichert."
                  />
                  <Button
                    variant="secondary"
                    onClick={() => saveMutation.mutate(webcalUrl)}
                    loading={saveMutation.isPending}
                    disabled={!webcalUrl.trim()}
                    leftIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Speichern
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => syncMutation.mutate()}
                    loading={syncMutation.isPending}
                    disabled={!data?.campusWebcalConfigured}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Sync
                  </Button>
                </div>
                {data?.campusWebcalMaskedUrl ? (
                  <div className="mt-3 text-xs text-text-secondary">Quelle: {data.campusWebcalMaskedUrl}</div>
                ) : null}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Dashboard Export</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleCopyConnectorScript}
                    loading={isCopyingConnector}
                    leftIcon={<Copy className="h-4 w-4" />}
                  >
                    Export-Skript kopieren
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.open('/connectors/kit-ilias-dashboard-exporter.js', '_blank', 'noopener,noreferrer')}
                    leftIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Skript öffnen
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    loading={iliasImportMutation.isPending}
                    leftIcon={<FileJson className="h-4 w-4" />}
                  >
                    JSON-Datei importieren
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleImportFile(file);
                      event.currentTarget.value = '';
                    }}
                  />
                </div>

                <div className="mt-3 text-xs leading-relaxed text-text-secondary">
                  ILIAS-Dashboard öffnen, Skript in der Browser-Konsole ausführen, erzeugte JSON-Datei hier importieren.
                </div>

                <details
                  className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
                  open={isManualImportOpen}
                  onToggle={(event) => setIsManualImportOpen(event.currentTarget.open)}
                >
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-secondary">
                    JSON manuell einfügen
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <Textarea
                      label="ILIAS Export JSON"
                      value={iliasExportText}
                      onChange={(event) => setIliasExportText(event.target.value)}
                      placeholder="Füge hier den exportierten JSON-Inhalt ein, wenn du nicht den Datei-Import nutzt."
                      fullWidth
                      rows={5}
                      resize="vertical"
                    />
                    <Button
                      variant="primary"
                      onClick={() => iliasImportMutation.mutate(iliasExportText)}
                      loading={iliasImportMutation.isPending}
                      disabled={!iliasExportText.trim()}
                      leftIcon={<Upload className="h-4 w-4" />}
                    >
                      Importieren
                    </Button>
                  </div>
                </details>
              </div>
            </div>
          </details>
        </div>
      }
    />
  );
}
