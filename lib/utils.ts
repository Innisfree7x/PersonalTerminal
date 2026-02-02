import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge
 * Useful for conditional className combinations
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
