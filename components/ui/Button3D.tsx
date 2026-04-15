'use client';

import { forwardRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Button3DVariant = 'primary' | 'success' | 'warning' | 'danger';
type Button3DSize = 'sm' | 'md' | 'lg';

interface Button3DProps extends Omit<HTMLMotionProps<'button'>, 'className'> {
  variant?: Button3DVariant;
  size?: Button3DSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const variantConfig: Record<Button3DVariant, { face: string; bottom: string; text: string }> = {
  primary: {
    face: 'bg-primary',
    bottom: 'bg-primary-hover',
    text: 'text-white',
  },
  success: {
    face: 'bg-emerald-500',
    bottom: 'bg-emerald-700',
    text: 'text-white',
  },
  warning: {
    face: 'bg-amber-500',
    bottom: 'bg-amber-700',
    text: 'text-white',
  },
  danger: {
    face: 'bg-red-500',
    bottom: 'bg-red-700',
    text: 'text-white',
  },
};

const sizeStyles: Record<Button3DSize, string> = {
  sm: 'h-9 px-3.5 text-xs font-semibold rounded-xl',
  md: 'h-11 px-5 text-sm font-semibold rounded-xl',
  lg: 'h-13 px-7 text-base font-bold rounded-2xl',
};

/**
 * Duolingo-style 3D button with physical press-down effect.
 * Use for interactive reward moments (task complete, start focus, etc.)
 */
export const Button3D = forwardRef<HTMLButtonElement, Button3DProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const config = variantConfig[variant];

    const tapProps: { whileTap?: { y: number } } = {};
    if (!isDisabled) tapProps.whileTap = { y: 3 };

    return (
      <motion.button
        ref={ref}
        {...tapProps}
        transition={{ type: 'spring', stiffness: 600, damping: 20, mass: 0.5 }}
        className={cn(
          // Outer wrapper: creates the 3D depth via bottom border
          'relative inline-flex items-center justify-center gap-2',
          'select-none',
          config.face,
          config.text,
          sizeStyles[size],
          // 3D depth: 4px bottom shadow
          'border-b-[4px]',
          config.bottom.replace('bg-', 'border-b-'),
          // Press state: shrink bottom border
          'active:border-b-[2px] active:translate-y-[2px]',
          // Hover: slight brightness
          'hover:brightness-110',
          // Disabled
          'disabled:opacity-50 disabled:pointer-events-none',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button3D.displayName = 'Button3D';
