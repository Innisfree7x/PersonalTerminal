import type { RadarTrack } from '@/lib/schemas/opportunity-radar.schema';

interface TargetFirmProfile {
  id: string;
  label: string;
  aliases: string[];
  tracks: RadarTrack[];
  qualityBoost: number;
  qualityReason: string;
}

const TARGET_FIRM_PROFILES: TargetFirmProfile[] = [
  {
    id: 'big4-core',
    label: 'Big4 Deals',
    aliases: ['deloitte', 'ey', 'ernst young', 'kpmg', 'pwc', 'pricewaterhousecoopers'],
    tracks: ['M&A', 'TS', 'Audit', 'CorpFin'],
    qualityBoost: 10,
    qualityReason: 'Top-Track fuer Studenteneinstieg in Deals',
  },
  {
    id: 'tier2-assurance',
    label: 'Tier-2 Advisory',
    aliases: ['bdo', 'grant thornton', 'mazars', 'forvis', 'rsm', 'ebner stolz', 'roedl', 'rodl'],
    tracks: ['TS', 'Audit', 'CorpFin'],
    qualityBoost: 7,
    qualityReason: 'Starker Mid-Market Career Track',
  },
  {
    id: 'ib-global',
    label: 'Global IB',
    aliases: [
      'deutsche bank',
      'goldman sachs',
      'jpmorgan',
      'morgan stanley',
      'ubs',
      'barclays',
      'citi',
      'bnp paribas',
    ],
    tracks: ['M&A', 'CorpFin'],
    qualityBoost: 10,
    qualityReason: 'Tier-1 Investment Banking Umfeld',
  },
  {
    id: 'ib-dach',
    label: 'DACH Banking',
    aliases: ['berenberg', 'dz bank', 'commerzbank', 'unicredit', 'oddo', 'hauck'],
    tracks: ['M&A', 'CorpFin'],
    qualityBoost: 8,
    qualityReason: 'DACH Banking Track mit hoher Relevanz',
  },
  {
    id: 'ma-boutiques',
    label: 'M&A Boutiques',
    aliases: ['dc advisory', 'alantra', 'lincoln international', 'lazard', 'rothschild', 'jefferies'],
    tracks: ['M&A', 'TS'],
    qualityBoost: 9,
    qualityReason: 'Boutique M&A Fokus mit hoher Deal-Naehe',
  },
  {
    id: 'transaction-specialists',
    label: 'Transaction Specialists',
    aliases: ['wts', 'fti consulting', 'kroll'],
    tracks: ['TS', 'CorpFin'],
    qualityBoost: 7,
    qualityReason: 'Transaktionsspezialisiert und praxisnah',
  },
];

export interface TargetFirmSignal {
  matched: boolean;
  isTrackAligned: boolean;
  boost: number;
  reason?: string;
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchTargetFirmSignal(company: string, priorityTrack: RadarTrack): TargetFirmSignal {
  const normalizedCompany = normalize(company);
  if (!normalizedCompany) {
    return { matched: false, isTrackAligned: false, boost: 0 };
  }

  for (const profile of TARGET_FIRM_PROFILES) {
    const hit = profile.aliases.some((alias) => normalizedCompany.includes(normalize(alias)));
    if (!hit) continue;

    const isTrackAligned = profile.tracks.includes(priorityTrack);
    return {
      matched: true,
      isTrackAligned,
      boost: isTrackAligned ? profile.qualityBoost : Math.max(2, profile.qualityBoost - 5),
      reason: profile.qualityReason,
    };
  }

  return { matched: false, isTrackAligned: false, boost: 0 };
}

