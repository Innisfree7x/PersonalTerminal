import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton component for loading states
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-full" />
 * <Skeleton className="h-12 w-12 rounded-full" />
 * ```
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-hover/50',
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton variants for common use cases
 */
export const SkeletonCard = ({ className, ...props }: SkeletonProps) => (
  <div
    className={cn(
      'bg-surface border border-border rounded-xl p-4 space-y-3',
      className
    )}
    {...props}
  >
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-20 w-full" />
  </div>
);

export const SkeletonCircle = ({ size = 40, ...props }: { size?: number } & SkeletonProps) => (
  <Skeleton
    className="rounded-full"
    style={{ width: size, height: size }}
    {...props}
  />
);

export const SkeletonText = ({ lines = 3, ...props }: { lines?: number } & SkeletonProps) => (
  <div className="space-y-2" {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-2/3' : 'w-full'
        )}
      />
    ))}
  </div>
);
