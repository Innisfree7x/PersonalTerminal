export type RiskStatus = 'on_track' | 'tight' | 'at_risk';

export interface ToneClasses {
  text: string;
  badge: string;
  surface: string;
  border: string;
}

const RISK_STATUS_TONES: Record<RiskStatus, ToneClasses> = {
  on_track: {
    text: 'text-emerald-300',
    badge: 'border-emerald-400/25 bg-emerald-500/12 text-emerald-300',
    surface: 'bg-emerald-500/10',
    border: 'border-emerald-400/28',
  },
  tight: {
    text: 'text-amber-300',
    badge: 'border-amber-400/25 bg-amber-500/12 text-amber-300',
    surface: 'bg-amber-500/10',
    border: 'border-amber-400/28',
  },
  at_risk: {
    text: 'text-red-300',
    badge: 'border-red-400/25 bg-red-500/12 text-red-300',
    surface: 'bg-red-500/10',
    border: 'border-red-400/30',
  },
};

export function getRiskStatusTone(status: RiskStatus): ToneClasses {
  return RISK_STATUS_TONES[status];
}

export function getRiskStatusLabel(status: RiskStatus): string {
  if (status === 'on_track') return 'On track';
  if (status === 'at_risk') return 'At risk';
  return 'Tight';
}
