'use client';

export type ChampionId = 'lucian' | 'aphelios';

export const CHAMPION_CONFIG: Record<
  ChampionId,
  {
    name: string;
    spriteSheet: string;
    frameSize: number;
    sheetColumns: number;
    sheetRows: number;
    colors: {
      primaryFrom: string;
      primaryTo: string;
      q: string;
      w: string;
      e: string;
      r: string;
    };
  }
> = {
  lucian: {
    name: 'Lucian',
    // Lucian-like pixel sheet (in-repo fallback until final handcrafted sheet lands).
    spriteSheet: '/sprites/lucian-sprites.svg',
    frameSize: 48,
    sheetColumns: 8,
    sheetRows: 10,
    colors: {
      primaryFrom: 'from-sky-300',
      primaryTo: 'to-blue-500',
      q: '#7CC7FF',
      w: '#BFE4FF',
      e: '#7EF0D6',
      r: '#B9DFFF',
    },
  },
  aphelios: {
    name: 'Aphelios',
    spriteSheet: '/sprites/aphelios-gunner-sprites.png',
    frameSize: 48,
    sheetColumns: 8,
    sheetRows: 10,
    colors: {
      primaryFrom: 'from-fuchsia-500',
      primaryTo: 'to-cyan-400',
      q: '#d8b4fe',
      w: '#fb7185',
      e: '#a78bfa',
      r: '#22d3ee',
    },
  },
};
