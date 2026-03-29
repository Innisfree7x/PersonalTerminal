'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarClock, RefreshCw, ShieldCheck, Signal, ExternalLink } from 'lucide-react';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSoundToast } from '@/lib/hooks/useSoundToast';

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
  nextCampusEvent: { title: string; startsAt: string; kind: string } | null;
  nextCampusExam: { title: string; startsAt: string; location: string | null } | null;
  latestCampusGrade: { moduleTitle: string; gradeLabel: string; publishedAt: string | null } | null;
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

export default function KitSyncPanel() {
  const queryClient = useQueryClient();
  const soundToast = useSoundToast();
  const [webcalUrl, setWebcalUrl] = useState('');

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

  const chips = useMemo(() => {
    if (!data) return [];
    return [
      { label: data.campusWebcalConfigured ? 'WebCal aktiv' : 'WebCal fehlt', tone: data.campusWebcalConfigured ? 'success' as const : 'warning' as const },
      { label: `${data.totalCampusEvents} KIT Events`, tone: 'info' as const },
      { label: `${data.totalCampusModules} Module`, tone: 'default' as const },
      { label: `${data.totalCampusGrades} Noten`, tone: 'default' as const },
      ...(data.connectorVersion ? [{ label: `Connector ${data.connectorVersion}`, tone: 'success' as const }] : []),
      ...(data.nextCampusEvent ? [{ label: `Nächstes Event ${format(new Date(data.nextCampusEvent.startsAt), 'dd.MM.')}`, tone: 'default' as const }] : []),
    ];
  }, [data]);

  return (
    <DecisionSurfaceCard
      eyebrow="KIT Sync"
      title="CAMPUS zuerst, ILIAS danach"
      summary="WebCal läuft bereits. Wave 2 erweitert den Stack jetzt um CAMPUS-Module, Noten und Prüfungen über einen read-only Connector mit bestehender Browser-Session statt Passwortspeicherung."
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
        </div>
      }
    />
  );
}
