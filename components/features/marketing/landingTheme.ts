'use client';

import type { CSSProperties } from 'react';

type CssVarStyle = CSSProperties & Record<`--${string}`, string>;

export const landingThemeStyle: CssVarStyle = {
  '--background': '2 2 4',
  '--surface': '8 8 12',
  '--surface-hover': '14 14 20',
  '--text-primary': '245 245 247',
  '--text-secondary': '161 161 170',
  '--text-tertiary': '82 82 91',
  '--primary': '139 92 246',
  '--primary-hover': '124 58 237',
  '--primary-secondary': '59 130 246',
  '--border': '24 24 27',
  '--border-secondary': '39 39 42',
};
