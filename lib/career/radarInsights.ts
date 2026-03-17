import type { OpportunitySearchItem, OpportunitySearchResponse, RadarTrack } from '@/lib/schemas/opportunity-radar.schema';

export interface OpportunityRadarInsight {
  tone: 'success' | 'warning' | 'info';
  title: string;
  summary: string;
  bullets: string[];
  chips: Array<{ label: string; tone?: 'success' | 'warning' | 'info' }>;
}

function countBand(items: OpportunitySearchItem[], band: OpportunitySearchItem['band']) {
  return items.filter((item) => item.band === band).length;
}

function formatCvTier(rankTier?: OpportunitySearchResponse['meta']['cvRankTier']): string | null {
  if (!rankTier) return null;
  if (rankTier === 'top') return 'Top-Profil';
  if (rankTier === 'strong') return 'Starkes Profil';
  if (rankTier === 'developing') return 'Aufbau-Profil';
  return 'Frühes Profil';
}

export function buildOpportunityRadarInsight(
  items: OpportunitySearchItem[],
  meta: OpportunitySearchResponse['meta'] | null,
  priorityTrack: RadarTrack
): OpportunityRadarInsight | null {
  if (items.length === 0) return null;

  const best = items[0]!;
  const realistic = countBand(items, 'realistic');
  const target = countBand(items, 'target');
  const stretch = countBand(items, 'stretch');

  const chips: OpportunityRadarInsight['chips'] = [
    { label: `${realistic} realistic`, tone: 'success' },
    { label: `${target} target`, tone: 'warning' },
  ];

  if (stretch > 0) {
    chips.push({ label: `${stretch} stretch`, tone: 'info' });
  }

  if (meta?.cvProfileApplied) {
    chips.push({ label: 'CV-Profil aktiv', tone: 'info' });
  }

  const cvTier = formatCvTier(meta?.cvRankTier);
  if (cvTier) {
    chips.push({ label: cvTier, tone: 'info' });
  }

  if (meta?.queryRelaxedUsed || meta?.bandRelaxedUsed) {
    chips.push({ label: 'Radar erweitert', tone: 'warning' });
  }

  const bullets = [
    `Bester Treffer aktuell: ${best.title} bei ${best.company} in ${best.city}.`,
    `Track-Fokus liegt auf ${priorityTrack}; vorhandene Treffer wurden darauf priorisiert.`,
  ];

  if (best.nextAction) {
    bullets.push(`Nächster sinnvoller Move: ${best.nextAction}`);
  }

  if (meta?.cvTargetTracks?.length && !meta.cvTargetTracks.includes(priorityTrack)) {
    bullets.push(`Dein aktueller CV-Fokus liegt eher auf ${meta.cvTargetTracks.join(' / ')} als auf ${priorityTrack}.`);
  }

  if (meta?.liveSourceContributed) {
    bullets.push('Live-Quelle liefert aktuell echte Treffer und nicht nur Fallback-Daten.');
  } else if (meta?.liveSourceConfigured) {
    bullets.push('Live-Quelle ist aktiv, aktuell aber dünn. Track oder Query breiter ziehen gibt meist mehr Signal.');
  }

  return {
    tone: realistic > 0 ? 'success' : target > 0 ? 'warning' : 'info',
    title: realistic > 0 ? 'Radar hat echte Reach-Kandidaten' : 'Radar liefert Signal, aber noch keine sicheren Treffer',
    summary:
      realistic > 0
        ? `${realistic} Treffer liegen in deiner realistischen Reach-Band. Der beste Lead ist ${best.company} mit klarem Fit-Signal.`
        : `${best.company} ist aktuell der beste Treffer. Für mehr sichere Optionen musst du Query oder Track leicht öffnen.`,
    bullets,
    chips,
  };
}
