/**
 * Centralized color utilities for consistent styling across the app
 * Maps categories, statuses, and percentages to Tailwind color classes
 */

/**
 * Category types used throughout the application
 */
export type CategoryType = 'task' | 'goal' | 'exercise' | 'application' | 'note' | 'calendar' | 'career' | 'university';

/**
 * Event density levels for calendar displays
 */
export type EventDensity = 'none' | 'low' | 'medium' | 'high';

/**
 * Urgency levels for tasks and items
 */
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Get color classes for a specific category
 * Returns both text and background colors
 * 
 * @param category - The category type
 * @returns Object with text and bg color classes
 * 
 * @example
 * const colors = getCategoryColors('goal');
 * // Returns: { text: 'text-goals-accent', bg: 'bg-goals-accent/10' }
 */
export function getCategoryColors(category: CategoryType): { text: string; bg: string } {
  switch (category) {
    case 'task':
      return { text: 'text-success', bg: 'bg-success/10' };
    case 'goal':
      return { text: 'text-goals-accent', bg: 'bg-goals-accent/10' };
    case 'exercise':
    case 'university':
      return { text: 'text-university-accent', bg: 'bg-university-accent/10' };
    case 'application':
    case 'career':
      return { text: 'text-career-accent', bg: 'bg-career-accent/10' };
    case 'calendar':
      return { text: 'text-calendar-accent', bg: 'bg-calendar-accent/10' };
    case 'note':
      return { text: 'text-primary', bg: 'bg-primary/10' };
    default:
      return { text: 'text-text-secondary', bg: 'bg-surface-hover' };
  }
}

/**
 * Get combined color classes as a single string
 * 
 * @param category - The category type
 * @returns Combined text and background classes
 * 
 * @example
 * <div className={getCategoryColorClasses('task')}>
 *   // Applies: 'text-success bg-success/10'
 * </div>
 */
export function getCategoryColorClasses(category: CategoryType): string {
  const colors = getCategoryColors(category);
  return `${colors.text} ${colors.bg}`;
}

/**
 * Get color based on percentage completion
 * Used for progress indicators
 * 
 * @param percentage - Completion percentage (0-100)
 * @returns Tailwind color class
 * 
 * @example
 * const color = getPercentageColor(85); // Returns: 'stroke-success'
 */
export function getPercentageColor(percentage: number): string {
  if (percentage >= 80) return 'stroke-success';
  if (percentage >= 50) return 'stroke-info';
  if (percentage >= 25) return 'stroke-warning';
  return 'stroke-error';
}

/**
 * Get glow color for percentage-based displays
 * Used for shadow effects on circular progress
 * 
 * @param percentage - Completion percentage (0-100)
 * @returns Tailwind drop-shadow class
 * 
 * @example
 * const glow = getPercentageGlow(85);
 * // Returns: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
 */
export function getPercentageGlow(percentage: number): string {
  if (percentage >= 80) return 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'; // success green
  if (percentage >= 50) return 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'; // info blue
  if (percentage >= 25) return 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'; // warning yellow
  return 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'; // error red
}

/**
 * Get color for urgency level
 * Used for task priority indicators
 * 
 * @param urgency - The urgency level
 * @returns Object with text and bg colors
 * 
 * @example
 * const colors = getUrgencyColors('urgent');
 * // Returns: { text: 'text-error', bg: 'bg-error/10' }
 */
export function getUrgencyColors(urgency: UrgencyLevel): { text: string; bg: string } {
  switch (urgency) {
    case 'urgent':
      return { text: 'text-error', bg: 'bg-error/10' };
    case 'high':
      return { text: 'text-warning', bg: 'bg-warning/10' };
    case 'medium':
      return { text: 'text-info', bg: 'bg-info/10' };
    case 'low':
      return { text: 'text-success', bg: 'bg-success/10' };
    default:
      return { text: 'text-text-secondary', bg: 'bg-surface-hover' };
  }
}

/**
 * Get color for event density in calendar views
 * 
 * @param density - The event density level
 * @returns Tailwind color classes (bg and border)
 * 
 * @example
 * const colors = getEventDensityColor('high');
 * // Returns: 'bg-error/20 border-error/50'
 */
export function getEventDensityColor(density: EventDensity): string {
  switch (density) {
    case 'none':
      return 'bg-surface-hover border-border';
    case 'low':
      return 'bg-success/20 border-success/50';
    case 'medium':
      return 'bg-warning/20 border-warning/50';
    case 'high':
      return 'bg-error/20 border-error/50';
    default:
      return 'bg-surface-hover border-border';
  }
}

/**
 * Get emoji indicator for event density
 * 
 * @param density - The event density level
 * @returns Emoji string or null
 * 
 * @example
 * const emoji = getEventDensityEmoji('high'); // Returns: '🔴'
 */
export function getEventDensityEmoji(density: EventDensity): string | null {
  switch (density) {
    case 'none':
      return null;
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🔴';
    default:
      return null;
  }
}

/**
 * Get text color based on status
 * Used for status badges and indicators
 * 
 * @param status - The status string
 * @returns Tailwind text color class
 * 
 * @example
 * const color = getStatusColor('completed'); // Returns: 'text-success'
 */
export function getStatusColor(status: string): string {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('complet') || lowerStatus.includes('done') || lowerStatus.includes('success')) {
    return 'text-success';
  }
  if (lowerStatus.includes('progress') || lowerStatus.includes('active') || lowerStatus.includes('working')) {
    return 'text-info';
  }
  if (lowerStatus.includes('pending') || lowerStatus.includes('wait')) {
    return 'text-warning';
  }
  if (lowerStatus.includes('error') || lowerStatus.includes('fail') || lowerStatus.includes('reject')) {
    return 'text-error';
  }
  
  return 'text-text-secondary';
}
