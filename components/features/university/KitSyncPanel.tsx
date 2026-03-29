'use client';

import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarClock, RefreshCw, ShieldCheck, Signal, ExternalLink, Copy, FileJson, Upload } from 'lucide-react';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import {
  KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION,
  parseIliasDashboardExport,
} from '@/lib/kit-sync/iliasDashboardExport';

const iliasItemTypeLabels: Record<string, string> = {
  announcement: 'Ankündigung',
  document: 'Dokument',
  folder: 'Ordner',
  link: 'Link',
  other: 'Item',
};

interface KitSyncStatus {
  campusWebcalConfigured: boolean;
  campusWebcalMaskedUrl: string | null;
  campusWebcalCalendarName: string | null;
  campusWebcalLastValidatedAt: string | null;
  campusWebcalLastSyncedAt: string | null;
  campusWebcalLastError: string | null;
  connectorVersion: string | null;
  totalCampusEvents: number;
  totalCampusModules: number;
  totalCampusGrades: number;
  totalIliasFavorites: number;
  totalIliasItems: number;
  freshIliasItems: number;
  nextCampusEvent: { title: string; startsAt: string; kind: string } | null;
  nextCampusExam: { title: string; startsAt: string; location: string | null } | null;
  latestCampusGrade: { moduleTitle: string; gradeLabel: string; publishedAt: string | null } | null;
  latestIliasItem: {
    favoriteTitle: string;
    title: string;
    itemType: string;
    publishedAt: string | null;
    itemUrl: string | null;
  } | null;
  iliasFavoritePreview: Array<{
    title: string;
    semesterLabel: string | null;
    courseUrl: string | null;
  }>;
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

export default function KitSyncPanel() {
  const queryClient = useQueryClient();
  const soundToast = useSoundToast();
  const [webcalUrl, setWebcalUrl] = useState('');
  const [iliasExportText, setIliasExportText] = useState('');
  const [isCopyingConnector, setIsCopyingConnector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['kit-sync-status'],
    queryFn: fetchKitStatus,
  });

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
    } catch (error) {
      soundToast.error(error instanceof Error ? error.message : 'Connector-Skript konnte nicht kopiert werden.');
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
    } catch (error) {
      soundToast.error(error instanceof Error ? error.message : 'Datei konnte nicht gelesen werden.');
    }
  }

  const chips = useMemo(() => {
    if (!data) return [];
    return [
      { label: data.campusWebcalConfigured ? 'WebCal aktiv' : 'WebCal fehlt', tone: data.campusWebcalConfigured ? 'success' as const : 'warning' as const },
      { label: `${data.totalCampusEvents} KIT Events`, tone: 'info' as const },
      { label: `${data.totalCampusModules} Module`, tone: 'default' as const },
      { label: `${data.totalCampusGrades} Noten`, tone: 'default' as const },
      { label: `${data.totalIliasFavorites} ILIAS Favoriten`, tone: 'default' as const },
      ...(data.freshIliasItems > 0 ? [{ label: `${data.freshIliasItems} neue ILIAS Items`, tone: 'success' as const }] : []),
      ...(data.connectorVersion ? [{ label: `Connector ${data.connectorVersion}`, tone: 'success' as const }] : []),
      ...(data.nextCampusEvent ? [{ label: `Nächstes Event ${format(new Date(data.nextCampusEvent.startsAt), 'dd.MM.')}`, tone: 'default' as const }] : []),
    ];
  }, [data]);

  return (
    <DecisionSurfaceCard
      eyebrow="KIT Sync"
      title="CAMPUS plus ILIAS in einem Sync-Pfad"
      summary="WebCal und CAMPUS Academic Snapshot laufen bereits. Der nächste testbare Schnitt ist jetzt ein lokaler ILIAS-Dashboard-Export: Favoriten werden read-only in INNIS übernommen, ohne Passwortspeicherung und ohne komplettes ILIAS-Spiegeln."
      chips={chips}
      tone={data?.campusWebcalConfigured ? 'info' : 'warning'}
      icon={<ShieldCheck className="h-4 w-4" />}
      bullets={[
        data?.campusWebcalMaskedUrl ? `Gespeicherte Quelle: ${data.campusWebcalMaskedUrl}` : 'Noch keine CAMPUS WebCal-URL hinterlegt.',
        data?.campusWebcalCalendarName ? `Kalendername: ${data.campusWebcalCalendarName}` : 'Kalendername wird beim ersten erfolgreichen Feed-Check übernommen.',
        data?.campusWebcalLastSyncedAt ? `Letzter Sync: ${format(new Date(data.campusWebcalLastSyncedAt), 'dd.MM.yyyy HH:mm')}` : 'Noch kein erfolgreicher Event-Import gelaufen.',
        data?.latestCampusGrade
          ? `Letzte Note: ${data.latestCampusGrade.moduleTitle} · ${data.latestCampusGrade.gradeLabel}`
          : 'Noch keine CAMPUS-Noten importiert.',
        data?.latestIliasItem
          ? `Letztes ILIAS Signal: ${data.latestIliasItem.favoriteTitle} · ${data.latestIliasItem.title}`
          : 'Noch keine ILIAS-Favoriten importiert. Der Dashboard-Export ist der nächste testbare Schritt.',
      ]}
      footer={
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
            <Input
              label="CAMPUS WebCal-URL"
              placeholder="webcal://campus.studium.kit.edu/..."
              value={webcalUrl}
              onChange={(event) => setWebcalUrl(event.target.value)}
              fullWidth
              description="Die URL wird serverseitig validiert und verschlüsselt gespeichert."
            />
            <Button
              variant="secondary"
              onClick={() => saveMutation.mutate(webcalUrl)}
              loading={saveMutation.isPending}
              disabled={!webcalUrl.trim()}
              leftIcon={<ExternalLink className="h-4 w-4" />}
            >
              WebCal speichern
            </Button>
            <Button
              variant="primary"
              onClick={() => syncMutation.mutate()}
              loading={syncMutation.isPending}
              disabled={!data?.campusWebcalConfigured}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Jetzt synchronisieren
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            {data?.lastRun ? (
              <>
                <Badge variant={data.lastRun.status === 'success' ? 'success' : data.lastRun.status === 'failed' ? 'error' : 'warning'} size="sm">
                  Letzter Run: {data.lastRun.status}
                </Badge>
                <span>{data.lastRun.itemsWritten} Items geschrieben</span>
                <span>· Trigger: {data.lastRun.trigger}</span>
              </>
            ) : (
              <span>Noch kein Sync-Run protokolliert.</span>
            )}
            {data?.campusWebcalLastError ? (
              <Badge variant="error" size="sm">{data.campusWebcalLastError}</Badge>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                <Signal className="h-3.5 w-3.5" /> Status
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {isLoading ? 'Lädt …' : error ? 'Nicht verfügbar' : data?.campusWebcalConfigured ? 'Bereit' : 'Setup offen'}
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                <CalendarClock className="h-3.5 w-3.5" /> Nächstes KIT Event
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data?.nextCampusEvent ? data.nextCampusEvent.title : 'Noch keine KIT Events importiert'}
              </div>
              {data?.nextCampusEvent ? (
                <div className="mt-1 text-xs text-text-secondary">{format(new Date(data.nextCampusEvent.startsAt), 'dd.MM.yyyy HH:mm')}</div>
              ) : null}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">Academic Snapshot</div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data ? `${data.totalCampusModules} Module · ${data.totalCampusGrades} Noten` : 'Lädt …'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.nextCampusExam
                  ? `Nächste Prüfung: ${data.nextCampusExam.title} am ${format(new Date(data.nextCampusExam.startsAt), 'dd.MM.yyyy HH:mm')}`
                  : 'Noch keine Prüfungen aus dem CAMPUS-Connector importiert.'}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Favoriten</div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data ? `${data.totalIliasFavorites} Kurse · ${data.totalIliasItems} Items` : 'Lädt …'}
              </div>
              <div className="mt-2 space-y-1.5 text-xs text-text-secondary">
                {data?.iliasFavoritePreview.length ? (
                  data.iliasFavoritePreview.map((favorite) => (
                    <div key={favorite.title} className="flex items-center justify-between gap-2">
                      <span className="truncate text-text-primary">{favorite.title}</span>
                      <span className="shrink-0 text-text-tertiary">{favorite.semesterLabel ?? 'Favorit'}</span>
                    </div>
                  ))
                ) : (
                  <span>Noch keine ILIAS-Favoriten importiert.</span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">Neu in ILIAS</div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data?.freshIliasItems ? `${data.freshIliasItems} neue Items in 7 Tagen` : 'Aktuell kein neues Signal'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.latestIliasItem
                  ? `${iliasItemTypeLabels[data.latestIliasItem.itemType] ?? 'Item'}: ${data.latestIliasItem.title}`
                  : 'Der Dashboard-Export liefert jetzt Favoriten. Kurs-Items und Dokument-Metadaten folgen im nächsten Connector-Schritt.'}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Dashboard Export</div>
            <div className="mt-2 text-sm text-text-secondary">
              1. ILIAS-Dashboard öffnen.
              <br />
              2. Export-Skript aus INNIS kopieren und in der Browser-Konsole ausführen.
              <br />
              3. Die erzeugte JSON-Datei oder Clipboard-Payload hier importieren.
            </div>

            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-3 text-sm text-amber-100">
              Wenn du <span className="font-medium">JSON-Datei importieren</span> nutzt, musst du das Textfeld darunter nicht anfassen.
              Das Feld ist nur für den Fall gedacht, dass du den Export direkt aus der Zwischenablage einfügst.
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <Textarea
                label="ILIAS Export JSON"
                value={iliasExportText}
                onChange={(event) => setIliasExportText(event.target.value)}
                placeholder="Füge hier den exportierten JSON-Inhalt aus dem ILIAS-Dashboard ein, wenn du nicht die Datei-Import-Funktion oben nutzt."
                description="Akzeptiert den lokalen Dashboard-Export. V1 importiert damit zuerst nur Favoriten stabil in INNIS."
                fullWidth
                rows={8}
                resize="vertical"
              />
              <Button
                variant="primary"
                onClick={() => iliasImportMutation.mutate(iliasExportText)}
                loading={iliasImportMutation.isPending}
                disabled={!iliasExportText.trim()}
                leftIcon={<Upload className="h-4 w-4" />}
              >
                ILIAS Export importieren
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
}
