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
    spriteSheet: '/sprites/lucian-sprites-v3.svg',
    frameSize: 64,
    sheetColumns: 8,
    sheetRows: 10,
    colors: {
      primaryFrom: 'from-cyan-400',
      primaryTo: 'to-orange-500',
      q: '#F97316',
      w: '#FBBF24',
      e: '#22D3EE',
      r: '#F97316',
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
