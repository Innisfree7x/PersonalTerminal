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

export type StrategyScoreMode = 'standard' | 'deadline';

interface StrategyScoreWeights {
  impactWeight: number;
  confidenceWeight: number;
  fitWeight: number;
  effortWeight: number;
  riskWeight: number;
  speedMaxPenalty: number;
}

const STANDARD_WEIGHTS: StrategyScoreWeights = {
  impactWeight: 4.0,
  confidenceWeight: 2.0,
  fitWeight: 2.5,
  effortWeight: 1.9,
  riskWeight: 1.6,
  speedMaxPenalty: 10,
};

const DEADLINE_WEIGHTS: StrategyScoreWeights = {
  impactWeight: 3.7,
  confidenceWeight: 1.8,
  fitWeight: 2.4,
  effortWeight: 2.2,
  riskWeight: 2.1,
  speedMaxPenalty: 16,
};

const SCORE_BASELINE = 28;
const SPEED_WEEKS_CAP = 52;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeStrategyOptionScore(option: StrategyOptionScoreInput): StrategyOptionScoreResult {
  return computeStrategyOptionScoreWithMode(option, 'standard');
}

export function computeStrategyOptionScoreWithMode(
  option: StrategyOptionScoreInput,
  mode: StrategyScoreMode
): StrategyOptionScoreResult {
  const normalizedWeeks = clamp(option.timeToValueWeeks, 1, SPEED_WEEKS_CAP);
  const weights = mode === 'deadline' ? DEADLINE_WEIGHTS : STANDARD_WEIGHTS;

  const breakdown: StrategyOptionScoreBreakdown = {
    impact: option.impactPotential * weights.impactWeight,
    confidence: option.confidenceLevel * weights.confidenceWeight,
    fit: option.strategicFit * weights.fitWeight,
    effortPenalty: option.effortCost * weights.effortWeight,
    riskPenalty: option.downsideRisk * weights.riskWeight,
    speedPenalty: (normalizedWeeks / SPEED_WEEKS_CAP) * weights.speedMaxPenalty,
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

export function scoreStrategyOptions(options: StrategyOptionScoreInput[], mode: StrategyScoreMode = 'standard'): StrategyScoreResult {
  const scoredOptions = options
    .map((option) => computeStrategyOptionScoreWithMode(option, mode))
    .sort((a, b) => b.total - a.total);

  return {
    scoredOptions,
    winner: scoredOptions[0] ?? null,
  };
}
