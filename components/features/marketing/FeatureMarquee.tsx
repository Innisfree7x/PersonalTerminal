'use client';

const items = [
  'Today',
  'Fokus-Timer',
  'Kursmanagement',
  'Ziele',
  'Bewerbungen',
  'Analytics',
  'Lucian',
  'Prüfungen',
  'Streak',
  'Kalender',
];

function MarqueeItem({ label }: { label: string }) {
  return (
    <>
      <span className="text-sm font-medium tracking-wide text-zinc-500">{label}</span>
      <span className="mx-4 text-sm text-red-500/40">·</span>
    </>
  );
}

export function FeatureMarquee() {
  return (
    <div className="relative overflow-hidden border-y border-white/[0.06] py-4 [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]">
      <div
        className="flex w-max"
        style={{ animation: 'marquee 30s linear infinite' }}
      >
        {/* Two identical copies for seamless loop */}
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {items.map((item) => (
              <MarqueeItem key={`${copy}-${item}`} label={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
