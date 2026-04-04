'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import KitCampusGradesTable from '@/components/features/university/KitCampusGradesTable';
import { fetchKitStatus } from '@/lib/kit-sync/client';

export default function GradesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['kit-sync-status'],
    queryFn: fetchKitStatus,
    staleTime: 60_000,
  });

  const hasGrades = Boolean(data?.campusModulesWithGrades?.length);
  const averageLabel =
    data?.campusGradeAverage !== null && data?.campusGradeAverage !== undefined
      ? data.campusGradeAverage.toFixed(2).replace('.', ',')
      : '–';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
          <BookOpen className="h-5 w-5 text-university-accent" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Noten</h1>
          <p className="text-sm text-text-secondary">
            Dein CAMPUS Academic Snapshot getrennt vom ILIAS-Signalstrom.
          </p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : error ? (
        <DecisionSurfaceCard
          eyebrow="KIT CAMPUS"
          title="Noten konnten nicht geladen werden"
          summary={error instanceof Error ? error.message : 'Unbekannter Fehler'}
          tone="error"
          icon={<GraduationCap className="h-4 w-4" />}
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <DecisionSurfaceCard
              eyebrow="Academic Snapshot"
              title={hasGrades ? `${data?.totalCampusGrades ?? 0} Noten erkannt` : 'Noch keine Noten importiert'}
              summary={
                hasGrades
                  ? 'Diese Liste kommt direkt aus deinem CAMPUS-Export.'
                  : 'Führe zuerst den CAMPUS Academic Snapshot im Sync-Bereich aus.'
              }
              chips={[
                { label: `${data?.totalCampusModules ?? 0} Module`, tone: 'info' },
                { label: `${data?.totalCampusGrades ?? 0} Noten`, tone: hasGrades ? 'success' : 'default' },
              ]}
              tone={hasGrades ? 'success' : 'warning'}
              icon={<BookOpen className="h-4 w-4" />}
            />
            <DecisionSurfaceCard
              eyebrow="Schnitt"
              title={averageLabel === '–' ? 'Noch kein Schnitt' : `Ø ${averageLabel}`}
              summary={
                data?.campusGradedModuleCount
                  ? `${data.campusGradedModuleCount} benotete Prüfungen sind aktuell im Snapshot.`
                  : 'Sobald benotete Prüfungen im Snapshot sind, erscheint dein Schnitt hier.'
              }
              chips={[
                {
                  label: data?.campusGradedModuleCount ? `${data.campusGradedModuleCount} benotet` : '0 benotet',
                  tone: data?.campusGradedModuleCount ? 'success' : 'default',
                },
              ]}
              tone={data?.campusGradedModuleCount ? 'info' : 'default'}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <DecisionSurfaceCard
              eyebrow="Nächster Schritt"
              title={hasGrades ? 'Snapshot aktuell halten' : 'Academic Snapshot ausführen'}
              summary={
                hasGrades
                  ? 'Wenn neue Prüfungen oder Noten dazukommen, ziehst du hier sofort den aktualisierten Stand.'
                  : 'Öffne den KIT Sync Bereich und importiere den Studienaufbau / Notenspiegel erneut.'
              }
              tone="warning"
              footer={
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => (window.location.href = '/uni/sync')}>
                    Zu KIT Sync
                  </Button>
                </div>
              }
              icon={<GraduationCap className="h-4 w-4" />}
            />
          </div>

          <DecisionSurfaceCard
            eyebrow="Benotete Module"
            title={hasGrades ? 'CAMPUS Notenblock' : 'Noch kein Notenblock verfügbar'}
            summary={
              hasGrades
                ? 'Hier landen genau die importierten CAMPUS-Module mit Note, ECTS und Datum.'
                : 'Aktuell ist noch kein benoteter CAMPUS-Snapshot importiert.'
            }
            tone={hasGrades ? 'default' : 'warning'}
            footer={
              hasGrades ? (
                <KitCampusGradesTable rows={data?.campusModulesWithGrades ?? []} maxHeightClassName="max-h-[40rem]" />
              ) : (
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => (window.location.href = '/uni/sync')}>
                    Snapshot importieren
                  </Button>
                </div>
              )
            }
          />
        </>
      )}
    </div>
  );
}
