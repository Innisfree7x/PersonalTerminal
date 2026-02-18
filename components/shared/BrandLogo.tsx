import clsx from 'clsx';

type BrandMarkProps = {
  sizeClassName?: string;
  className?: string;
};

export function BrandMark({ sizeClassName = 'h-8 w-8', className }: BrandMarkProps) {
  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-red-500 via-red-600 to-red-700 shadow-[0_0_24px_rgba(239,68,68,0.28)] ring-1 ring-white/20',
        sizeClassName,
        className
      )}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/16 to-transparent" />
      <div className="relative h-[62%] w-[42%]">
        <span className="absolute inset-y-[12%] left-1/2 w-[30%] -translate-x-1/2 rounded-full bg-white" />
        <span className="absolute top-[2%] left-1/2 h-[18%] w-full -translate-x-1/2 rounded-full bg-white" />
        <span className="absolute bottom-[2%] left-1/2 h-[16%] w-full -translate-x-1/2 rounded-full bg-white/95" />
      </div>
    </div>
  );
}

type BrandLockupProps = {
  sizeClassName?: string;
  className?: string;
  wordmarkClassName?: string;
};

export function BrandLockup({
  sizeClassName = 'h-8 w-8',
  className,
  wordmarkClassName = 'font-semibold tracking-tight',
}: BrandLockupProps) {
  return (
    <div className={clsx('inline-flex items-center gap-2.5', className)}>
      <BrandMark sizeClassName={sizeClassName} />
      <span className={wordmarkClassName}>INNIS</span>
    </div>
  );
}
