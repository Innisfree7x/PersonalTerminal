/**
 * Design System - Colors
 * Linear-inspired color palette
 */

export const colors = {
  // Base Colors (Dark Theme)
  background: {
    primary: '#0A0A0A',      // Almost Black
    secondary: '#141414',    // Cards, Sidebar
    tertiary: '#1A1A1A',     // Hover States
  },

  // Borders
  border: {
    primary: '#262626',      // Subtle Borders
    secondary: '#333333',    // Slightly Visible
    tertiary: '#404040',     // More Visible
  },

  // Text Colors
  text: {
    primary: '#EDEDED',      // Main Text
    secondary: '#A1A1A1',    // Muted Text
    tertiary: '#6B6B6B',     // Very Muted
    inverse: '#0A0A0A',      // Text on light bg
  },

  // Primary (Purple Theme)
  primary: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#A78BFA',          // Light
    500: '#8B5CF6',          // Main - Primary Actions
    600: '#7C3AED',          // Hover
    700: '#6D28D9',          // Active
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Feature-Specific Accents
  accent: {
    goals: '#8B5CF6',        // Purple
    career: '#3B82F6',       // Blue
    university: '#10B981',   // Green
    calendar: '#F59E0B',     // Amber
  },

  // Status Colors
  status: {
    success: {
      light: '#34D399',
      main: '#10B981',
      dark: '#059669',
    },
    warning: {
      light: '#FCD34D',
      main: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      light: '#F87171',
      main: '#EF4444',
      dark: '#DC2626',
    },
    info: {
      light: '#60A5FA',
      main: '#3B82F6',
      dark: '#2563EB',
    },
  },

  // Urgency Colors (for exams, deadlines)
  urgency: {
    urgent: '#EF4444',       // Red - <45 days
    important: '#F59E0B',    // Amber - 45-60 days
    normal: '#3B82F6',       // Blue - >60 days
    none: '#6B6B6B',         // Gray - no deadline
  },

  // Category Colors
  category: {
    career: '#3B82F6',       // Blue
    wellness: '#10B981',     // Green
    learning: '#8B5CF6',     // Purple
    finance: '#F59E0B',      // Amber
    personal: '#EC4899',     // Pink
  },
} as const;

// Export individual color groups for convenience
export const {
  background,
  border,
  text,
  primary,
  accent,
  status,
  urgency,
  category,
} = colors;

// Type exports
export type ColorPalette = typeof colors;
export type BackgroundColor = keyof typeof background;
export type TextColor = keyof typeof text;
export type PrimaryColor = keyof typeof primary;
