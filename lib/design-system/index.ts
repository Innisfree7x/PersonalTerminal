/**
 * Design System - Main Export
 * Linear-inspired design system for Bloomberg Personal
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './animations';

// Re-export everything as a single design object
import { colors } from './colors';
import { typography } from './typography';
import { layout } from './spacing';
import { animations } from './animations';

export const designSystem = {
  colors,
  typography,
  layout,
  animations,
} as const;

export default designSystem;
