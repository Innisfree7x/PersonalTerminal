/**
 * Design System - Typography
 * Linear-inspired typography system
 */

export const typography = {
  // Font Families
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  },

  // Font Weights
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Font Sizes
  fontSize: {
    xs: '11px',      // Labels, Meta
    sm: '13px',      // Body Small
    base: '14px',    // Body Default
    lg: '16px',      // Large Body
    xl: '20px',      // Subheadings
    '2xl': '24px',   // Headings
    '3xl': '32px',   // Page Titles
    '4xl': '40px',   // Hero Titles
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
} as const;

// Export individual typography groups
export const {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
} = typography;

// Type exports
export type Typography = typeof typography;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
