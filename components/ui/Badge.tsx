import { HTMLAttributes, forwardRef } from 'react';

export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'urgent'
  | 'important'
  | 'normal'
  | 'goals'
  | 'career'
  | 'university'
  | 'calendar';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-hover border border-border text-text-secondary',
  primary: 'bg-primary/10 border border-primary/20 text-primary-light',
  success: 'bg-success/10 border border-success/20 text-success',
  warning: 'bg-warning/10 border border-warning/20 text-warning',
  error: 'bg-error/10 border border-error/20 text-error',
  info: 'bg-info/10 border border-info/20 text-info',
  
  // Urgency variants
  urgent: 'bg-urgent/10 border border-urgent/20 text-urgent',
  important: 'bg-important/10 border border-important/20 text-important',
  normal: 'bg-normal/10 border border-normal/20 text-normal',
  
  // Feature variants
  goals: 'bg-accent-goals/10 border border-accent-goals/20 text-accent-goals',
  career: 'bg-accent-career/10 border border-accent-career/20 text-accent-career',
  university: 'bg-accent-university/10 border border-accent-university/20 text-accent-university',
  calendar: 'bg-accent-calendar/10 border border-accent-calendar/20 text-accent-calendar',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-text-secondary',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  urgent: 'bg-urgent',
  important: 'bg-important',
  normal: 'bg-normal',
  goals: 'bg-accent-goals',
  career: 'bg-accent-career',
  university: 'bg-accent-university',
  calendar: 'bg-accent-calendar',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5
          rounded-full font-medium
          transition-all duration-fast
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {dot && (
          <span
            className={`
              w-1.5 h-1.5 rounded-full
              ${dotColors[variant]}
            `}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge (with predefined statuses)
export type Status = 'active' | 'completed' | 'pending' | 'cancelled' | 'failed';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: Status;
}

const statusConfig: Record<Status, { variant: BadgeVariant; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  completed: { variant: 'success', label: 'Completed' },
  pending: { variant: 'warning', label: 'Pending' },
  cancelled: { variant: 'default', label: 'Cancelled' },
  failed: { variant: 'error', label: 'Failed' },
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const config = statusConfig[status];
    
    return (
      <Badge ref={ref} variant={config.variant} dot {...props}>
        {children || config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Priority Badge
export type Priority = 'low' | 'medium' | 'high';

export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: Priority;
}

const priorityConfig: Record<Priority, { variant: BadgeVariant; label: string }> = {
  low: { variant: 'default', label: 'Low' },
  medium: { variant: 'warning', label: 'Medium' },
  high: { variant: 'error', label: 'High' },
};

export const PriorityBadge = forwardRef<HTMLSpanElement, PriorityBadgeProps>(
  ({ priority, children, ...props }, ref) => {
    const config = priorityConfig[priority];
    
    return (
      <Badge ref={ref} variant={config.variant} dot {...props}>
        {children || config.label}
      </Badge>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';
