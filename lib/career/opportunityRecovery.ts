import type {
  OpportunitySearchItem,
  OpportunitySearchResponse,
  RadarTrack,
} from '@/lib/schemas/opportunity-radar.schema';

export interface OpportunityRecoveryPlan {
  tone: 'warning' | 'info';
  title: string;
  summary: string;
  bullets: string[];
  chips: Array<{ label: string; tone?: 'success' | 'warning' | 'info' }>;
}

export function buildOpportunityRecoveryPlan(
  items: OpportunitySearchItem[],
  meta: OpportunitySearchResponse['meta'] | null,
  priorityTrack: RadarTrack,
  query: string
): OpportunityRecoveryPlan {
  const trimmedQuery = query.trim();
  const best = items[0] ?? null;
  const cvFocus = meta?.cvTargetTracks?.join(' / ') ?? null;

  if (!best) {
    return {
      tone: 'warning',
      title: 'Recovery Playbook: Suchraum neu öffnen',
      summary:
        trimmedQuery.length > 0
          ? `Der Query "${trimmedQuery}" schneidet den Markt aktuell zu eng. Erst den Suchraum öffnen, dann das Signal wieder verengen.`
          : `Für ${priorityTrack} gibt es gerade kein belastbares Signal im sichtbaren Set. Das ist meist ein Konfigurationsproblem, kein Markt-Ende.`,
      chips: [
        { label: 'Suchraum eng', tone: 'warning' },
        { label: `Track ${priorityTrack}`, tone: 'info' },
        ...(cvFocus ? [{ label: `CV-Fokus ${cvFocus}`, tone: 'info' as const }] : []),
      ],
      bullets: [
        trimmedQuery.length > 0
          ? 'Query zuerst auf Firma oder breiten Rollentitel zurücksetzen, bevor du wieder verengst.'
          : 'Ohne Query zuerst Track oder Band öffnen, nicht sofort das Radar verwerfen.',
        meta?.liveSourceConfigured
          ? meta.liveSourceHealthy
            ? 'Live-Suche ist aktiv. Mehr Signal entsteht meistens über weniger strikte Filter, nicht über mehr Refreshs.'
            : 'Live-Suche ist gerade dünn oder gestört. Darum ist ein breiterer Track im Moment sinnvoller als ein spitzer Suchbegriff.'
          : 'Solange nur Fallback-Daten laufen, sollte der Fokus auf klaren Track-/CV-Hebeln liegen.',
        cvFocus
          ? `Wenn du beim ${cvFocus}-Fokus bleibst, rotiere erst in den nächsten angrenzenden Track statt sofort völlig neue Suchräume zu öffnen.`
          : 'Ein geschärftes CV-Profil gibt dem Radar meist schneller neue realistische Leads als noch mehr manuelle Filterspielerei.',
      ],
    };
  }

  return {
    tone: 'warning',
    title: 'Recovery mode: noch kein sicherer Lead',
    summary: `${best.company} ist aktuell der beste sichtbare Treffer, aber noch nicht die Art Rolle, in die du blind hineincommitten solltest.`,
    chips: [
      { label: `${best.band === 'target' ? 'Target' : 'Stretch'}-Lead`, tone: 'warning' },
      { label: `Bester Lead ${best.company}`, tone: 'info' },
      ...(cvFocus ? [{ label: `CV-Fokus ${cvFocus}`, tone: 'info' as const }] : []),
    ],
    bullets: [
      `Beste sichtbare Route: ${best.title} bei ${best.company}. Nutze sie als Signal, nicht als Autopilot-Entscheidung.`,
      best.nextAction ?? `Schließe zuerst ${best.topGaps[0] ?? 'die Hauptlücke'}, bevor du neu bewertest.`,
      cvFocus && !meta?.cvTargetTracks?.includes(priorityTrack)
        ? `Dein CV-Fokus liegt derzeit eher auf ${cvFocus} als auf ${priorityTrack}. Ein Track-Wechsel liefert wahrscheinlich schneller realistische Treffer.`
        : 'Wenn du Band oder Query leicht öffnest, bekommst du meist mehr vergleichbare Leads statt nur ambitionierter Ausreißer.',
    ],
  };
}
