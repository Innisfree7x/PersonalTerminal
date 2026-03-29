'use client';

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
  Upload
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

export default function KitSyncPanel() {
  const queryClient = useQueryClient();
  const soundToast = useSoundToast();
  const [webcalUrl, setWebcalUrl] = useState('');
  const [iliasExportText, setIliasExportText] = useState('');
  const [isCopyingConnector, setIsCopyingConnector] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(true);
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
        tone: data.campusWebcalConfigured ? 'success' as const : 'warning' as const
      },
      {
        label: `${data.totalIliasFavorites} ILIAS-Kurse`,
        tone: data.totalIliasFavorites > 0 ? 'success' as const : 'default' as const
      },
      {
        label: data.totalCampusModules > 0 || data.totalCampusGrades > 0 ? 'Academic Snapshot aktiv' : 'Academic Snapshot folgt',
        tone: data.totalCampusModules > 0 || data.totalCampusGrades > 0 ? 'success' as const : 'default' as const
      },
      ...(data.nextCampusExam
        ? [{ label: `Prüfung ${format(new Date(data.nextCampusExam.startsAt), 'dd.MM.')}`, tone: 'warning' as const }]
        : []),
    ];
  }, [data]);

  const panelTone = error
    ? 'error'
    : data?.campusWebcalConfigured || (data?.totalIliasFavorites ?? 0) > 0
      ? 'info'
      : 'warning';

  return (
    <DecisionSurfaceCard
      eyebrow="KIT Hub"
      title="Dein KIT-Hub"
      summary={
        error
          ? 'Der KIT-Status ist gerade nicht verfügbar. Deine bestehenden Kursdaten bleiben nutzbar, der Sync-Bereich kann danach separat neu geladen werden.'
          : 'CAMPUS und ILIAS laufen in INNIS zusammen. Hier siehst du die relevanten KIT-Signale zuerst; den technischen Sync verwaltest du nur noch im Hintergrund.'
      }
      chips={chips}
      tone={panelTone}
      icon={<GraduationCap className="h-4 w-4" />}
      bullets={[
        data?.nextCampusEvent
          ? `Nächstes KIT-Ereignis: ${data.nextCampusEvent.title} am ${format(new Date(data.nextCampusEvent.startsAt), 'dd.MM.yyyy HH:mm')}.`
          : 'Sobald dein CAMPUS-Kalender verbunden ist, landen Vorlesungen und Termine direkt hier.',
        data?.totalIliasFavorites
          ? `${data.totalIliasFavorites} favorisierte ILIAS-Kurse laufen bereits in INNIS ein.`
          : 'Importiere im nächsten Schritt deine favorisierten ILIAS-Kurse direkt aus dem ILIAS-Dashboard.',
        data?.latestCampusGrade
          ? `Letzte Note: ${data.latestCampusGrade.moduleTitle} · ${data.latestCampusGrade.gradeLabel}.`
          : 'Noten und Module folgen mit dem CAMPUS Academic Snapshot im nächsten Connector-Schritt.',
      ]}
      footer={
        <div className="space-y-4">
          <div className="grid gap-3 xl:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                <ShieldCheck className="h-3.5 w-3.5" /> Nächste Prüfung
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data?.nextCampusExam ? data.nextCampusExam.title : 'Noch keine Prüfung im KIT-Hub'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.nextCampusExam
                  ? `${format(new Date(data.nextCampusExam.startsAt), 'dd.MM.yyyy HH:mm')}${data.nextCampusExam.location ? ` · ${data.nextCampusExam.location}` : ''}`
                  : 'Sobald der CAMPUS Academic Snapshot live ist, erscheinen Prüfungen hier zuerst.'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                <CalendarClock className="h-3.5 w-3.5" /> Nächstes KIT-Ereignis
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data?.nextCampusEvent ? data.nextCampusEvent.title : 'Noch kein KIT-Termin importiert'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.nextCampusEvent
                  ? format(new Date(data.nextCampusEvent.startsAt), 'dd.MM.yyyy HH:mm')
                  : data?.campusWebcalConfigured
                    ? 'Kalender verbunden. Starte den nächsten Sync, damit neue Termine hier auftauchen.'
                    : 'Verbinde zuerst deinen CAMPUS-Kalender über WebCal.'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                <Signal className="h-3.5 w-3.5" /> Neu in ILIAS
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data?.freshIliasItems
                  ? `${data.freshIliasItems} neue Signale`
                  : data?.totalIliasFavorites
                    ? `${data.totalIliasFavorites} Favoriten verbunden`
                    : 'Noch kein ILIAS-Kurs importiert'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.latestIliasItem
                  ? `${iliasItemTypeLabels[data.latestIliasItem.itemType] ?? 'Item'} · ${data.latestIliasItem.title}`
                  : data?.totalIliasFavorites
                    ? 'Kurs-Items und Dokument-Metadaten folgen im nächsten Connector-Schritt.'
                    : 'Importiere deine Favoriten direkt aus dem ILIAS-Dashboard.'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
                <BookOpen className="h-3.5 w-3.5" /> Letzte Note
              </div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data?.latestCampusGrade ? data.latestCampusGrade.gradeLabel : 'Noch keine Note importiert'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.latestCampusGrade
                  ? data.latestCampusGrade.moduleTitle
                  : 'Der CAMPUS Academic Snapshot bringt Noten und Module direkt in INNIS.'}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Favoriten</div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data ? `${data.totalIliasFavorites} Kurse verbunden` : 'Lädt …'}
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

            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">Studienlage</div>
              <div className="mt-2 text-sm font-medium text-text-primary">
                {data
                  ? data.totalCampusModules > 0 || data.totalCampusGrades > 0
                    ? `${data.totalCampusModules} Module · ${data.totalCampusGrades} Noten`
                    : `${data.totalCampusEvents} KIT-Termine im Kalender`
                  : 'Lädt …'}
              </div>
              <div className="mt-1 text-xs text-text-secondary">
                {data?.nextCampusExam
                  ? `Nächste Prüfung: ${data.nextCampusExam.title} am ${format(new Date(data.nextCampusExam.startsAt), 'dd.MM.yyyy HH:mm')}.`
                  : data?.campusWebcalCalendarName
                    ? `Kalender: ${data.campusWebcalCalendarName}.`
                    : 'Verbinde zuerst deinen CAMPUS-Kalender, damit Termine und Prüfungen direkt in INNIS landen.'}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                {data?.lastRun ? (
                  <>
                    <Badge variant={data.lastRun.status === 'success' ? 'success' : data.lastRun.status === 'failed' ? 'error' : 'warning'} size="sm">
                      Letzter Run: {data.lastRun.status}
                    </Badge>
                    <span>{data.lastRun.itemsWritten} Einträge geschrieben</span>
                    <span>· Trigger: {data.lastRun.trigger}</span>
                  </>
                ) : (
                  <span>Noch kein Sync-Run protokolliert.</span>
                )}
                {data?.campusWebcalLastError ? (
                  <Badge variant="error" size="sm">{data.campusWebcalLastError}</Badge>
                ) : null}
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
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Hier verwaltest du nur noch die Datenquellen. Oben im Hub siehst du die relevanten KIT-Signale, nicht die Technik.
            </p>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">CAMPUS Kalender</div>
                <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
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

                <div className="mt-3 text-xs text-text-secondary">
                  {data?.campusWebcalMaskedUrl
                    ? `Gespeicherte Quelle: ${data.campusWebcalMaskedUrl}`
                    : 'Noch keine CAMPUS-WebCal-URL hinterlegt.'}
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
          </details>
        </div>
      }
    />
  );
}
