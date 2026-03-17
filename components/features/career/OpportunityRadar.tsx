'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CreateApplicationInput } from '@/lib/schemas/application.schema';
import type {
  DachLocation,
  OpportunitySearchItem,
  OpportunitySearchResponse,
  RadarBand,
  RadarTrack,
} from '@/lib/schemas/opportunity-radar.schema';
import { AlertTriangle, MapPin, Radar, Search, Sparkles, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { DecisionSurfaceCard } from '@/components/ui/DecisionSurfaceCard';
import { buildOpportunityRadarInsight } from '@/lib/career/radarInsights';

interface OpportunityRadarProps {
  onAdoptToPipeline: (prefill: CreateApplicationInput) => void;
  externalRefreshToken?: number;
}

const TRACK_PRIORITY_ORDER: RadarTrack[] = ['M&A', 'TS', 'CorpFin', 'Audit'];
const LOCATION_FILTERS: DachLocation[] = ['DE', 'AT', 'CH'];
const BAND_FILTERS: RadarBand[] = ['realistic', 'target', 'stretch'];

function nextTrack(track: RadarTrack): RadarTrack {
  const currentIndex = TRACK_PRIORITY_ORDER.indexOf(track);
  return TRACK_PRIORITY_ORDER[(currentIndex + 1) % TRACK_PRIORITY_ORDER.length] ?? 'M&A';
}

function bandToBadgeVariant(band: RadarBand): 'success' | 'warning' | 'error' {
  if (band === 'realistic') return 'success';
  if (band === 'target') return 'warning';
  return 'error';
}

function formatBand(band: RadarBand): string {
  if (band === 'realistic') return 'Realistic';
  if (band === 'target') return 'Target';
  return 'Stretch';
}

function toDisplayFitIndex(score: number): string {
  // Keep internal 0-100 scoring for sorting/bands, but present a realistic market index.
  const capped = Math.min(89, Math.max(0, score));
  return (capped / 10).toFixed(1);
}

function formatCvRankTier(rankTier?: OpportunitySearchResponse['meta']['cvRankTier']): string | null {
  if (!rankTier) return null;
  if (rankTier === 'top') return 'Top-Profil';
  if (rankTier === 'strong') return 'Starkes Profil';
  if (rankTier === 'developing') return 'Aufbau-Profil';
  return 'Frühes Profil';
}

function buildApplicationPrefill(opportunity: OpportunitySearchItem): CreateApplicationInput {
  const displayFitIndex = toDisplayFitIndex(opportunity.fitScore);
  const notes = [
    'Opportunity Radar',
    `Track: ${opportunity.track}`,
    `Fit Index: ${displayFitIndex}/10`,
    `Band: ${formatBand(opportunity.band)}`,
    `Top Reasons: ${opportunity.topReasons.join('; ')}`,
    `Gaps: ${opportunity.topGaps.join('; ')}`,
    `Quellen: ${opportunity.sourceLabels.join(', ')}`,
  ].join('\n');

  return {
    company: opportunity.company,
    position: opportunity.title,
    status: 'applied',
    applicationDate: new Date(),
    location: `${opportunity.city}, ${opportunity.country}`,
    notes,
    jobUrl: opportunity.jobUrl ?? '',
  };
}

export default function OpportunityRadar({ onAdoptToPipeline, externalRefreshToken = 0 }: OpportunityRadarProps) {
  const [query, setQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<DachLocation[]>(['DE', 'AT', 'CH']);
  const [priorityTrack, setPriorityTrack] = useState<RadarTrack>('M&A');
  const [selectedBands, setSelectedBands] = useState<RadarBand[]>(['realistic', 'target', 'stretch']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [results, setResults] = useState<OpportunitySearchItem[]>([]);
  const [meta, setMeta] = useState<OpportunitySearchResponse['meta'] | null>(null);
  const [committingGapId, setCommittingGapId] = useState<string | null>(null);

  const serializedLocations = useMemo(() => selectedLocations.join(','), [selectedLocations]);
  const serializedBands = useMemo(() => selectedBands.join(','), [selectedBands]);
  const radarInsight = useMemo(() => buildOpportunityRadarInsight(results, meta, priorityTrack), [results, meta, priorityTrack]);
  const cvRankLabel = useMemo(() => formatCvRankTier(meta?.cvRankTier), [meta?.cvRankTier]);
  const hasCustomQuery = query.trim().length > 0;
  const allLocationsSelected = selectedLocations.length === LOCATION_FILTERS.length;
  const allBandsSelected = selectedBands.length === BAND_FILTERS.length;

  useEffect(() => {
    const controller = new AbortController();

    const run = window.setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          query,
          priorityTrack,
          locations: serializedLocations,
          bands: serializedBands,
          limit: '12',
        });

        const response = await fetch(`/api/career/opportunities?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Opportunity Radar request failed');
        }

        const payload = (await response.json()) as OpportunitySearchResponse;
        setResults(payload.items);
        setMeta(payload.meta);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        console.error('Opportunity radar fetch failed', requestError);
        setError('Opportunity Radar konnte nicht geladen werden.');
        setResults([]);
        setMeta(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(run);
      controller.abort();
    };
  }, [priorityTrack, query, refreshNonce, serializedBands, serializedLocations, externalRefreshToken]);

  const toggleLocation = (location: DachLocation) => {
    setSelectedLocations((prev) => {
      if (prev.includes(location)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== location);
      }
      return [...prev, location];
    });
  };

  const toggleBand = (band: RadarBand) => {
    setSelectedBands((prev) => {
      if (prev.includes(band)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== band);
      }
      return [...prev, band];
    });
  };

  const handleClearQuery = () => setQuery('');
  const handleBroadenBands = () => setSelectedBands([...BAND_FILTERS]);
  const handleBroadenLocations = () => setSelectedLocations([...LOCATION_FILTERS]);
  const handleSwitchTrack = () => setPriorityTrack((current) => nextTrack(current));
  const handleRetry = () => setRefreshNonce((prev) => prev + 1);
  const handleResetRadar = () => {
    setQuery('');
    setPriorityTrack('M&A');
    setSelectedLocations([...LOCATION_FILTERS]);
    setSelectedBands([...BAND_FILTERS]);
    setRefreshNonce((prev) => prev + 1);
  };

  const commitPrimaryGapTask = async (item: OpportunitySearchItem) => {
    const primaryGap = item.topGaps[0];
    if (!primaryGap) return;

    setCommittingGapId(item.id);
    try {
      const response = await fetch('/api/career/opportunities/gap-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityTitle: item.title,
          opportunityCompany: item.company,
          gap: primaryGap,
          track: item.track,
          jobUrl: item.jobUrl,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Gap-Task konnte nicht erstellt werden.');
      }

      const payload = (await response.json()) as { created?: boolean };
      if (payload.created) {
        toast.success('Gap als Today-Task angelegt.');
      } else {
        toast.success('Gap-Task war bereits vorhanden.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gap-Task konnte nicht erstellt werden.';
      toast.error(message);
    } finally {
      setCommittingGapId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-surface/45 p-4 backdrop-blur-sm md:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
            <Radar className="h-5 w-5 text-career-accent" />
            Opportunity Radar
          </h2>
          <p className="text-sm text-text-secondary">
            Multi-Source Search mit Dedupe und realistischer Reach-Band-Logik.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="career" size="sm">
            DACH · Praktika/Werkstudent
          </Badge>
          {meta ? (
            <Badge variant="default" size="sm">
              {meta.sourcesQueried} Quellen
            </Badge>
          ) : null}
          {meta?.liveSourceConfigured ? (
            !meta.liveSourceHealthy ? (
              <Badge variant="error" size="sm">Live gestört · Fallback aktiv</Badge>
            ) : meta.liveSourceContributed ? (
              <Badge variant="success" size="sm">Live Jobs aktiv</Badge>
            ) : (
              <Badge variant="warning" size="sm">Live ohne Treffer</Badge>
            )
          ) : (
            <Badge variant="default" size="sm">
              Demo-Daten
            </Badge>
          )}
          {meta?.cvProfileApplied ? (
            <Badge variant="career" size="sm">CV-Profil aktiv</Badge>
          ) : null}
          {meta?.queryRelaxedUsed ? (
            <Badge variant="warning" size="sm">Query erweitert</Badge>
          ) : null}
          {meta?.bandRelaxedUsed ? (
            <Badge variant="warning" size="sm">Band erweitert</Badge>
          ) : null}
          {meta?.llm?.enabled ? (
            <Badge variant="default" size="sm">
              LLM-Budget {meta.llm.remainingUnits}/{meta.llm.maxDailyUnits}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Titel oder Firma"
          leftIcon={<Search className="h-3.5 w-3.5" />}
          aria-label="Search by title or company"
          fullWidth
        />

        <fieldset className="space-y-2 rounded-xl border border-border/80 bg-background/30 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Standort</legend>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_FILTERS.map((location) => {
              const selected = selectedLocations.includes(location);
              return (
                <button
                  key={location}
                  type="button"
                  onClick={() => toggleLocation(location)}
                  aria-pressed={selected}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    selected
                      ? 'bg-career-accent/20 text-career-accent border border-career-accent/40'
                      : 'bg-surface-hover text-text-tertiary border border-border'
                  }`}
                >
                  {location}
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-border/80 bg-background/30 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Track-Priorität</legend>
          <div className="flex flex-wrap gap-1.5">
            {TRACK_PRIORITY_ORDER.map((track) => {
              const selected = priorityTrack === track;
              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => setPriorityTrack(track)}
                  aria-pressed={selected}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    selected
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-surface-hover text-text-tertiary border border-border'
                  }`}
                >
                  {track}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-tertiary">Order: M&A {'>'} TS {'>'} CorpFin {'>'} Audit</p>
        </fieldset>

        <fieldset className="space-y-2 rounded-xl border border-border/80 bg-background/30 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Band</legend>
          <div className="flex flex-wrap gap-1.5">
            {BAND_FILTERS.map((band) => {
              const selected = selectedBands.includes(band);
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => toggleBand(band)}
                  aria-pressed={selected}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    selected
                      ? 'bg-warning/20 text-warning border border-warning/40'
                      : 'bg-surface-hover text-text-tertiary border border-border'
                  }`}
                >
                  {formatBand(band)}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-error" />
            <div className="space-y-2">
              <p className="text-sm text-error">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                aria-label="Retry opportunity radar"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`radar-skeleton-${index}`} className="space-y-3 rounded-xl border border-border bg-surface/30 p-4">
              <Skeleton className="h-5 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface/25 p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-text-tertiary" />
                <p className="text-base font-medium text-text-primary">Radar hat aktuell keine belastbaren Treffer</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-tertiary">
                Das ist kein Dead End. Meist ist entweder der Query zu eng, das Band zu hart oder der Track gerade zu speziell.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {meta?.queryRelaxedUsed ? (
                  <Badge variant="warning" size="sm">Query bereits erweitert</Badge>
                ) : null}
                {meta?.bandRelaxedUsed ? (
                  <Badge variant="warning" size="sm">Band bereits erweitert</Badge>
                ) : null}
                {meta?.liveSourceConfigured ? (
                  meta.liveSourceHealthy ? (
                    <Badge variant="default" size="sm">Live-Suche aktiv</Badge>
                  ) : (
                    <Badge variant="error" size="sm">Live-Suche gestört</Badge>
                  )
                ) : (
                  <Badge variant="default" size="sm">Nur Fallback-Daten aktiv</Badge>
                )}
                {cvRankLabel ? (
                  <Badge variant="career" size="sm">{cvRankLabel}</Badge>
                ) : null}
                {meta?.cvTargetTracks?.length ? (
                  <Badge variant="default" size="sm">
                    CV-Fokus: {meta.cvTargetTracks.join(' / ')}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-xs text-text-secondary">
                <p>
                  {hasCustomQuery
                    ? `Aktiver Query: "${query.trim()}". Das ist oft zu spitz, wenn Firmennamen oder sehr enge Titel drinstehen.`
                    : `Ohne Query wird gerade rein über Track, Standort, CV-Signal und verfügbare Live-Treffer gefiltert.`}
                </p>
                <p>
                  {meta?.liveSourceConfigured
                    ? 'Wenn Live aktuell leer läuft, hilft fast immer ein breiterer Track oder ein offenerer Query.'
                    : 'Solange keine Live-Quelle greift, sollte der Fokus auf Track/Standort liegen statt auf sehr exakten Suchbegriffen.'}
                </p>
              </div>
            </div>

            <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:w-[360px]">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearQuery}
                disabled={!hasCustomQuery}
              >
                Query leeren
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBroadenBands}
                disabled={allBandsSelected}
              >
                Band öffnen
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBroadenLocations}
                disabled={allLocationsSelected}
              >
                Ganz DACH aktivieren
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSwitchTrack}
              >
                Zu {nextTrack(priorityTrack)} wechseln
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
              >
                Erneut laden
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResetRadar}
              >
                Radar resetten
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-3">
            <div className="rounded-lg border border-border/80 bg-background/35 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">1. Query</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                Lieber breit nach Firma oder Track suchen als nach exakten Stellenbezeichnungen.
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/35 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">2. Band</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                Wenn Realistic leer ist, kurz Target dazunehmen. Das gibt meist genug Signal ohne komplett zu verwässern.
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-background/35 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">3. Track</p>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                Bei dünnem Markt erst M&A → TS → CorpFin rotieren, bevor du das Radar als unbrauchbar wertest.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {radarInsight ? (
            <DecisionSurfaceCard
              eyebrow="Radar readout"
              title={radarInsight.title}
              summary={radarInsight.summary}
              bullets={radarInsight.bullets}
              chips={radarInsight.chips}
              tone={radarInsight.tone}
              icon={<Target className="h-4 w-4" />}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {results.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-surface/35 p-4 backdrop-blur-sm"
                aria-label={`Opportunity ${item.title} at ${item.company}`}
              >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-text-secondary">{item.company}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-text-tertiary">
                    <MapPin className="h-3.5 w-3.5" />
                    {item.city}, {item.country} · {item.track}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black tabular-nums text-career-accent">{toDisplayFitIndex(item.fitScore)}</p>
                  <p className="text-[11px] uppercase tracking-wide text-text-tertiary">Fit Index / 10</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={bandToBadgeVariant(item.band)} size="sm">
                  {formatBand(item.band)}
                </Badge>
                <Badge variant="career" size="sm">
                  {item.track}
                </Badge>
                {item.targetFirm ? (
                  <Badge variant="success" size="sm">
                    Target Firm
                  </Badge>
                ) : null}
                {item.sourceLabels.map((source) => (
                  <Badge key={`${item.id}-${source}`} variant="default" size="sm">
                    {source}
                  </Badge>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/80 bg-background/35 p-3">
                  <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                    <Sparkles className="h-3.5 w-3.5" />
                    Top-3 Gründe
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                    {item.topReasons.map((reason) => (
                      <li key={reason} className="leading-relaxed">
                        • {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-border/80 bg-background/35 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Gaps</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                    {item.topGaps.map((gap) => (
                      <li key={gap} className="leading-relaxed">
                        • {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {item.nextAction ? (
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Nächster Schritt</p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">{item.nextAction}</p>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={committingGapId === item.id}
                  onClick={() => commitPrimaryGapTask(item)}
                  aria-label={`Gap als Task übernehmen: ${item.title} bei ${item.company}`}
                >
                  Gap als Task
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onAdoptToPipeline(buildApplicationPrefill(item))}
                  aria-label={`In Pipeline übernehmen: ${item.title} bei ${item.company}`}
                >
                  In Pipeline übernehmen
                </Button>
              </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
