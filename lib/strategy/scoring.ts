export interface StrategyOptionScoreInput {
  id: string;
  title: string;
  impactPotential: number;
  confidenceLevel: number;
  strategicFit: number;
  effortCost: number;
  downsideRisk: number;
  timeToValueWeeks: number;
}

export interface StrategyOptionScoreBreakdown {
  impact: number;
  confidence: number;
  fit: number;
  effortPenalty: number;
  riskPenalty: number;
  speedPenalty: number;
}

export interface StrategyOptionScoreResult {
  optionId: string;
  title: string;
  total: number;
  breakdown: StrategyOptionScoreBreakdown;
}

const IMPACT_WEIGHT = 4.0;
const CONFIDENCE_WEIGHT = 2.0;
const FIT_WEIGHT = 2.5;
const EFFORT_WEIGHT = 1.9;
const RISK_WEIGHT = 1.6;
const SPEED_MAX_PENALTY = 10;
const SCORE_BASELINE = 28;
const SPEED_WEEKS_CAP = 52;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeStrategyOptionScore(option: StrategyOptionScoreInput): StrategyOptionScoreResult {
  const normalizedWeeks = clamp(option.timeToValueWeeks, 1, SPEED_WEEKS_CAP);

  const breakdown: StrategyOptionScoreBreakdown = {
    impact: option.impactPotential * IMPACT_WEIGHT,
    confidence: option.confidenceLevel * CONFIDENCE_WEIGHT,
    fit: option.strategicFit * FIT_WEIGHT,
    effortPenalty: option.effortCost * EFFORT_WEIGHT,
    riskPenalty: option.downsideRisk * RISK_WEIGHT,
    speedPenalty: (normalizedWeeks / SPEED_WEEKS_CAP) * SPEED_MAX_PENALTY,
  };

  const positive = breakdown.impact + breakdown.confidence + breakdown.fit;
  const negative = breakdown.effortPenalty + breakdown.riskPenalty + breakdown.speedPenalty;
  const raw = SCORE_BASELINE + positive - negative;

  return {
    optionId: option.id,
    title: option.title,
    total: Math.round(clamp(raw, 0, 100)),
    breakdown: {
      impact: Math.round(breakdown.impact),
      confidence: Math.round(breakdown.confidence),
      fit: Math.round(breakdown.fit),
      effortPenalty: Math.round(breakdown.effortPenalty),
      riskPenalty: Math.round(breakdown.riskPenalty),
      speedPenalty: Math.round(breakdown.speedPenalty),
    },
  };
}

export interface StrategyScoreResult {
  scoredOptions: StrategyOptionScoreResult[];
  winner: StrategyOptionScoreResult | null;
}

export function scoreStrategyOptions(options: StrategyOptionScoreInput[]): StrategyScoreResult {
  const scoredOptions = options
    .map((option) => computeStrategyOptionScore(option))
    .sort((a, b) => b.total - a.total);

  return {
    scoredOptions,
    winner: scoredOptions[0] ?? null,
  };
}
