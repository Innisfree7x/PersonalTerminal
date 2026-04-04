'use client';

import { motion } from 'framer-motion';
import { Music, Volume2, VolumeX } from 'lucide-react';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
import { useAppSound } from '@/lib/hooks/useAppSound';
import { SOUND_PACKS, type SoundPack } from '@/lib/sound/packs';

const PACK_KEYS: SoundPack[] = ['default', 'lofi', 'nature', 'silent'];

export default function SoundSettingsSection() {
  const { language, copy } = useAppLanguage();
  const { play, settings: soundSettings, setEnabled: setSoundEnabled, setMasterVolume, setNotificationSound, setSoundPack } = useAppSound();
  const isGerman = language === 'de';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Music className="w-5 h-5" />
          {copy.settings.sound}
        </h2>
        <span className="settings-chip">{copy.settings.savedLocal}</span>
      </div>

      {/* Sound Pack Picker */}
      <div className="grid grid-cols-2 gap-3">
        {PACK_KEYS.map((key) => {
          const def = SOUND_PACKS[key];
          const isActive = soundSettings.soundPack === key;
          return (
            <button
              key={key}
              onClick={() => setSoundPack(key)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                isActive
                  ? 'border-primary/50 bg-primary/5'
                  : 'card-warm border-border hover:border-border/80'
              }`}
            >
              <span className="text-2xl" role="img" aria-label={def.label}>
                {def.emoji}
              </span>
              <p className="mt-2 text-sm font-medium text-text-primary">{def.label}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">{def.description}</p>
            </button>
          );
        })}
      </div>

      <div className="p-6 bg-surface border border-border rounded-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">{isGerman ? 'Interaktionssounds' : 'Interaction Sounds'}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{isGerman ? 'Subtiles Audio-Feedback für UI-Aktionen' : 'Subtle audio feedback for UI actions'}</p>
          </div>
          <ToggleSwitch
            enabled={soundSettings.enabled}
            onChange={(v) => setSoundEnabled(v)}
            ariaLabel={soundSettings.enabled ? (isGerman ? 'Sounds deaktivieren' : 'Disable sounds') : (isGerman ? 'Sounds aktivieren' : 'Enable sounds')}
          />
        </div>

        <div className={`space-y-3 transition-opacity ${soundSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
              {soundSettings.masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isGerman ? 'Master-Lautstärke' : 'Master Volume'}
            </label>
            <span className="text-xs font-mono text-text-tertiary">{Math.round(soundSettings.masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={soundSettings.masterVolume}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
          />
        </div>

        <div className={`space-y-2 pt-4 border-t border-border transition-opacity ${soundSettings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">{isGerman ? 'Vorschau' : 'Preview'}</p>
          <div className="space-y-2 mb-3">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{isGerman ? 'Benachrichtigungston' : 'Notification Tone'}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setNotificationSound('teams-default');
                  play('pop', { notificationSound: 'teams-default', force: true });
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${soundSettings.notificationSound === 'teams-default' ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border bg-surface-hover text-text-secondary hover:border-primary/35'}`}
              >
                {isGerman ? 'Teams-Kit' : 'Teams Kit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNotificationSound('classic');
                  play('pop', { notificationSound: 'classic', force: true });
                }}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${soundSettings.notificationSound === 'classic' ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border bg-surface-hover text-text-secondary hover:border-primary/35'}`}
              >
                Classic Synth
              </button>
            </div>
            <p className="text-[11px] text-text-tertiary">
              {isGerman
                ? 'Das Teams-Kit deckt Benachrichtigung, Swoosh und Click ab. Quelle ist das verlinkte Community-Pack für die private Nutzung.'
                : 'Teams kit covers notification, swoosh and click. Sourced from the linked community pack for personal use.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {([
              {
                event: 'pop' as const,
                label: isGerman ? 'Benachrichtigung' : 'Notification',
                description: soundSettings.notificationSound === 'teams-default' ? 'Teams kit' : 'Classic synth',
              },
              {
                event: 'swoosh' as const,
                label: 'Swoosh',
                description: soundSettings.notificationSound === 'teams-default'
                  ? (isGerman ? 'Teams Bewegungs-Cue' : 'Teams move cue')
                  : (isGerman ? 'Senden / verschieben' : 'Send / move'),
              },
              {
                event: 'click' as const,
                label: 'Click',
                description: soundSettings.notificationSound === 'teams-default'
                  ? (isGerman ? 'Teams UI-Tick' : 'Teams UI tick')
                  : (isGerman ? 'Umschalten / auswählen' : 'Toggle / select'),
              },
            ] as const).map(({ event, label, description }) => (
              <motion.button
                key={event}
                onClick={() =>
                  play(event, {
                    force: true,
                    ...(event === 'pop' || event === 'swoosh' || event === 'click'
                      ? { notificationSound: soundSettings.notificationSound }
                      : {}),
                  })
                }
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-lg border border-border hover:border-primary/50 bg-surface-hover hover:bg-primary/5 transition-all text-left"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="text-sm font-medium text-text-primary">{label}</span>
                <span className="text-xs text-text-tertiary">{description}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
