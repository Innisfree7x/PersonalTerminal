'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SoundEvent =
  | 'pop'
  | 'swoosh'
  | 'click'
  | 'champ-move'
  | 'champ-q'
  | 'champ-w'
  | 'champ-e'
  | 'champ-r'
  | 'champ-pentakill'
  | 'champ-victory'
  | 'champ-panic'
  | 'champ-level-up'
  | 'champ-focus';

export interface SoundSettings {
  enabled: boolean;
  masterVolume: number; // 0..1
}

export interface SoundContextType {
  settings: SoundSettings;
  setEnabled: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  play: (event: SoundEvent) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: SoundSettings = { enabled: true, masterVolume: 0.45 };
const STORAGE_KEY = 'prism-sound-settings';

// Per-event base gain (relative to masterVolume)
const EVENT_GAIN: Record<SoundEvent, number> = {
  pop: 0.9,
  swoosh: 0.8,
  click: 0.45, // click is quieter by design
  'champ-move': 0.4,
  'champ-q': 0.85,
  'champ-w': 0.55,
  'champ-e': 0.8,
  'champ-r': 0.95,
  'champ-pentakill': 1.0,
  'champ-victory': 0.75,
  'champ-panic': 0.6,
  'champ-level-up': 0.9,
  'champ-focus': 0.45,
};

// Anti-spam cooldown per event (ms)
const COOLDOWN: Record<SoundEvent, number> = {
  pop: 200,
  swoosh: 250,
  click: 150,
  'champ-move': 120,
  'champ-q': 220,
  'champ-w': 260,
  'champ-e': 180,
  'champ-r': 400,
  'champ-pentakill': 1200,
  'champ-victory': 500,
  'champ-panic': 350,
  'champ-level-up': 600,
  'champ-focus': 500,
};

// ─── Synthesizer helpers ──────────────────────────────────────────────────────

function jitter(base: number, range: number): number {
  return base + (Math.random() * 2 - 1) * range;
}

/**
 * pop – short frequency-glide tone (task complete feel)
 * ~700 Hz → 400 Hz, 120 ms, soft sine
 */
function synthPop(ctx: AudioContext, gain: number): void {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = 'sine';
  const freq = jitter(700, 40);
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    jitter(400, 30),
    ctx.currentTime + 0.12
  );

  amp.gain.setValueAtTime(0, ctx.currentTime);
  amp.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13);

  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.14);
}

/**
 * swoosh – band-pass filtered white noise with sweep (send/move feel)
 * ~150 ms, breathes through a moving filter
 */
function synthSwoosh(ctx: AudioContext, gain: number): void {
  const bufLen = Math.ceil(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  const startFreq = jitter(600, 80);
  filter.frequency.setValueAtTime(startFreq, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(
    jitter(1800, 150),
    ctx.currentTime + 0.13
  );
  filter.Q.value = 2.5;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0, ctx.currentTime);
  amp.gain.linearRampToValueAtTime(gain * 1.4, ctx.currentTime + 0.025);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start(ctx.currentTime);
}

/**
 * click – ultra-short low-freq thud (UI toggle)
 * Sine burst + tiny noise transient, ~60 ms
 */
function synthClick(ctx: AudioContext, gain: number): void {
  // Low thud
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(180, 20), ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.06);

  amp.gain.setValueAtTime(gain * 1.1, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.065);

  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.07);

  // Short noise transient
  const bufLen = Math.ceil(ctx.sampleRate * 0.015);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

  const ns = ctx.createBufferSource();
  ns.buffer = buffer;

  const nf = ctx.createBiquadFilter();
  nf.type = 'highpass';
  nf.frequency.value = 3000;

  const na = ctx.createGain();
  na.gain.setValueAtTime(gain * 0.3, ctx.currentTime);
  na.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

  ns.connect(nf);
  nf.connect(na);
  na.connect(ctx.destination);
  ns.start(ctx.currentTime);
}

const SYNTHS: Record<SoundEvent, (ctx: AudioContext, gain: number) => void> = {
  pop: synthPop,
  swoosh: synthSwoosh,
  click: synthClick,
  'champ-move': synthClick,
  'champ-q': synthSwoosh,
  'champ-w': synthClick,
  'champ-e': synthSwoosh,
  'champ-r': synthPop,
  'champ-pentakill': synthPop,
  'champ-victory': synthPop,
  'champ-panic': synthClick,
  'champ-level-up': synthSwoosh,
  'champ-focus': synthClick,
};

// ─── Context ──────────────────────────────────────────────────────────────────

export const SoundContext = createContext<SoundContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  // Lazily created AudioContext (avoids autoplay policy issues until first interaction)
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Per-event last-played timestamps for anti-spam
  const lastPlayedRef = useRef<Partial<Record<SoundEvent, number>>>({});

  // ── Hydration ──────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SoundSettings>;
        setSettings((prev) => ({
          ...prev,
          ...(typeof parsed.enabled === 'boolean' ? { enabled: parsed.enabled } : {}),
          ...(typeof parsed.masterVolume === 'number' ? { masterVolume: Math.max(0, Math.min(1, parsed.masterVolume)) } : {}),
        }));
      }
    } catch {
      // ignore corrupt storage
    }
    setMounted(true);
  }, []);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setEnabled = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, enabled: v }));
  }, []);

  const setMasterVolume = useCallback((v: number) => {
    setSettings((s) => ({ ...s, masterVolume: Math.max(0, Math.min(1, v)) }));
  }, []);

  const play = useCallback(
    (event: SoundEvent) => {
      if (!mounted) return;
      if (!settings.enabled) return;
      if (typeof window === 'undefined') return;

      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      // Anti-spam cooldown
      const now = Date.now();
      const last = lastPlayedRef.current[event] ?? 0;
      if (now - last < COOLDOWN[event]) return;
      lastPlayedRef.current[event] = now;

      // Lazy AudioContext creation
      if (!audioCtxRef.current) {
        const AudioContextCtor =
          window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextCtor) return;
        try {
          audioCtxRef.current = new AudioContextCtor();
        } catch {
          return;
        }
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        void ctx.resume().then(() => runSynth()).catch(() => {
          // ignore resume failures silently
        });
      } else {
        runSynth();
      }

      function runSynth() {
        if (!ctx) return;
        const baseGain = EVENT_GAIN[event] * settings.masterVolume;
        // Tiny volume jitter ±5%
        const gain = jitter(baseGain, baseGain * 0.05);
        SYNTHS[event](ctx, gain);
      }
    },
    [mounted, settings.enabled, settings.masterVolume]
  );

  return (
    <SoundContext.Provider value={{ settings, setEnabled, setMasterVolume, play }}>
      {children}
    </SoundContext.Provider>
  );
}
