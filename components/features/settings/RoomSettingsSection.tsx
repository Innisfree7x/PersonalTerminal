'use client';

import { PaintRoller } from 'lucide-react';
import { useRoomStyle, ROOM_STYLES, type RoomStyle } from '@/lib/hooks/useRoomStyle';

const STYLE_KEYS: RoomStyle[] = ['cozy', 'minimal', 'neon', 'library'];

export default function RoomSettingsSection() {
  const { style: currentStyle, setStyle } = useRoomStyle();

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        <PaintRoller className="h-5 w-5 text-primary" />
        Raumstil
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {STYLE_KEYS.map((key) => {
          const def = ROOM_STYLES[key];
          const isActive = currentStyle === key;
          return (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                isActive
                  ? 'border-primary/50 bg-primary/5'
                  : 'card-warm border-border hover:border-border/80'
              }`}
            >
              <span className="text-2xl" role="img" aria-label={def.label}>
                {def.preview}
              </span>
              <p className="mt-2 text-sm font-medium text-text-primary">{def.label}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">{def.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
