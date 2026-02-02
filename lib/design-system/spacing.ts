/**
 * Design System - Spacing
 * 8px grid system
 */

export const spacing = {
  // Base spacing units (8px grid)
  0: '0px',
  1: '4px',      // 0.5 * 8
  2: '8px',      // 1 * 8
  3: '12px',     // 1.5 * 8
  4: '16px',     // 2 * 8
  5: '20px',     // 2.5 * 8
  6: '24px',     // 3 * 8
  8: '32px',     // 4 * 8
  10: '40px',    // 5 * 8
  12: '48px',    // 6 * 8
  16: '64px',    // 8 * 8
  20: '80px',    // 10 * 8
  24: '96px',    // 12 * 8
  32: '128px',   // 16 * 8
} as const;

// Specific spacing for common use cases
export const spacingPresets = {
  cardPadding: spacing[4],      // 16px
  cardGap: spacing[6],          // 24px
  sectionGap: spacing[12],      // 48px
  pageMargin: spacing[8],       // 32px
  iconSize: {
    sm: spacing[4],             // 16px
    md: spacing[5],             // 20px
    lg: spacing[6],             // 24px
  },
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6)',
  glow: '0 0 20px rgb(139 92 246 / 0.3)',         // Purple glow
  glowLg: '0 0 40px rgb(139 92 246 / 0.4)',       // Larger purple glow
} as const;

// Blur
export const blur = {
  sm: 'blur(4px)',
  md: 'blur(8px)',
  lg: 'blur(16px)',
  xl: 'blur(24px)',
} as const;

// Export all
export const layout = {
  spacing,
  spacingPresets,
  borderRadius,
  shadows,
  blur,
} as const;

// Type exports
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
