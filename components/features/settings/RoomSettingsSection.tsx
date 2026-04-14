'use client';

import { PaintRoller } from 'lucide-react';
import { useRoomStyle, ROOM_STYLES, type RoomStyle } from '@/lib/hooks/useRoomStyle';

const STYLE_KEYS: RoomStyle[] = ['cozy', 'minimal', 'neon', 'library'];

export default function RoomSettingsSection() {
  const { style: currentStyle, setStyle } = useRoomStyle();

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
        <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(232,185,48,0.42),transparent)]" />
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-tertiary">
                Room Ambience
              </p>
              <h2 className="mt-2 flex items-center gap-2 text-lg font-semibold text-text-primary">
                <PaintRoller className="h-5 w-5 text-primary" />
                Raumstil
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-text-secondary">
                Bestimmt Licht, Möbel, Monitor-Glow und die Atmosphäre in Lucians Raum auf
                Today.
              </p>
            </div>
            <div className="hidden rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary sm:inline-flex">
              Live in Today
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {STYLE_KEYS.map((key) => {
          const def = ROOM_STYLES[key];
          const isActive = currentStyle === key;
          return (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-primary/45 bg-primary/[0.08] shadow-[0_0_0_1px_rgba(232,185,48,0.08)]'
                  : 'bg-black/15 border-border hover:border-white/[0.14] hover:bg-white/[0.02]'
              }`}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background: isActive
                    ? `linear-gradient(90deg, transparent, ${def.accentColor}88, transparent)`
                    : `linear-gradient(90deg, transparent, ${def.accentColor}44, transparent)`,
                }}
              />
              <div
                className="relative h-24 overflow-hidden rounded-lg border border-white/[0.08]"
                style={{ background: `linear-gradient(180deg, ${def.wallColor} 0%, ${def.floorColor} 100%)` }}
              >
                {def.ambientGlowOnWall ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: `radial-gradient(circle at 50% 35%, ${def.ambientGlowOnWall} 0%, transparent 68%)` }}
                  />
                ) : null}
                <div
                  className="absolute left-3 top-3 h-7 w-12 rounded-md border border-white/[0.06]"
                  style={{ background: def.monitorFrameColor }}
                >
                  <div
                    className="absolute inset-[3px] rounded-[4px]"
                    style={{
                      background: def.monitorScreenColor,
                      boxShadow: `0 0 12px ${def.monitorScreenGlow}`,
                    }}
                  />
                </div>
                <div
                  className="absolute inset-x-0 bottom-0 h-8"
                  style={{ background: def.floorColor }}
                />
                <div
                  className="absolute bottom-7 left-3 right-3 h-2 rounded-sm"
                  style={{ background: def.deskColor }}
                />
                <div
                  className="absolute bottom-9 right-5 flex items-end gap-1.5"
                >
                  {def.bookPalette.slice(0, 4).map((color) => (
                    <span
                      key={`${key}-${color}`}
                      className="block w-2 rounded-t-sm"
                      style={{ height: '20px', background: color }}
                    />
                  ))}
                </div>
                <div
                  className="absolute bottom-[34px] left-16 h-2.5 w-2.5 rounded-full"
                  style={{ background: def.mugColor }}
                />
                <div
                  className="absolute bottom-[34px] left-[84px] h-1.5 w-6 rounded-sm"
                  style={{ background: def.notebookColor }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${def.accentColor}66, transparent)` }}
                />
              </div>

              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base" role="img" aria-label={def.label}>
                      {def.preview}
                    </span>
                    <p className="text-sm font-medium text-text-primary">{def.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">{def.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {isActive ? (
                    <span className="inline-flex rounded-full border border-primary/25 bg-primary/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
                      Aktiv
                    </span>
                  ) : null}
                  <span
                    className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
                    style={{
                      borderColor: `${def.accentColor}55`,
                      color: def.accentColor,
                      background: `${def.accentColor}12`,
                    }}
                  >
                    Accent
                  </span>
                </div>
              </div>
            </button>
          );
        })}
          </div>
        </div>
      </div>
    </section>
  );
}
