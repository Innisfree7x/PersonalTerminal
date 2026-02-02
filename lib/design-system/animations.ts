/**
 * Design System - Animations
 * Smooth transitions and easing functions
 */

// Transition Durations
export const duration = {
  fast: 150,      // ms
  base: 200,      // ms
  slow: 300,      // ms
  slower: 500,    // ms
} as const;

// Easing Functions (Cubic Bezier)
export const easing = {
  // Standard easings
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // Custom easings
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',        // Bouncy spring
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',             // Apple-style smooth
  snappy: 'cubic-bezier(0.4, 0, 0.6, 1)',             // Quick and snappy
} as const;

// Transition Presets
export const transitions = {
  // Fast transitions (hover, active states)
  fast: `${duration.fast}ms ${easing.easeOut}`,
  
  // Base transitions (default for most)
  base: `${duration.base}ms ${easing.easeInOut}`,
  
  // Slow transitions (modals, drawers)
  slow: `${duration.slow}ms ${easing.smooth}`,
  
  // Spring transitions (buttons, checkboxes)
  spring: `${duration.base}ms ${easing.spring}`,
  
  // All properties
  all: `all ${duration.base}ms ${easing.easeInOut}`,
} as const;

// Framer Motion Variants
export const motionVariants = {
  // Page transitions
  page: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  // Fade in
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  // Slide up
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  
  // Slide down
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  
  // Scale
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  
  // List container (for stagger)
  list: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  
  // List item
  listItem: {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  },
} as const;

// Spring configs for Framer Motion
export const springConfig = {
  // Bouncy spring
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },
  
  // Smooth spring
  smooth: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },
  
  // Slow spring
  slow: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 30,
  },
  
  // Snappy
  snappy: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 25,
  },
} as const;

// Keyframes for CSS animations
export const keyframes = {
  // Spin
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  
  // Pulse
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  
  // Bounce
  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },
  
  // Shimmer (for skeleton loading)
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
} as const;

// Export all
export const animations = {
  duration,
  easing,
  transitions,
  motionVariants,
  springConfig,
  keyframes,
} as const;

// Type exports
export type Duration = keyof typeof duration;
export type Easing = keyof typeof easing;
export type Transition = keyof typeof transitions;
