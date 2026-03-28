'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
import { useChampion } from '@/components/providers/ChampionProvider';
import { useSoundToast } from '@/lib/hooks/useSoundToast';

const championVfxPresetDescriptions = {
  de: {
    performance: 'Niedrigste VFX-Last für ältere Geräte und maximale Flüssigkeit.',
    balanced: 'Standard-Preset mit starker Lesbarkeit und stabiler Performance.',
    cinematic: 'Aufwendigeres Spell-Polish mit dichteren Partikeln und längerem Nachglühen.',
  },
  en: {
    performance: 'Lowest VFX load for older devices and maximum smoothness.',
    balanced: 'Default preset with strong readability and stable performance.',
    cinematic: 'Heavier spell polish with denser particles and longer afterglow.',
  },
} as const;

export default function ChampionSettingsSection() {
  const { language, copy } = useAppLanguage();
  const {
    settings: championSettings,
    updateSettings: updateChampionSettings,
    resetPosition: resetChampionPosition,
    restoreDefaults: restoreChampionDefaults,
    stats: championStats,
  } = useChampion();
  const soundToast = useSoundToast();
  const isGerman = language === 'de';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          {copy.settings.champion}
        </h2>
      </div>

      <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">{isGerman ? 'Champion aktiv' : 'Champion enabled'}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{isGerman ? 'Desktop-Pet-Overlay mit LoL-Steuerung' : 'Desktop pet overlay with LoL controls'}</p>
          </div>
          <ToggleSwitch
            enabled={championSettings.enabled}
            onChange={(v) => updateChampionSettings({ enabled: v })}
            ariaLabel={championSettings.enabled ? (isGerman ? 'Champion deaktivieren' : 'Disable champion') : (isGerman ? 'Champion aktivieren' : 'Enable champion')}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Champion' : 'Champion'}</label>
            <select
              value={championSettings.champion}
              onChange={(event) => updateChampionSettings({ champion: event.target.value as 'lucian' | 'aphelios' })}
              className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="lucian">Lucian (Chibi Sprite V2)</option>
              <option value="aphelios">Aphelios</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Sprite-Größe' : 'Sprite size'}</label>
            <select
              value={championSettings.renderScale}
              onChange={(event) => updateChampionSettings({ renderScale: event.target.value as 'small' | 'normal' | 'large' })}
              className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="small">{isGerman ? 'Klein' : 'Small'}</option>
              <option value="normal">{isGerman ? 'Normal' : 'Normal'}</option>
              <option value="large">{isGerman ? 'Groß' : 'Large'}</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Passives Verhalten' : 'Passive behavior'}</label>
            <select
              value={championSettings.passiveBehavior}
              onChange={(event) => updateChampionSettings({ passiveBehavior: event.target.value as 'active' | 'idle-only' })}
              className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="active">{isGerman ? 'Idle + Zufallsbewegung' : 'Idle + random walk'}</option>
              <option value="idle-only">{isGerman ? 'Nur Idle' : 'Idle only'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Event-Reaktionen' : 'Event reactions'}</label>
            <select
              value={championSettings.eventReactions}
              onChange={(event) => updateChampionSettings({ eventReactions: event.target.value as 'all' | 'none' })}
              className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">{isGerman ? 'Alle Reaktionen' : 'All reactions'}</option>
              <option value="none">{isGerman ? 'Keine Reaktionen' : 'No reactions'}</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">{isGerman ? 'VFX-Preset' : 'VFX preset'}</label>
          <select
            value={championSettings.vfxPreset}
            onChange={(event) => updateChampionSettings({ vfxPreset: event.target.value as 'performance' | 'balanced' | 'cinematic' })}
            className="w-full px-3 py-2 bg-surface-hover text-text-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="performance">{isGerman ? 'Performance' : 'Performance'}</option>
            <option value="balanced">{isGerman ? 'Ausgewogen' : 'Balanced'}</option>
            <option value="cinematic">{isGerman ? 'Cinematic' : 'Cinematic'}</option>
          </select>
          <p className="text-xs text-text-tertiary">
            {championVfxPresetDescriptions[language][championSettings.vfxPreset]}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">{isGerman ? 'Reichweitenradius' : 'Range indicator radius'}</label>
            <span className="text-xs font-mono text-text-tertiary">{championSettings.rangeRadius}px</span>
          </div>
          <input
            type="range"
            min={180}
            max={500}
            step={10}
            value={championSettings.rangeRadius}
            onChange={(event) => updateChampionSettings({ rangeRadius: Number(event.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button
            onClick={() => updateChampionSettings({ showCooldowns: !championSettings.showCooldowns })}
            className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary hover:border-primary/40"
          >
            {isGerman ? 'Cooldown-HUD' : 'Cooldown HUD'}: {championSettings.showCooldowns ? (isGerman ? 'An' : 'On') : (isGerman ? 'Aus' : 'Off')}
          </button>
          <button
            onClick={() => updateChampionSettings({ soundsEnabled: !championSettings.soundsEnabled })}
            className="rounded-lg border border-border bg-surface-hover px-3 py-2 text-sm text-text-primary hover:border-primary/40"
          >
            {isGerman ? 'Champion-SFX' : 'Champion SFX'}: {championSettings.soundsEnabled ? (isGerman ? 'An' : 'On') : (isGerman ? 'Aus' : 'Off')}
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            variant="secondary"
            onClick={() => {
              resetChampionPosition();
              soundToast.success(isGerman ? 'Champion-Position zurückgesetzt.' : 'Champion position reset.');
            }}
          >
            {isGerman ? 'Position zurücksetzen' : 'Reset position'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              restoreChampionDefaults();
              soundToast.success(isGerman ? 'Lucian-Standards wiederhergestellt.' : 'Lucian defaults restored.');
            }}
          >
            {isGerman ? 'Lucian wiederherstellen' : 'Restore Lucian'}
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-background/40 p-4">
          <p className="text-xs uppercase tracking-wider text-text-tertiary mb-2">{isGerman ? 'Champion-Statistiken' : 'Champion stats'}</p>
          <p className="text-sm text-text-primary font-medium">
            {isGerman ? 'Level' : 'Level'} {championStats.level} · XP {championStats.xp}/{championStats.nextLevelXp}
          </p>
        </div>
      </div>
    </section>
  );
}
