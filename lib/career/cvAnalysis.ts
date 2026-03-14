import type { CvAnalyzeResult, CvRankTier, CvTargetTrack } from '@/lib/schemas/cv-analysis.schema';

type TrackWeights = Record<CvTargetTrack, number>;

const SKILL_SIGNAL_WEIGHTS: Array<{
  skill: string;
  aliases: string[];
  weight: number;
  trackWeights: TrackWeights;
}> = [
  {
    skill: 'Financial Modeling',
    aliases: ['financial model', 'valuation model', 'discounted cash flow', 'dcf', 'comps', 'lbo'],
    weight: 12,
    trackWeights: { 'M&A': 1.3, TS: 1.1, CorpFin: 1.25, Audit: 0.7 },
  },
  {
    skill: 'Due Diligence',
    aliases: ['due diligence', 'financial due diligence', 'fdd', 'commercial due diligence'],
    weight: 11,
    trackWeights: { 'M&A': 1.1, TS: 1.35, CorpFin: 1.0, Audit: 0.8 },
  },
  {
    skill: 'Accounting',
    aliases: ['ifrs', 'gaap', 'accounting', 'abschluss', 'bilanz', 'p&l', 'balance sheet'],
    weight: 10,
    trackWeights: { 'M&A': 0.9, TS: 1.1, CorpFin: 0.85, Audit: 1.35 },
  },
  {
    skill: 'PowerPoint Storytelling',
    aliases: ['powerpoint', 'pitch deck', 'deck', 'storyline'],
    weight: 8,
    trackWeights: { 'M&A': 1.05, TS: 0.85, CorpFin: 1.0, Audit: 0.75 },
  },
  {
    skill: 'Excel',
    aliases: ['excel', 'vlookup', 'xlookup', 'pivot', 'power query'],
    weight: 9,
    trackWeights: { 'M&A': 1.0, TS: 1.0, CorpFin: 1.0, Audit: 1.0 },
  },
  {
    skill: 'Bloomberg / Market Tools',
    aliases: ['bloomberg', 'capital iq', 'pitchbook', 'factset'],
    weight: 7,
    trackWeights: { 'M&A': 1.1, TS: 0.9, CorpFin: 1.15, Audit: 0.5 },
  },
  {
    skill: 'Transaction Exposure',
    aliases: ['m&a', 'mergers', 'acquisition', 'deal', 'transaction'],
    weight: 10,
    trackWeights: { 'M&A': 1.35, TS: 1.0, CorpFin: 1.15, Audit: 0.65 },
  },
  {
    skill: 'Client Communication',
    aliases: ['client', 'stakeholder', 'presentation', 'workshop', 'beratung'],
    weight: 6,
    trackWeights: { 'M&A': 0.9, TS: 0.9, CorpFin: 0.95, Audit: 0.95 },
  },
];

const EXPERIENCE_ALIASES = ['intern', 'internship', 'praktikum', 'werkstudent', 'working student', 'analyst'];
const EDUCATION_ALIASES = ['bachelor', 'master', 'university', 'gpa', 'grade', 'ects', 'studium'];
const LEADERSHIP_ALIASES = ['lead', 'captain', 'founder', 'mentor', 'organised', 'organized', 'koordiniert'];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(haystack: string, aliases: string[]): boolean {
  return aliases.some((alias) => haystack.includes(alias));
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toTier(rank: number): CvRankTier {
  if (rank >= 82) return 'top';
  if (rank >= 68) return 'strong';
  if (rank >= 52) return 'developing';
  return 'early';
}

function topUnique(items: string[], limit: number): string[] {
  return Array.from(new Set(items.map((x) => x.trim()).filter(Boolean))).slice(0, limit);
}

export function analyzeCvText(cvText: string, targetTracks: CvTargetTrack[]): CvAnalyzeResult {
  const text = normalize(cvText);
  const tracks: CvTargetTrack[] = targetTracks.length > 0 ? targetTracks : ['M&A'];
  const primaryTrack: CvTargetTrack = tracks[0] ?? 'M&A';

  let rawScore = 20; // base for non-empty CV
  const detectedSkills: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];

  for (const signal of SKILL_SIGNAL_WEIGHTS) {
    if (!includesAny(text, signal.aliases)) continue;
    detectedSkills.push(signal.skill);
    const weighted = Math.round(signal.weight * signal.trackWeights[primaryTrack]);
    rawScore += weighted;
    strengths.push(`${signal.skill} sichtbar im CV`);
  }

  if (includesAny(text, EXPERIENCE_ALIASES)) {
    rawScore += 8;
    strengths.push('Praxisbezug (Internship/Werkstudent) vorhanden');
  } else {
    gaps.push('Praxisbezug für Zielrolle ausbauen (Praktikum/Werkstudent)');
  }

  if (includesAny(text, EDUCATION_ALIASES)) {
    rawScore += 6;
  } else {
    gaps.push('Ausbildungs-/Uni-Kontext klarer im CV ausweisen');
  }

  if (includesAny(text, LEADERSHIP_ALIASES)) {
    rawScore += 4;
    strengths.push('Ownership/Leadership-Signale vorhanden');
  }

  // Text quality heuristics
  const wordCount = text.split(' ').length;
  if (wordCount < 220) {
    gaps.push('CV-Inhalt wirkt kurz; mehr projektbezogene Details ergänzen');
    rawScore -= 6;
  } else if (wordCount > 1400) {
    gaps.push('CV wirkt zu lang; stärker fokussieren und verdichten');
    rawScore -= 4;
  }

  if (!includesAny(text, ['excel', 'powerpoint'])) {
    gaps.push('Excel/PowerPoint explizit als Tool-Skills ergänzen');
  }
  if (!includesAny(text, ['dcf', 'valuation', 'financial model', 'due diligence'])) {
    gaps.push('Transaktionsnahe Skills (DCF/Due Diligence/Valuation) konkret benennen');
  }

  const cvRank = clamp(Math.round(rawScore), 0, 100);
  const rankTier = toTier(cvRank);

  return {
    cvRank,
    rankTier,
    topStrengths: topUnique(strengths, 5).length > 0 ? topUnique(strengths, 5) : ['Solider Grundaufbau vorhanden'],
    topGaps: topUnique(gaps, 5).length > 0 ? topUnique(gaps, 5) : ['Keine kritischen Lücken erkannt'],
    detectedSkills: topUnique(detectedSkills, 30),
    targetTracks: tracks,
  };
}
