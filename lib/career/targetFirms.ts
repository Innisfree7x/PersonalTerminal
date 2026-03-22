import type { RadarTrack } from '@/lib/schemas/opportunity-radar.schema';

interface TargetFirmProfile {
  id: string;
  label: string;
  segmentLabel: string;
  aliases: string[];
  tracks: RadarTrack[];
  qualityBoost: number;
  qualityReason: string;
  operatingStyle: string;
  entrySignal: string;
}

const TARGET_FIRM_PROFILES: TargetFirmProfile[] = [
  {
    id: 'big4-core',
    label: 'Big4 Deals',
    segmentLabel: 'Deals Platform',
    aliases: ['deloitte', 'ey', 'ernst young', 'kpmg', 'pwc', 'pricewaterhousecoopers'],
    tracks: ['M&A', 'TS', 'Audit', 'CorpFin'],
    qualityBoost: 10,
    qualityReason: 'Top-Track für Studenteneinstieg in Deals',
    operatingStyle: 'klare Prozesse, hoher Deal-Durchsatz und gute Anschlussfähigkeit in Corporate Finance',
    entrySignal: 'ideal, wenn du schnell marktfähige Deal- oder Diligence-Signale im CV willst',
  },
  {
    id: 'tier2-assurance',
    label: 'Tier-2 Advisory',
    segmentLabel: 'Mid-Market Advisory',
    aliases: ['bdo', 'grant thornton', 'mazars', 'forvis', 'rsm', 'ebner stolz', 'roedl', 'rodl'],
    tracks: ['TS', 'Audit', 'CorpFin'],
    qualityBoost: 7,
    qualityReason: 'Starker Mid-Market Career Track',
    operatingStyle: 'breites Mandatsspektrum mit solider Mid-Market-Nähe und sauberem Lernpfad',
    entrySignal: 'stark, wenn du früh Verantwortung statt nur Brand-Prestige priorisierst',
  },
  {
    id: 'ib-global',
    label: 'Global IB',
    segmentLabel: 'Tier-1 Investment Banking',
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
    operatingStyle: 'extrem kompetitives Umfeld mit starkem Signalling und hoher Selektionshürde',
    entrySignal: 'nur sinnvoll, wenn dein Profil bereits scharf genug ist oder du Stretch bewusst mitnimmst',
  },
  {
    id: 'ib-dach',
    label: 'DACH Banking',
    segmentLabel: 'DACH Banking',
    aliases: ['berenberg', 'dz bank', 'commerzbank', 'unicredit', 'oddo', 'hauck'],
    tracks: ['M&A', 'CorpFin'],
    qualityBoost: 8,
    qualityReason: 'DACH Banking Track mit hoher Relevanz',
    operatingStyle: 'regional starke Corporate-Finance- oder Banking-Exposition mit guter Anschlusslogik',
    entrySignal: 'gut, wenn du eine realistischere Banking-Route statt globalem Trophy-Shot willst',
  },
  {
    id: 'ma-boutiques',
    label: 'M&A Boutiques',
    segmentLabel: 'Boutique M&A',
    aliases: ['dc advisory', 'alantra', 'lincoln international', 'lazard', 'rothschild', 'jefferies', 'rothenstein'],
    tracks: ['M&A', 'TS'],
    qualityBoost: 9,
    qualityReason: 'Boutique M&A Fokus mit hoher Deal-Nähe',
    operatingStyle: 'leanere Teams, hohe Nähe zu Modelling, Pitching und Deal-Ausführung',
    entrySignal: 'stark für Profile, die echte M&A-Nähe vor Konzernstruktur suchen',
  },
  {
    id: 'transaction-specialists',
    label: 'Transaction Specialists',
    segmentLabel: 'Transaction Specialists',
    aliases: ['wts', 'fti consulting', 'kroll', 'kern advisory'],
    tracks: ['TS', 'CorpFin'],
    qualityBoost: 7,
    qualityReason: 'Transaktionsspezialisiert und praxisnah',
    operatingStyle: 'spezialisiertes Projektgeschäft mit klarer FDD-/Transaction-Exposure',
    entrySignal: 'gut für Studierende, die ein klar lesbares Deals-Signal aufbauen wollen',
  },
];

export interface TargetFirmSignal {
  matched: boolean;
  isTrackAligned: boolean;
  boost: number;
  reason?: string;
}

export interface TargetFirmLens {
  id: string;
  label: string;
  segmentLabel: string;
  matched: boolean;
  isTrackAligned: boolean;
  boost: number;
  qualityReason: string;
  operatingStyle: string;
  entrySignal: string;
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findTargetFirmProfile(company: string): TargetFirmProfile | null {
  const normalizedCompany = normalize(company);
  if (!normalizedCompany) return null;

  for (const profile of TARGET_FIRM_PROFILES) {
    const hit = profile.aliases.some((alias) => normalizedCompany.includes(normalize(alias)));
    if (hit) return profile;
  }

  return null;
}

export function getTargetFirmLens(company: string, priorityTrack: RadarTrack): TargetFirmLens | null {
  const profile = findTargetFirmProfile(company);
  if (!profile) return null;

  const isTrackAligned = profile.tracks.includes(priorityTrack);
  return {
    id: profile.id,
    label: profile.label,
    segmentLabel: profile.segmentLabel,
    matched: true,
    isTrackAligned,
    boost: isTrackAligned ? profile.qualityBoost : Math.max(2, profile.qualityBoost - 5),
    qualityReason: profile.qualityReason,
    operatingStyle: profile.operatingStyle,
    entrySignal: profile.entrySignal,
  };
}

export function matchTargetFirmSignal(company: string, priorityTrack: RadarTrack): TargetFirmSignal {
  const lens = getTargetFirmLens(company, priorityTrack);
  if (lens) {
    return {
      matched: true,
      isTrackAligned: lens.isTrackAligned,
      boost: lens.boost,
      reason: lens.qualityReason,
    };
  }
  return { matched: false, isTrackAligned: false, boost: 0 };
}
