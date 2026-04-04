export type LucianOutfit = 'default' | 'scholar' | 'hacker' | 'champion';

export interface OutfitDef {
  key: LucianOutfit;
  label: string;
  description: string;
  spriteSheet: string;
  unlockedBy?: string;
}

export const OUTFITS: Record<LucianOutfit, OutfitDef> = {
  default: {
    key: 'default',
    label: 'Standard',
    description: 'Lucians normales Outfit',
    spriteSheet: '/sprites/lucian-sprites-v3.svg',
  },
  scholar: {
    key: 'scholar',
    label: 'Scholar',
    description: 'Freigeschaltet durch 5 Module bestehen',
    spriteSheet: '/sprites/lucian-scholar.svg',
    unlockedBy: 'five_modules',
  },
  hacker: {
    key: 'hacker',
    label: 'Hacker',
    description: 'Freigeschaltet durch 100-Tage-Streak',
    spriteSheet: '/sprites/lucian-hacker.svg',
    unlockedBy: 'hundred_streak',
  },
  champion: {
    key: 'champion',
    label: 'Champion',
    description: 'Freigeschaltet durch Trajectory im grünen Bereich',
    spriteSheet: '/sprites/lucian-champion.svg',
    unlockedBy: 'trajectory_green',
  },
};

const VALID_OUTFITS = new Set<string>(Object.keys(OUTFITS));
const OUTFIT_KEYS = Object.keys(OUTFITS) as LucianOutfit[];

export function isValidOutfit(v: unknown): v is LucianOutfit {
  return typeof v === 'string' && VALID_OUTFITS.has(v);
}

export function getAvailableOutfits(unlockedKeys: string[]): OutfitDef[] {
  const unlocked = new Set(unlockedKeys);
  return OUTFIT_KEYS
    .map((k) => OUTFITS[k])
    .filter((o) => !o.unlockedBy || unlocked.has(o.unlockedBy));
}
