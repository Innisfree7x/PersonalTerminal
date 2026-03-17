import type { StrategyScoreMode } from '@/lib/strategy/scoring';

export interface StrategyCommitReadiness {
  tone: 'success' | 'warning' | 'error';
  title: string;
  summary: string;
  bullets: string[];
  nextStep: string;
}

interface StrategyCommitReadinessInput {
  hasWinner: boolean;
  optionCount: number;
  winnerTitle?: string | null;
  winnerMargin?: number | null;
  scoreMode: StrategyScoreMode;
}

export function buildStrategyCommitReadiness({
  hasWinner,
  optionCount,
  winnerTitle,
  winnerMargin,
  scoreMode,
}: StrategyCommitReadinessInput): StrategyCommitReadiness {
  if (!hasWinner || optionCount === 0) {
    return {
      tone: 'error',
      title: 'Noch kein belastbarer Commit',
      summary: 'Ohne Winner fehlt das Signal. Erst Optionen scoren, dann committen.',
      bullets: [
        'Lege mindestens eine belastbare Option an.',
        'Starte einen Score-Run, damit Impact, Fit und Risiko sichtbar werden.',
      ],
      nextStep: 'Optionen ergänzen und Score run starten.',
    };
  }

  const margin = winnerMargin ?? 0;
  const modeLabel = scoreMode === 'deadline' ? 'Deadline Pressure' : 'Standard';

  if (margin >= 12) {
    return {
      tone: 'success',
      title: `${winnerTitle ?? 'Winner'} ist commit-ready`,
      summary: `Der Vorsprung ist mit +${margin} Punkten klar genug, um direkt in Today zu committen (${modeLabel}).`,
      bullets: [
        'Signal ist deutlich genug, um nicht weiter im Vergleich hängen zu bleiben.',
        'Der aktuelle Lens bestätigt den Winner unter realem Zeit- und Risiko-Druck.',
      ],
      nextStep: 'Commit → Today auslösen und den ersten Follow-up Schritt setzen.',
    };
  }

  if (margin >= 6) {
    return {
      tone: 'warning',
      title: `${winnerTitle ?? 'Winner'} ist knapp vorne`,
      summary: `Es gibt ein Signal, aber nur mit +${margin} Punkten Vorsprung. Die Entscheidung ist tragfähig, aber noch nicht sauber abgesichert.`,
      bullets: [
        'Prüfe die zwei stärksten Gegenargumente gegen den Winner.',
        'Wenn die Deadline real ist, committen. Wenn nicht, noch eine Annahme schärfen.',
      ],
      nextStep: 'Eine Unsicherheit prüfen und danach final committen.',
    };
  }

  return {
    tone: 'error',
    title: 'Signal ist zu schwach',
    summary: `Nur +${margin} Punkte Vorsprung. Die Optionen sind aktuell zu nah beieinander, um sauber zu committen.`,
    bullets: [
      'Schärfe Impact oder Risiko-Bewertung der Top-Optionen.',
      'Füge eine klarere Summary oder belastbarere Annahmen hinzu.',
    ],
    nextStep: 'Annahmen überarbeiten oder weitere Option hinzufügen.',
  };
}
