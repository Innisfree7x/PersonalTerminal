'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BookOpen,
  CalendarClock,
  Check,
  CheckCheck,
  Clock3,
  Copy,
  ExternalLink,
  FileJson,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Signal,
  Trash2,
  Upload,
} from 'lucide-react';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSoundToast } from '@/lib/hooks/useSoundToast';
import type { KitSyncStatus } from '@/lib/kit-sync/types';
import {
  KIT_CAMPUS_ACADEMIC_CONNECTOR_VERSION,
  parseCampusAcademicExport,
} from '@/lib/kit-sync/campusAcademicExport';
import {
  KIT_ILIAS_DASHBOARD_CONNECTOR_VERSION,
  parseIliasDashboardExport,
} from '@/lib/kit-sync/iliasDashboardExport';
import {
  KIT_ILIAS_COURSE_CONNECTOR_VERSION,
  parseIliasCourseExport,
} from '@/lib/kit-sync/iliasCourseExport';
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

async function importCampusAcademicPayload(rawValue: string) {
  const parsed = parseCampusAcademicExport(rawValue);
  if (parsed.modules.length === 0 && parsed.grades.length === 0 && parsed.exams.length === 0) {
    throw new Error('Der CAMPUS-Export enthält noch keine Module, Noten oder Prüfungen.');
  }

  const response = await fetch('/api/kit/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'campus_connector',
      connectorVersion: KIT_CAMPUS_ACADEMIC_CONNECTOR_VERSION,
      payload: {
        modules: parsed.modules,
        grades: parsed.grades,
        exams: parsed.exams,
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'CAMPUS Academic Export konnte nicht importiert werden.');
  }

  return {
    ...(await response.json()),
    modulesImported: parsed.modules.length,
    gradesImported: parsed.grades.length,
    examsImported: parsed.exams.length,
  };
}

async function importIliasCoursePayload(rawValue: string) {
  const parsed = parseIliasCourseExport(rawValue);
  if (parsed.items.length === 0) {
    throw new Error('Der ILIAS Kurs-Export enthält noch keine Kurs-Items. Öffne einen favorisierten Kurs mit Materialien oder Ankündigungen.');
  }

  const response = await fetch('/api/kit/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source: 'ilias_connector',
      connectorVersion: KIT_ILIAS_COURSE_CONNECTOR_VERSION,
      payload: {
        favorites: parsed.favorites,
        items: parsed.items,
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'ILIAS Kurs-Export konnte nicht importiert werden.');
  }

  return {
    ...(await response.json()),
    favoritesImported: parsed.favorites.length,
    itemsImported: parsed.items.length,
  };
}

async function resetKitSyncScope(scope: 'campus_webcal' | 'campus_connector' | 'ilias_dashboard' | 'ilias_items') {
  const response = await fetch(`/api/kit/sync?scope=${scope}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'KIT Sync Daten konnten nicht zurückgesetzt werden.');
  }

  return response.json();
}

async function acknowledgeIliasItems(ids: string[]) {
  const response = await fetch('/api/kit/ilias-items/acknowledge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'ILIAS-Signale konnten nicht bestätigt werden.');
  }

  return response.json() as Promise<{ acknowledgedCount: number; nextStatus?: KitSyncStatus }>;
}

async function deleteIliasFavorite(id: string) {
  const response = await fetch(`/api/kit/ilias-favorites/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'ILIAS-Favorit konnte nicht entfernt werden.');
  }

  return response.json() as Promise<{
    removedFavoriteId: string;
    removedTitle: string;
    itemsDeleted: number;
    nextStatus?: KitSyncStatus;
  }>;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  return format(new Date(value), 'dd.MM.yyyy HH:mm');
}

function formatIliasItemMeta(input: { publishedAt: string | null; firstSeenAt: string }) {
  const publishedLabel = formatDateTime(input.publishedAt);
  if (publishedLabel) return `Veröffentlicht ${publishedLabel}`;
  return `Erst gesehen ${formatDateTime(input.firstSeenAt) ?? 'unbekannt'}`;
}

function normalizeSemesterLabel(value: string | null | undefined) {
  if (!value) return 'Ohne Semester';
  const normalized = value.replace(/\s+/g, '').toUpperCase();
  return normalized || 'Ohne Semester';
}

function getSemesterSortValue(label: string) {
  const normalized = normalizeSemesterLabel(label);
  const match = normalized.match(/^(SS|WS)(\d{4})(?:\/(\d{2,4}))?$/);
  if (!match) return Number.NEGATIVE_INFINITY;
  const term = match[1];
  const year = Number(match[2]);
  return year * 10 + (term === 'WS' ? 9 : 4);
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

function previewCampusAcademicImport(rawValue: string) {
  const parsed = parseCampusAcademicExport(rawValue);
  if (parsed.modules.length === 0 && parsed.grades.length === 0 && parsed.exams.length === 0) {
    throw new Error('Der CAMPUS-Export enthält noch keine Module, Noten oder Prüfungen.');
  }

  return `CAMPUS Snapshot importieren?\n\n${parsed.modules.length} Module\n${parsed.grades.length} Noten\n${parsed.exams.length} Prüfungen\n\nWenn der Export falsch ist, kannst du die Quelle danach direkt wieder zurücksetzen.`;
}

function previewIliasFavoritesImport(rawValue: string) {
  const parsed = parseIliasDashboardExport(rawValue);
  if (parsed.favorites.length === 0) {
    throw new Error('Der ILIAS-Export enthält 0 Favoriten. Bitte prüfe, ob du das Skript wirklich auf dem ILIAS-Dashboard mit sichtbaren Favoriten ausgeführt hast.');
  }

  return `ILIAS Favoriten importieren?\n\n${parsed.favorites.length} Kurse\n${parsed.items.length} Items\n\nBestehende Favoriten kannst du danach direkt zurücksetzen, falls der Export falsch war.`;
}

function previewIliasCourseImport(rawValue: string) {
  const parsed = parseIliasCourseExport(rawValue);
  if (parsed.items.length === 0) {
    throw new Error('Der ILIAS Kurs-Export enthält noch keine Kurs-Items. Öffne einen favorisierten Kurs mit Materialien oder Ankündigungen.');
  }

  return `ILIAS Kurs-Items importieren?\n\n${parsed.favorites.length} Kurse\n${parsed.items.length} Items\n\nWenn der Export unplausibel aussieht, kannst du die Kurs-Items danach direkt wieder zurücksetzen.`;
}

export default function KitSyncPanel() {
  const queryClient = useQueryClient();
  const soundToast = useSoundToast();
  const [webcalUrl, setWebcalUrl] = useState('');
  const [campusExportText, setCampusExportText] = useState('');
  const [iliasExportText, setIliasExportText] = useState('');
  const [iliasCourseExportText, setIliasCourseExportText] = useState('');
  const [isCopyingCampusConnector, setIsCopyingCampusConnector] = useState(false);
  const [isCopyingDashboardConnector, setIsCopyingDashboardConnector] = useState(false);
  const [isCopyingCourseConnector, setIsCopyingCourseConnector] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(true);
  const [isCampusManualImportOpen, setIsCampusManualImportOpen] = useState(false);
  const [isDashboardManualImportOpen, setIsDashboardManualImportOpen] = useState(false);
  const [isCourseManualImportOpen, setIsCourseManualImportOpen] = useState(false);
  const campusFileInputRef = useRef<HTMLInputElement | null>(null);
  const iliasDashboardFileInputRef = useRef<HTMLInputElement | null>(null);
  const iliasCourseFileInputRef = useRef<HTMLInputElement | null>(null);

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
    onSuccess: async (result: { nextStatus?: KitSyncStatus }) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
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
    onSuccess: async (result: { itemsWritten?: number; nextStatus?: KitSyncStatus }) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      soundToast.success(`KIT Sync abgeschlossen${typeof result.itemsWritten === 'number' ? ` · ${result.itemsWritten} Events aktualisiert` : ''}.`);
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const campusImportMutation = useMutation({
    mutationFn: importCampusAcademicPayload,
    onSuccess: async (result: { modulesImported: number; gradesImported: number; examsImported: number; nextStatus?: KitSyncStatus }) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      setCampusExportText('');
      soundToast.success(
        `CAMPUS Snapshot importiert · ${result.modulesImported} Module · ${result.gradesImported} Noten${result.examsImported > 0 ? ` · ${result.examsImported} Prüfungen` : ''}.`
      );
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const iliasImportMutation = useMutation({
    mutationFn: importIliasDashboardPayload,
    onSuccess: async (result: { favoritesImported: number; itemsImported: number; nextStatus?: KitSyncStatus }) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      setIliasExportText('');
      soundToast.success(`ILIAS Export importiert · ${result.favoritesImported} Favoriten${result.itemsImported > 0 ? ` · ${result.itemsImported} Items` : ''}.`);
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const iliasCourseImportMutation = useMutation({
    mutationFn: importIliasCoursePayload,
    onSuccess: async (result: { favoritesImported: number; itemsImported: number; nextStatus?: KitSyncStatus }) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      setIliasCourseExportText('');
      soundToast.success(
        `ILIAS Kurs-Items importiert · ${result.itemsImported} neue Signale${result.favoritesImported > 0 ? ` · ${result.favoritesImported} Kurse` : ''}.`
      );
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetKitSyncScope,
    onSuccess: async (result: { itemsDeleted: number; nextStatus?: KitSyncStatus }) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      soundToast.success(`Quelle zurückgesetzt · ${result.itemsDeleted} Einträge entfernt.`);
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeIliasItems,
    onSuccess: async (result) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      soundToast.success(
        `${result.acknowledgedCount} ILIAS-Signal${result.acknowledgedCount === 1 ? '' : 'e'} als gelesen markiert.`
      );
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: deleteIliasFavorite,
    onSuccess: async (result) => {
      if (result.nextStatus) {
        queryClient.setQueryData(['kit-sync-status'], result.nextStatus);
      }
      await queryClient.invalidateQueries({ queryKey: ['kit-sync-status'] });
      soundToast.success(
        `${result.removedTitle} entfernt${result.itemsDeleted > 1 ? ` · ${result.itemsDeleted} verknüpfte Einträge gelöscht` : ''}.`
      );
    },
    onError: (mutationError: Error) => {
      soundToast.error(mutationError.message);
    },
  });

  async function handleCopyConnectorScript(
    scriptPath: string,
    setPending: (value: boolean) => void,
    successMessage: string
  ) {
    setPending(true);
    try {
      const response = await fetch(scriptPath, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Connector-Skript konnte nicht geladen werden.');
      }

      const script = await response.text();
      await navigator.clipboard.writeText(script);
      soundToast.success(successMessage);
    } catch (copyError) {
      soundToast.error(copyError instanceof Error ? copyError.message : 'Connector-Skript konnte nicht kopiert werden.');
    } finally {
      setPending(false);
    }
  }

  async function handleImportFile(
    file: File | null,
    setContent: (value: string) => void,
    previewImport: (value: string) => string,
    mutate: (value: string) => void
  ) {
    if (!file) return;

    try {
      const content = await file.text();
      setContent(content);
      const confirmation = previewImport(content);
      if (!window.confirm(confirmation)) return;
      mutate(content);
    } catch (fileError) {
      soundToast.error(fileError instanceof Error ? fileError.message : 'Datei konnte nicht gelesen werden.');
    }
  }

  function handleManualImport(
    rawValue: string,
    previewImport: (value: string) => string,
    mutate: (value: string) => void
  ) {
    try {
      const confirmation = previewImport(rawValue);
      if (!window.confirm(confirmation)) return;
      mutate(rawValue);
    } catch (previewError) {
      soundToast.error(previewError instanceof Error ? previewError.message : 'Import konnte nicht vorbereitet werden.');
    }
  }

  function confirmReset(scope: 'campus_webcal' | 'campus_connector' | 'ilias_dashboard' | 'ilias_items', label: string) {
    if (!window.confirm(`${label} wirklich zurücksetzen?\n\nDie importierten Daten aus dieser Quelle werden aus INNIS entfernt.`)) {
      return;
    }

    resetMutation.mutate(scope);
  }

  function confirmDeleteFavorite(favorite: { id: string; title: string }) {
    if (
      !window.confirm(
        `${favorite.title} wirklich aus den ILIAS-Favoriten entfernen?\n\nDer Kurs und seine verknüpften ILIAS-Items werden nur aus INNIS gelöscht.`
      )
    ) {
      return;
    }

    deleteFavoriteMutation.mutate(favorite.id);
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

  const groupedIliasFavorites = useMemo(() => {
    if (!data?.iliasFavoritePreview.length) return [];

    const groups = new Map<
      string,
      Array<(typeof data.iliasFavoritePreview)[number]>
    >();

    for (const favorite of data.iliasFavoritePreview) {
      const semesterLabel = normalizeSemesterLabel(favorite.semesterLabel);
      const group = groups.get(semesterLabel) ?? [];
      group.push({
        ...favorite,
        semesterLabel,
      });
      groups.set(semesterLabel, group);
    }

    return Array.from(groups.entries())
      .map(([semesterLabel, favorites]) => ({
        semesterLabel,
        favorites: favorites.sort((left, right) => left.title.localeCompare(right.title, 'de')),
      }))
      .sort((left, right) => getSemesterSortValue(right.semesterLabel) - getSemesterSortValue(left.semesterLabel));
  }, [data]);

  const freshIliasPreview = data?.freshIliasPreview ?? [];

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

  const gradeAverageTitle = data?.campusGradeAverage !== null && data?.campusGradeAverage !== undefined
    ? `Ø ${data.campusGradeAverage.toFixed(2).replace('.', ',')}`
    : 'Noch kein Schnitt';
  const gradeAverageMeta = data?.campusGradedModuleCount
    ? `${data.campusGradedModuleCount} benotete Prüfungen`
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
              label="Aktueller Schnitt"
              title={gradeAverageTitle}
              meta={gradeAverageMeta}
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
                <div className="flex items-center gap-2">
                  {data?.totalIliasFavorites ? (
                    <Badge variant="success" size="sm">Favoriten live</Badge>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmReset('ilias_dashboard', 'ILIAS Favoriten')}
                    loading={resetMutation.isPending}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  >
                    Leeren
                  </Button>
                </div>
              </div>

              <div className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
                {groupedIliasFavorites.length ? (
                  <div className="space-y-4">
                    {groupedIliasFavorites.map((group) => (
                      <div key={group.semesterLabel}>
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-200/85">
                            {group.semesterLabel}
                          </div>
                          <div className="text-[11px] text-text-tertiary">
                            {group.favorites.length} Kurs{group.favorites.length === 1 ? '' : 'e'}
                          </div>
                        </div>
                        <div className="grid gap-2 xl:grid-cols-2">
                          {group.favorites.map((favorite) => (
                            <div
                              key={favorite.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-text-primary">{favorite.title}</div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => confirmDeleteFavorite({ id: favorite.id, title: favorite.title })}
                                  loading={deleteFavoriteMutation.isPending && deleteFavoriteMutation.variables === favorite.id}
                                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                                >
                                  Entfernen
                                </Button>
                                {favorite.courseUrl ? (
                                  <a
                                    href={favorite.courseUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] p-2 text-text-tertiary transition-colors hover:border-emerald-400/30 hover:text-emerald-200"
                                    aria-label={`${favorite.title} in ILIAS öffnen`}
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-text-secondary">
                    Noch keine ILIAS-Favoriten sichtbar. Importiere den Dashboard-Export im Verwaltungsblock unten.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">Neue ILIAS-Signale</div>
                    <div className="mt-2 text-sm font-semibold text-text-primary">
                      {freshIliasPreview.length
                        ? `${freshIliasPreview.length} neue Update${freshIliasPreview.length === 1 ? '' : 's'}`
                        : 'Alles gelesen'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {freshIliasPreview.length ? (
                      <Badge variant="success" size="sm">Neu</Badge>
                    ) : (
                      <Badge variant="default" size="sm">Ruhig</Badge>
                    )}
                    {freshIliasPreview.length ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => acknowledgeMutation.mutate(freshIliasPreview.map((item) => item.id))}
                        loading={acknowledgeMutation.isPending}
                        leftIcon={<CheckCheck className="h-3.5 w-3.5" />}
                      >
                        Alle gelesen
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {freshIliasPreview.length ? (
                    freshIliasPreview.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-emerald-500/16 bg-emerald-500/[0.05] px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="success" size="sm">
                                {iliasItemTypeLabels[item.itemType] ?? 'Item'}
                              </Badge>
                              <span className="text-[11px] uppercase tracking-[0.16em] text-emerald-100/70">
                                {item.favoriteTitle}
                              </span>
                            </div>
                            <div className="mt-2 truncate text-sm font-medium text-text-primary">{item.title}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
                              <Clock3 className="h-3.5 w-3.5 text-emerald-200/70" />
                              <span>{formatIliasItemMeta(item)}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {item.itemUrl ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  window.open(item.itemUrl ?? '', '_blank', 'noopener,noreferrer');
                                  acknowledgeMutation.mutate([item.id]);
                                }}
                                disabled={acknowledgeMutation.isPending}
                                leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
                              >
                                Öffnen
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeMutation.mutate([item.id])}
                              loading={acknowledgeMutation.isPending}
                              leftIcon={<Check className="h-3.5 w-3.5" />}
                            >
                              Gelesen
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-text-secondary">
                      Keine offenen ILIAS-Signale. Neue Dokumente und Ankündigungen landen nach dem nächsten Kurs-Import hier.
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

                <div className="mt-3 space-y-3 text-sm text-text-secondary">
                  {data?.nextCampusExam ? (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-3">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-amber-200/70">Prüfungsdruck</div>
                      <div className="mt-1 font-medium text-amber-50">{data.nextCampusExam.title}</div>
                      <div className="mt-1 text-xs text-amber-100/75">{formatDateTime(data.nextCampusExam.startsAt)}</div>
                    </div>
                  ) : null}

                  {data?.campusModulesWithGrades && data.campusModulesWithGrades.length > 0 ? (
                    <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02]">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 border-b border-white/10 bg-[#0d1119]/95 backdrop-blur-sm">
                          <tr className="text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                            <th className="px-3 py-2.5 font-medium">Modul</th>
                            <th className="px-3 py-2.5 font-medium text-right">Note</th>
                            <th className="hidden px-3 py-2.5 font-medium text-right sm:table-cell">ECTS</th>
                            <th className="hidden px-3 py-2.5 font-medium text-right md:table-cell">Datum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                          {data.campusModulesWithGrades.map((mod, index) => {
                            const gradeColor = mod.gradeValue === null
                              ? 'text-text-secondary'
                              : mod.gradeValue <= 1.5
                                ? 'text-emerald-400'
                                : mod.gradeValue <= 2.5
                                  ? 'text-sky-400'
                                  : mod.gradeValue <= 3.5
                                    ? 'text-amber-400'
                                    : 'text-red-400';
                            return (
                              <tr key={`${mod.moduleCode ?? mod.moduleTitle}-${index}`} className="transition-colors hover:bg-white/[0.03]">
                                <td className="max-w-[200px] truncate px-3 py-2 text-text-primary" title={mod.moduleTitle}>
                                  {mod.moduleCode ? (
                                    <span className="mr-1.5 text-text-tertiary">{mod.moduleCode}</span>
                                  ) : null}
                                  {mod.moduleTitle}
                                </td>
                                <td className={`whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums ${gradeColor}`}>
                                  {mod.gradeLabel}
                                </td>
                                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-text-secondary sm:table-cell">
                                  {mod.credits !== null ? mod.credits : '–'}
                                </td>
                                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-text-secondary md:table-cell">
                                  {mod.examDate ?? '–'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
          </div>

          <details
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4"
            open={isManageOpen}
            onToggle={(event) => setIsManageOpen(event.currentTarget.open)}
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-text-primary">
              KIT Sync verwalten
            </summary>
            <div className="mt-3 grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">CAMPUS Kalender</div>
                <div className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Verbindet deinen offiziellen KIT-Kalender. Termine laufen danach direkt in den normalen INNIS-Kalender.
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
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
                  <Button
                    variant="ghost"
                    onClick={() => confirmReset('campus_webcal', 'CAMPUS Kalender')}
                    loading={resetMutation.isPending}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Leeren
                  </Button>
                </div>
                {data?.campusWebcalMaskedUrl ? (
                  <div className="mt-3 text-xs text-text-secondary">Quelle: {data.campusWebcalMaskedUrl}</div>
                ) : null}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">CAMPUS Academic Snapshot</div>
                <div className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Studienaufbau, Notenspiegel und Prüfungen lokal exportieren. Der Snapshot füllt Module, Noten und Prüfungen im KIT-Hub.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleCopyConnectorScript(
                        '/connectors/kit-campus-academic-exporter.js',
                        setIsCopyingCampusConnector,
                        'CAMPUS Academic Export-Skript kopiert.'
                      )
                    }
                    loading={isCopyingCampusConnector}
                    leftIcon={<Copy className="h-4 w-4" />}
                  >
                    Export-Skript kopieren
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.open('/connectors/kit-campus-academic-exporter.js', '_blank', 'noopener,noreferrer')}
                    leftIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Skript öffnen
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => campusFileInputRef.current?.click()}
                    loading={campusImportMutation.isPending}
                    leftIcon={<FileJson className="h-4 w-4" />}
                  >
                    JSON-Datei importieren
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => confirmReset('campus_connector', 'CAMPUS Academic Snapshot')}
                    loading={resetMutation.isPending}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Zurücksetzen
                  </Button>
                  <input
                    ref={campusFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleImportFile(file, setCampusExportText, previewCampusAcademicImport, campusImportMutation.mutate);
                      event.currentTarget.value = '';
                    }}
                  />
                </div>

                <div className="mt-3 text-xs leading-relaxed text-text-secondary">
                  Skript nacheinander auf `Studienaufbau`, `Notenspiegel` und `Prüfungen` ausführen. Jede Ausführung erweitert den lokalen Export.
                </div>

                <details
                  className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
                  open={isCampusManualImportOpen}
                  onToggle={(event) => setIsCampusManualImportOpen(event.currentTarget.open)}
                >
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-secondary">
                    JSON manuell einfügen
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <Textarea
                      label="CAMPUS Export JSON"
                      value={campusExportText}
                      onChange={(event) => setCampusExportText(event.target.value)}
                      placeholder="Füge hier den exportierten CAMPUS-Snapshot ein, wenn du nicht den Datei-Import nutzt."
                      fullWidth
                      rows={5}
                      resize="vertical"
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleManualImport(campusExportText, previewCampusAcademicImport, campusImportMutation.mutate)}
                      loading={campusImportMutation.isPending}
                      disabled={!campusExportText.trim()}
                      leftIcon={<Upload className="h-4 w-4" />}
                    >
                      Importieren
                    </Button>
                  </div>
                </details>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Favoriten</div>
                <div className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Holt nur deine favorisierten Kurse aus dem ILIAS-Dashboard. Das hält den Hub fokussiert und vermeidet Lärm.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleCopyConnectorScript(
                        '/connectors/kit-ilias-dashboard-exporter.js',
                        setIsCopyingDashboardConnector,
                        'ILIAS Dashboard Export-Skript kopiert.'
                      )
                    }
                    loading={isCopyingDashboardConnector}
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
                    onClick={() => iliasDashboardFileInputRef.current?.click()}
                    loading={iliasImportMutation.isPending}
                    leftIcon={<FileJson className="h-4 w-4" />}
                  >
                    JSON-Datei importieren
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => confirmReset('ilias_dashboard', 'ILIAS Favoriten')}
                    loading={resetMutation.isPending}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Zurücksetzen
                  </Button>
                  <input
                    ref={iliasDashboardFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleImportFile(file, setIliasExportText, previewIliasFavoritesImport, iliasImportMutation.mutate);
                      event.currentTarget.value = '';
                    }}
                  />
                </div>

                <div className="mt-3 text-xs leading-relaxed text-text-secondary">
                  ILIAS-Dashboard öffnen, Skript in der Browser-Konsole ausführen, erzeugte JSON-Datei hier importieren.
                </div>

                <details
                  className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
                  open={isDashboardManualImportOpen}
                  onToggle={(event) => setIsDashboardManualImportOpen(event.currentTarget.open)}
                >
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-secondary">
                    JSON manuell einfügen
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <Textarea
                      label="ILIAS Favoriten JSON"
                      value={iliasExportText}
                      onChange={(event) => setIliasExportText(event.target.value)}
                      placeholder="Füge hier den exportierten JSON-Inhalt ein, wenn du nicht den Datei-Import nutzt."
                      fullWidth
                      rows={5}
                      resize="vertical"
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleManualImport(iliasExportText, previewIliasFavoritesImport, iliasImportMutation.mutate)}
                      loading={iliasImportMutation.isPending}
                      disabled={!iliasExportText.trim()}
                      leftIcon={<Upload className="h-4 w-4" />}
                    >
                      Importieren
                    </Button>
                  </div>
                </details>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">ILIAS Kurs-Items</div>
                <div className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Führt pro favorisiertem Kurs Dokumente, Ankündigungen und neue Kurs-Signale in den Hub. Das ist der Schritt von “Favoriten” zu echtem Kurskontext.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      handleCopyConnectorScript(
                        '/connectors/kit-ilias-course-items-exporter.js',
                        setIsCopyingCourseConnector,
                        'ILIAS Kurs-Items Export-Skript kopiert.'
                      )
                    }
                    loading={isCopyingCourseConnector}
                    leftIcon={<Copy className="h-4 w-4" />}
                  >
                    Export-Skript kopieren
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => window.open('/connectors/kit-ilias-course-items-exporter.js', '_blank', 'noopener,noreferrer')}
                    leftIcon={<ExternalLink className="h-4 w-4" />}
                  >
                    Skript öffnen
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => iliasCourseFileInputRef.current?.click()}
                    loading={iliasCourseImportMutation.isPending}
                    leftIcon={<FileJson className="h-4 w-4" />}
                  >
                    JSON-Datei importieren
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => confirmReset('ilias_items', 'ILIAS Kurs-Items')}
                    loading={resetMutation.isPending}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Zurücksetzen
                  </Button>
                  <input
                    ref={iliasCourseFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handleImportFile(file, setIliasCourseExportText, previewIliasCourseImport, iliasCourseImportMutation.mutate);
                      event.currentTarget.value = '';
                    }}
                  />
                </div>

                <div className="mt-3 text-xs leading-relaxed text-text-secondary">
                  Einen favorisierten ILIAS-Kurs öffnen, Skript dort ausführen und die erzeugte JSON-Datei hier importieren. Mehrere Kurse bauen den lokalen Snapshot schrittweise aus.
                </div>

                <details
                  className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
                  open={isCourseManualImportOpen}
                  onToggle={(event) => setIsCourseManualImportOpen(event.currentTarget.open)}
                >
                  <summary className="cursor-pointer list-none text-xs font-medium text-text-secondary">
                    JSON manuell einfügen
                  </summary>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <Textarea
                      label="ILIAS Kurs-Items JSON"
                      value={iliasCourseExportText}
                      onChange={(event) => setIliasCourseExportText(event.target.value)}
                      placeholder="Füge hier den exportierten ILIAS-Kurs-JSON-Inhalt ein, wenn du nicht den Datei-Import nutzt."
                      fullWidth
                      rows={5}
                      resize="vertical"
                    />
                    <Button
                      variant="primary"
                      onClick={() => handleManualImport(iliasCourseExportText, previewIliasCourseImport, iliasCourseImportMutation.mutate)}
                      loading={iliasCourseImportMutation.isPending}
                      disabled={!iliasCourseExportText.trim()}
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
