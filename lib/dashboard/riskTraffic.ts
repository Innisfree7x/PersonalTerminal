import type { CheckinResponses } from '@/lib/supabase/dailyBriefing';

export type RiskDomain = 'study' | 'finance' | 'body' | 'focus';
export type RiskLevel = 'green' | 'amber' | 'red' | 'unknown';

export interface RiskLight {
  domain: RiskDomain;
  level: RiskLevel;
  /** Health 0..1 for the vitals bar (high = good). */
  fill: number;
  /** Short status word, e.g. "stabil", "KIPPT", "schwach". */
  label: string;
  /** Optional detail line, e.g. "Prüfung in 9d". */
  detail?: string;
}

export type TrajectoryRisk = 'on_track' | 'tight' | 'at_risk';

export interface RiskInput {
  trajectoryStatus?: TrajectoryRisk | null | undefined;
  daysUntilExam?: number | null | undefined;
  /** Today's evening check-in, or null if not done yet. */
  responses?: CheckinResponses | null | undefined;
  /** Commitment fulfillment rate 0..1 for today. */
  fulfillmentRate?: number | null | undefined;
}

const UNKNOWN = (domain: RiskDomain, label = 'noch offen'): RiskLight => ({
  domain,
  level: 'unknown',
  fill: 0.5,
  label,
});

export function computeStudyRisk(
  status: TrajectoryRisk | null | undefined,
  daysUntilExam: number | null | undefined
): RiskLight {
  const detail =
    typeof daysUntilExam === 'number' ? `Prüfung in ${daysUntilExam}d` : undefined;
  if (status === 'on_track') {
    return { domain: 'study', level: 'green', fill: 0.9, label: 'on track', ...(detail ? { detail } : {}) };
  }
  if (status === 'tight') {
    return { domain: 'study', level: 'amber', fill: 0.5, label: 'knapp', ...(detail ? { detail } : {}) };
  }
  if (status === 'at_risk') {
    return { domain: 'study', level: 'red', fill: 0.22, label: 'KIPPT', ...(detail ? { detail } : {}) };
  }
  return { ...UNKNOWN('study', 'kein Ziel'), fill: 0.5 };
}

export function computeFinanceRisk(responses: CheckinResponses | null | undefined): RiskLight {
  if (!responses || (responses.clean === undefined && responses.gamblingRisk === undefined)) {
    return UNKNOWN('finance', 'kein Check-in');
  }
  const risk = responses.gamblingRisk ?? 1;
  if (responses.clean === false) {
    return { domain: 'finance', level: 'red', fill: 0.2, label: 'nicht clean', detail: 'heute' };
  }
  if (risk >= 4) {
    return { domain: 'finance', level: 'amber', fill: 0.5, label: 'hoher Drang', detail: `${risk}/5` };
  }
  return { domain: 'finance', level: 'green', fill: 0.95, label: 'clean', detail: risk > 1 ? `Drang ${risk}/5` : 'kein Drang' };
}

export function computeBodyRisk(responses: CheckinResponses | null | undefined): RiskLight {
  if (!responses || (responses.gym === undefined && responses.sleep === undefined)) {
    return UNKNOWN('body', 'kein Check-in');
  }
  const gym = responses.gym === true;
  const sleep = responses.sleep ?? 2;
  if (!gym && sleep <= 1) {
    return { domain: 'body', level: 'red', fill: 0.25, label: 'schwach', detail: 'kein Gym · wenig Schlaf' };
  }
  if (gym && sleep >= 2) {
    return { domain: 'body', level: 'green', fill: 0.9, label: 'stark', detail: 'Gym ✓' };
  }
  return { domain: 'body', level: 'amber', fill: 0.55, label: 'ok', detail: gym ? 'Gym ✓' : 'kein Gym' };
}

export function computeFocusRisk(
  responses: CheckinResponses | null | undefined,
  fulfillmentRate: number | null | undefined
): RiskLight {
  const focus = responses?.focus;
  const rate = typeof fulfillmentRate === 'number' ? fulfillmentRate : null;
  if (focus === undefined && rate === null) {
    return UNKNOWN('focus', 'kein Check-in');
  }
  // Blend focus self-rating (1..3 → 0..1) with commitment fulfillment.
  const focusNorm = focus !== undefined ? (focus - 1) / 2 : null;
  const parts = [focusNorm, rate].filter((v): v is number => v !== null);
  const score = parts.reduce((a, b) => a + b, 0) / parts.length;
  if (score >= 0.66) {
    return { domain: 'focus', level: 'green', fill: 0.9, label: 'scharf' };
  }
  if (score >= 0.34) {
    return { domain: 'focus', level: 'amber', fill: 0.55, label: 'mittel' };
  }
  return { domain: 'focus', level: 'red', fill: 0.25, label: 'schwach' };
}

export interface RiskLights {
  study: RiskLight;
  finance: RiskLight;
  body: RiskLight;
  focus: RiskLight;
}

export function computeRiskLights(input: RiskInput): RiskLights {
  return {
    study: computeStudyRisk(input.trajectoryStatus, input.daysUntilExam),
    finance: computeFinanceRisk(input.responses),
    body: computeBodyRisk(input.responses),
    focus: computeFocusRisk(input.responses, input.fulfillmentRate),
  };
}

/** Aggregate control score 0..100 from known (non-unknown) lights. */
function asArray(lights: RiskLights): RiskLight[] {
  return [lights.study, lights.finance, lights.body, lights.focus];
}

export function computeControlScore(lights: RiskLights): number {
  const known = asArray(lights).filter((l) => l.level !== 'unknown');
  if (known.length === 0) return 50;
  const avg = known.reduce((sum, l) => sum + l.fill, 0) / known.length;
  return Math.round(avg * 100);
}

export interface NextStep {
  domain: RiskDomain;
  action: string;
  href: string;
}

const LEVEL_RANK: Record<RiskLevel, number> = { red: 3, amber: 2, unknown: 1, green: 0 };

const NEXT_STEP_BY_DOMAIN: Record<RiskDomain, NextStep> = {
  study: { domain: 'study', action: 'Lern-Block starten', href: '/uni/courses' },
  finance: { domain: 'finance', action: 'Kurz durchatmen — Trigger checken', href: '/today' },
  body: { domain: 'body', action: 'Bewegung einplanen', href: '/workspace/calendar' },
  focus: { domain: 'focus', action: 'Heutige Tasks priorisieren', href: '/workspace/tasks' },
};

/** Picks the most urgent domain and the action to take. Null when all green. */
export function pickNextStep(lights: RiskLights): NextStep | null {
  const sorted = asArray(lights)
    .filter((l) => l.level === 'red' || l.level === 'amber')
    .sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level]);
  const top = sorted[0];
  if (!top) return null;
  return NEXT_STEP_BY_DOMAIN[top.domain];
}
