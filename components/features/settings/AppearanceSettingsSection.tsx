'use client';

import { motion } from 'framer-motion';
import { Check, Monitor, Palette, Sparkles } from 'lucide-react';
import { useTheme, type AccentColor, type Theme } from '@/components/providers/ThemeProvider';
import { useAppLanguage } from '@/components/providers/LanguageProvider';
import { useAppSound } from '@/lib/hooks/useAppSound';

const themes = [
  { id: 'gold', name: 'Gold (Premium)', preview: 'linear-gradient(135deg, #2f2412 0%, #0b0908 100%)', border: '#ca8a04', tag: 'Metal' },
  { id: 'platinum', name: 'Platinum', preview: 'linear-gradient(135deg, #1d2430 0%, #0a0f16 100%)', border: '#64748b', tag: 'Metal' },
  { id: 'sapphire', name: 'Sapphire', preview: 'linear-gradient(135deg, #162646 0%, #070e1e 100%)', border: '#0ea5e9', tag: 'Metal' },
  { id: 'copper', name: 'Copper', preview: 'linear-gradient(135deg, #3d2318 0%, #140d0a 100%)', border: '#ea580c', tag: 'Metal' },
  { id: 'amethyst', name: 'Amethyst', preview: 'linear-gradient(135deg, #362357 0%, #130d1f 100%)', border: '#a855f7', tag: 'Metal' },
  { id: 'obsidian', name: 'Obsidian', preview: 'linear-gradient(135deg, #1a1610 0%, #080808 100%)', border: '#d4af37', tag: 'Metal' },
  { id: 'rosegold', name: 'Rose Gold', preview: 'linear-gradient(135deg, #2a1c1e 0%, #0d0a0b 100%)', border: '#de968c', tag: 'Metal' },
  { id: 'carbon', name: 'Carbon', preview: 'linear-gradient(135deg, #1e1e22 0%, #0c0c0e 100%)', border: '#a0a5af', tag: 'Metal' },
  { id: 'titanium', name: 'Titanium', preview: 'linear-gradient(135deg, #1e2230 0%, #111214 100%)', border: '#829bc3', tag: 'Metal' },
  { id: 'onyx', name: 'Onyx', preview: 'linear-gradient(135deg, #0e160f 0%, #050505 100%)', border: '#50c878', tag: 'Metal' },
  { id: 'midnight', name: 'Midnight', preview: '#0A0A0A', border: '#262626' },
  { id: 'nord', name: 'Nord', preview: '#2E3440', border: '#4C566A' },
  { id: 'dracula', name: 'Dracula', preview: '#282a36', border: '#6272a4' },
  { id: 'ocean', name: 'Ocean', preview: '#0f172a', border: '#334155' },
  { id: 'emerald', name: 'Emerald', preview: '#022c22', border: '#065f46' },
] as const satisfies ReadonlyArray<{ id: Theme; name: string; preview: string; border: string; tag?: string }>;

const accents = [
  { id: 'gold', name: 'Gold', swatch: 'linear-gradient(135deg, rgb(234 179 8), rgb(245 158 11))' },
  { id: 'sunset', name: 'Sunset', swatch: 'linear-gradient(135deg, rgb(249 115 22), rgb(236 72 153))' },
  { id: 'aurora', name: 'Aurora', swatch: 'linear-gradient(135deg, rgb(16 185 129), rgb(59 130 246))' },
  { id: 'royal', name: 'Royal', swatch: 'linear-gradient(135deg, rgb(99 102 241), rgb(236 72 153))' },
  { id: 'plasma', name: 'Plasma', swatch: 'linear-gradient(135deg, rgb(168 85 247), rgb(59 130 246))' },
  { id: 'ember', name: 'Ember', swatch: 'linear-gradient(135deg, rgb(239 68 68), rgb(245 158 11))' },
  { id: 'red', name: 'Red', swatch: 'radial-gradient(circle at 30% 25%, rgb(248 113 113), rgb(220 38 38))' },
  { id: 'purple', name: 'Purple', swatch: 'radial-gradient(circle at 30% 25%, rgb(192 132 252), rgb(109 40 217))' },
  { id: 'blue', name: 'Blue', swatch: 'radial-gradient(circle at 30% 25%, rgb(96 165 250), rgb(37 99 235))' },
  { id: 'green', name: 'Green', swatch: 'radial-gradient(circle at 30% 25%, rgb(52 211 153), rgb(5 150 105))' },
  { id: 'orange', name: 'Orange', swatch: 'radial-gradient(circle at 30% 25%, rgb(251 146 60), rgb(234 88 12))' },
  { id: 'pink', name: 'Pink', swatch: 'radial-gradient(circle at 30% 25%, rgb(244 114 182), rgb(219 39 119))' },
  { id: 'champagne', name: 'Champagne', swatch: 'linear-gradient(135deg, rgb(212 175 55), rgb(232 204 110))' },
  { id: 'ice', name: 'Ice', swatch: 'linear-gradient(135deg, rgb(148 210 236), rgb(200 230 255))' },
  { id: 'rose', name: 'Rosé', swatch: 'linear-gradient(135deg, rgb(201 135 143), rgb(232 169 176))' },
  { id: 'jade', name: 'Jade', swatch: 'linear-gradient(135deg, rgb(0 168 107), rgb(46 204 113))' },
  { id: 'slate', name: 'Slate', swatch: 'linear-gradient(135deg, rgb(112 128 144), rgb(143 163 179))' },
] as const satisfies ReadonlyArray<{ id: AccentColor; name: string; swatch: string }>;

export default function AppearanceSettingsSection() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { copy, language } = useAppLanguage();
  const { play } = useAppSound();
  const isGerman = language === 'de';

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
          <Palette className="w-5 h-5" />
          {copy.settings.appearance}
        </h2>
        <span className="settings-chip">{copy.settings.savedLocal}</span>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4 sm:p-5">
        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          {copy.settings.interfaceTheme}
        </label>
        <p className="text-xs text-text-tertiary">
          {isGerman
            ? 'Premium-Themes bleiben über Desktop- und Tablet-Layouts hinweg visuell konsistent.'
            : 'Premium themes stay visually consistent across desktop and tablet layouts.'}
        </p>
        <div className="settings-theme-grid">
          {themes.map((t) => (
            <motion.button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                play('click');
              }}
              className={`settings-theme-card ${theme === t.id ? 'settings-theme-card--active' : ''}`}
              whileHover={{ scale: 1.012 }}
              whileTap={{ scale: 0.99 }}
            >
              {theme === t.id ? (
                <motion.div
                  layoutId="theme-check"
                  className="absolute right-2 top-2 rounded-full border border-primary/40 bg-primary/15 p-1 text-primary"
                >
                  <Check className="h-3 w-3" />
                </motion.div>
              ) : null}
              <div
                className="settings-theme-preview"
                style={{ background: t.preview, borderColor: t.border }}
              >
                <div className="h-full w-full p-2.5">
                  <div className="flex h-full gap-2.5 rounded-lg border border-white/10 bg-black/15 p-2">
                    <div className="h-full w-6 shrink-0 rounded-md bg-white/10" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-4/5 rounded bg-white/20" />
                      <div className="h-2.5 w-2/3 rounded bg-white/12" />
                      <div className="h-2.5 w-3/4 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 min-h-[2.5rem]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`block text-sm font-semibold leading-tight ${theme === t.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {t.name}
                  </span>
                  {'tag' in t && t.tag ? (
                    <span className="rounded-full border border-white/15 bg-white/5 px-1.5 py-0.5 text-xs uppercase tracking-wide text-text-tertiary">
                      {t.tag}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-xs uppercase tracking-wide text-text-tertiary">
                      Core
                    </span>
                  )}
                </div>
                <span className="mt-1 block text-[11px] text-text-tertiary">
                  {theme === t.id ? copy.settings.active : copy.settings.select}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-5">
        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {copy.settings.accentColor}
        </label>
        <div className="settings-accent-grid">
          {accents.map((a) => (
            <motion.button
              key={a.id}
              onClick={() => {
                setAccentColor(a.id);
                play('click');
              }}
              className={`settings-accent-chip ${accentColor === a.id ? 'settings-accent-chip--active' : ''}`}
              title={a.name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="settings-accent-swatch" style={{ background: a.swatch }}>
                <span className="settings-accent-swatch-overlay" />
              </div>
              <span className="min-w-0 truncate text-[11px] font-medium text-text-secondary">{a.name}</span>
              {accentColor === a.id ? (
                <span className="absolute right-1.5 top-1.5 rounded-full border border-primary/35 bg-primary/20 p-0.5 text-primary">
                  <Check className="h-3 w-3" />
                </span>
              ) : null}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
