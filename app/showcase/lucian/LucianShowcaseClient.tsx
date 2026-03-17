'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { LucianBubble } from '@/components/features/lucian/LucianBubble';
import type { LucianMood } from '@/lib/lucian/copy';

const MOODS: Array<{ value: LucianMood; label: string; text: string }> = [
  {
    value: 'motivate',
    label: 'Motivate',
    text: 'Kein perfekter Moment. Den schaffst du dir.',
  },
  {
    value: 'celebrate',
    label: 'Celebrate',
    text: 'Heute hast du etwas bewiesen. Merk dir das Gefühl.',
  },
  {
    value: 'warning',
    label: 'Warning',
    text: 'Klausur in 2 Tagen. Panik ist kein Plan. Ich hab einen. Du auch.',
  },
  {
    value: 'recovery',
    label: 'Recovery',
    text: 'Reset ist kein Versagen. Versagen ist aufzuhören.',
  },
  {
    value: 'idle',
    label: 'Idle',
    text: 'Ich bin hier. Nicht aufdringlich. Aber hier.',
  },
];

function isLucianMood(value: string | null): value is LucianMood {
  return MOODS.some((entry) => entry.value === value);
}

export function LucianShowcaseClient() {
  const searchParams = useSearchParams();
  const moodParam = searchParams.get('mood');
  const mood = isLucianMood(moodParam) ? moodParam : 'celebrate';
  const withAction = searchParams.get('action') === '1';

  const current = useMemo(
    () => MOODS.find((entry) => entry.value === mood) ?? MOODS[1]!,
    [mood]
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_24%),linear-gradient(180deg,#090b10_0%,#0d1119_54%,#0a0b0f_100%)] px-6 py-8 text-zinc-100">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-6">
        <div className="max-w-xl space-y-4">
          <Link
            href="/showcase"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zum Showcase
          </Link>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300/85">
              Lucian V2 Review
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-zinc-50">
              Bubble-, Mood- und Sprite-Preview
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">
              Reproduzierbarer Browser-Review für die produktive Lucian-Bubble. Mood und Action-State
              lassen sich direkt über die URL wechseln, ohne Dashboard-Login.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {MOODS.map((entry) => {
              const active = entry.value === mood;
              const href = `/showcase/lucian?mood=${entry.value}${withAction ? '&action=1' : ''}`;
              return (
                <Link
                  key={entry.value}
                  href={href}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'border-amber-300/40 bg-amber-400/12 text-amber-100'
                      : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                >
                  {entry.label}
                </Link>
              );
            })}

            <Link
              href={`/showcase/lucian?mood=${mood}&action=${withAction ? '0' : '1'}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                withAction
                  ? 'border-cyan-300/40 bg-cyan-400/12 text-cyan-100'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              {withAction ? 'Action aktiv' : 'Action anzeigen'}
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1119]/55 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Review-Kontext
            </div>
            <div className="mt-4 grid gap-3 text-sm text-zinc-300">
              <p>
                <span className="text-zinc-500">Mood:</span> {current.label}
              </p>
              <p>
                <span className="text-zinc-500">Text:</span> {current.text}
              </p>
              <p>
                <span className="text-zinc-500">Action:</span> {withAction ? 'sichtbar' : 'aus'}
              </p>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[620px] min-w-[420px] flex-1 lg:block">
          <div className="relative min-h-[620px] overflow-hidden rounded-[40px] border border-white/10 bg-black/25 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(56,189,248,0.08),transparent_28%),radial-gradient(circle_at_78%_20%,rgba(251,191,36,0.08),transparent_24%),radial-gradient(circle_at_60%_80%,rgba(239,68,68,0.06),transparent_20%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:36px_36px]" />

            <div
              data-lucian-preview-anchor="true"
              className="absolute bottom-8 left-8 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-[#0d1119]/95 shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
            >
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_60%)]" />
              <span className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                Lucian
              </span>
            </div>
          </div>

          <LucianBubble
            text={current.text}
            mood={mood}
            ariaRole={mood === 'warning' ? 'alert' : 'status'}
            visible
            anchorSelector='[data-lucian-preview-anchor="true"]'
            onDismiss={() => undefined}
            onMuteToday={() => undefined}
            onPause={() => undefined}
            onResume={() => undefined}
            {...(withAction
              ? {
                  actionLabel: 'Start 60s Drill',
                  actionAriaLabel: 'Lucian Drill starten',
                  onAction: () => undefined,
                }
              : {})}
          />
        </div>
      </div>
    </div>
  );
}
