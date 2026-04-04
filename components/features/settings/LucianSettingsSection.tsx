'use client';

import { User, Lock } from 'lucide-react';
import { useLucianOutfit } from '@/lib/hooks/useLucianOutfit';
import { OUTFITS, type LucianOutfit } from '@/lib/lucian/outfits';
import { ACHIEVEMENTS } from '@/lib/achievements/registry';

const OUTFIT_KEYS: LucianOutfit[] = ['default', 'scholar', 'hacker', 'champion'];

export default function LucianSettingsSection() {
  const { outfit: currentOutfit, setOutfit, availableOutfits } = useLucianOutfit();
  const availableKeys = new Set(availableOutfits.map((o) => o.key));

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        <User className="h-5 w-5 text-primary" />
        Lucian Outfit
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {OUTFIT_KEYS.map((key) => {
          const def = OUTFITS[key];
          const isActive = currentOutfit === key;
          const isLocked = !availableKeys.has(key);
          const requiredAchievement = def.unlockedBy
            ? ACHIEVEMENTS.find((a) => a.key === def.unlockedBy)
            : null;

          return (
            <button
              key={key}
              onClick={() => { if (!isLocked) setOutfit(key); }}
              disabled={isLocked}
              className={`relative rounded-xl border p-4 text-left transition-colors ${
                isLocked
                  ? 'opacity-50 cursor-not-allowed border-border bg-surface'
                  : isActive
                    ? 'border-primary/50 bg-primary/5'
                    : 'card-warm border-border hover:border-border/80'
              }`}
            >
              {isLocked && (
                <span className="absolute top-2 right-2">
                  <Lock className="h-4 w-4 text-text-tertiary" />
                </span>
              )}
              <p className="text-sm font-medium text-text-primary">{def.label}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">{def.description}</p>
              {isLocked && requiredAchievement && (
                <p className="mt-1.5 text-[11px] text-text-tertiary">
                  Benötigt: {requiredAchievement.title}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
