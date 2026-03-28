'use client';

export default function SettingsSectionSkeleton({
  titleWidth = 'w-40',
  rows = 2,
}: {
  titleWidth?: string;
  rows?: number;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className={`h-6 animate-pulse rounded bg-white/[0.06] ${titleWidth}`} />
        <div className="h-6 w-24 animate-pulse rounded-full bg-white/[0.05]" />
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-xl bg-white/[0.03]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
