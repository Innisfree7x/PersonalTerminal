'use client';

import LucianRoom from '@/components/features/room/LucianRoom';
import type { RoomState, ActiveRoomItems } from '@/lib/room/roomState';
import type { LucianOutfit } from '@/lib/lucian/outfits';
import { ROOM_STYLES, type RoomStyle } from '@/lib/hooks/useRoomStyle';
import { ChevronRight } from 'lucide-react';

export interface AmbientRoomPanelProps {
  roomState: RoomState;
  roomStyle: RoomStyle;
  roomItems: ActiveRoomItems;
  outfit: LucianOutfit;
  morningMessage?: string | undefined;
  onExpand?: (() => void) | undefined;
}

export default function AmbientRoomPanel({
  roomState,
  roomStyle,
  roomItems,
  outfit,
  morningMessage,
  onExpand,
}: AmbientRoomPanelProps) {
  const theme = ROOM_STYLES[roomStyle];

  return (
    <div
      className="relative h-[120px] w-full overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.05)]"
      data-testid="ambient-room-panel"
    >
      <div className="pointer-events-none absolute inset-0">
        <LucianRoom
          state={roomState}
          roomItems={roomItems}
          lucianOutfit={outfit}
          roomStyle={roomStyle}
          className="h-full w-full"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-transparent opacity-70" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-32"
        style={{ background: `linear-gradient(90deg, ${theme.accentColor}18, transparent 72%)` }}
      />

      <div className="relative z-10 flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-black/32 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-sm">{theme.preview}</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
            {theme.label} Room
          </span>
        </div>

        {morningMessage && (
          <div className="mx-4 hidden max-w-md flex-1 truncate text-[12px] italic text-white/70 sm:block">
            &bdquo;{morningMessage}&ldquo;
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/32 px-2 py-1 backdrop-blur-sm">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: theme.accentColor,
                boxShadow: `0 0 8px ${theme.accentColor}77`,
              }}
            />
            <span className="text-[10px] text-white/55">live</span>
          </div>
          <button
            type="button"
            onClick={onExpand}
            disabled={!onExpand}
            title={onExpand ? 'Raum öffnen' : 'Raum-Vollansicht kommt bald'}
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.06] px-2.5 py-1 text-[10.5px] font-medium text-white/75 transition-all hover:border-white/25 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Öffnen
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
