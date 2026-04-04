'use client';

import type { CSSProperties } from 'react';

type CssVarStyle = CSSProperties & Record<`--${string}`, string>;

export const landingThemeStyle: CssVarStyle = {
  '--background': '2 2 4',
  '--surface': '10 8 8',
  '--surface-hover': '18 14 13',
  '--text-primary': '250 240 230',
  '--text-secondary': '174 162 146',
  '--text-tertiary': '103 96 87',
  '--primary': '232 185 48',
  '--primary-hover': '245 158 11',
  '--primary-secondary': '220 56 56',
  '--border': '38 27 22',
  '--border-secondary': '61 43 35',
};
