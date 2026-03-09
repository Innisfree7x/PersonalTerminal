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
  | 'task-completed'
  | 'focus-end'
  | 'momentum-up'
  | 'trajectory-on-track'
  | 'trajectory-at-risk'
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

export type NotificationSound = 'classic' | 'teams-default';

export interface SoundSettings {
  enabled: boolean;
  masterVolume: number; // 0..1
  notificationSound: NotificationSound;
}

export interface SoundContextType {
  settings: SoundSettings;
  setEnabled: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  setNotificationSound: (v: NotificationSound) => void;
  play: (
    event: SoundEvent,
    options?: {
      notificationSound?: NotificationSound;
      force?: boolean;
    }
  ) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: SoundSettings = {
  enabled: false,
  masterVolume: 0.35,
  notificationSound: 'classic',
};
const STORAGE_KEY = 'innis:sound-settings:v1';
const LEGACY_STORAGE_KEYS = ['prism-sound-settings'];

function canReadStorage(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.localStorage?.getItem === 'function';
}

function canWriteStorage(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.localStorage?.setItem === 'function';
}

// Per-event base gain (relative to masterVolume)
const EVENT_GAIN: Record<SoundEvent, number> = {
  pop: 0.9,
  swoosh: 0.8,
  click: 0.45, // click is quieter by design
  'task-completed': 0.9,
  'focus-end': 0.52,
  'momentum-up': 0.8,
  'trajectory-on-track': 0.7,
  'trajectory-at-risk': 0.5,
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
  'task-completed': 10_000,
  'focus-end': 10_000,
  'momentum-up': 10_000,
  'trajectory-on-track': 10_000,
  'trajectory-at-risk': 10_000,
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

function synthFocusEnd(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5 (sanfter Abschluss-Chime)

  notes.forEach((freq, index) => {
    const start = now + index * 0.095;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.008, start + 0.24);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, start);
    filter.Q.value = 0.8;

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain * (0.72 - index * 0.1), start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

    osc.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.3);
  });
}

function synthMomentumUp(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const start = now + index * 0.06;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + 0.12);

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain * (0.7 - index * 0.1), start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.17);
  });
}

function synthTrajectoryOnTrack(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const amp = ctx.createGain();

  oscA.type = 'sine';
  oscB.type = 'triangle';
  oscA.frequency.setValueAtTime(392, now); // G4
  oscB.frequency.setValueAtTime(493.88, now); // B4

  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain * 0.8, now + 0.03);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  oscA.connect(amp);
  oscB.connect(amp);
  amp.connect(ctx.destination);
  oscA.start(now);
  oscB.start(now + 0.01);
  oscA.stop(now + 0.3);
  oscB.stop(now + 0.29);
}

function synthTrajectoryAtRisk(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(170, now + 0.22);

  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain * 0.65, now + 0.015);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.28);
}

const SYNTHS: Record<SoundEvent, (ctx: AudioContext, gain: number) => void> = {
  pop: synthPop,
  swoosh: synthSwoosh,
  click: synthClick,
  'task-completed': synthPop,
  'focus-end': synthFocusEnd,
  'momentum-up': synthMomentumUp,
  'trajectory-on-track': synthTrajectoryOnTrack,
  'trajectory-at-risk': synthTrajectoryAtRisk,
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

export function resolveSampleSrcForEvent(
  event: SoundEvent,
  notificationSound: NotificationSound
): string | null {
  if (notificationSound !== 'teams-default') {
    return null;
  }

  if (event === 'pop') {
    return '/sounds/teams-default.mp3';
  }
  if (event === 'task-completed') {
    return '/sounds/teams-default.mp3';
  }
  if (event === 'swoosh') {
    return '/sounds/teams-swoosh.mp3';
  }
  if (event === 'click') {
    return '/sounds/teams-click.mp3';
  }
  if (event === 'focus-end') {
    return '/sounds/teams-default.mp3';
  }

  return null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const SoundContext = createContext<SoundContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  // Lazily created AudioContext (avoids autoplay policy issues until first interaction)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sampleAudioRef = useRef<Partial<Record<string, HTMLAudioElement>>>({});

  // Per-event last-played timestamps for anti-spam
  const lastPlayedRef = useRef<Partial<Record<SoundEvent, number>>>({});

  // ── Hydration ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canReadStorage()) {
      setMounted(true);
      return;
    }

    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(
          (value): value is string => typeof value === 'string' && value.length > 0
        ) ??
        null;
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SoundSettings>;
        setSettings((prev) => ({
          ...prev,
          ...(typeof parsed.enabled === 'boolean' ? { enabled: parsed.enabled } : {}),
          ...(typeof parsed.masterVolume === 'number' ? { masterVolume: Math.max(0, Math.min(1, parsed.masterVolume)) } : {}),
          ...(parsed.notificationSound === 'classic' || parsed.notificationSound === 'teams-default'
            ? { notificationSound: parsed.notificationSound }
            : {}),
        }));
      }
    } catch {
      // ignore corrupt storage
    }
    setMounted(true);
  }, []);

  // ── Persist ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !canWriteStorage()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setEnabled = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, enabled: v }));
  }, []);

  const setMasterVolume = useCallback((v: number) => {
    setSettings((s) => ({ ...s, masterVolume: Math.max(0, Math.min(1, v)) }));
  }, []);

  const setNotificationSound = useCallback((v: NotificationSound) => {
    setSettings((s) => ({ ...s, notificationSound: v }));
  }, []);

  const play = useCallback(
    (
      event: SoundEvent,
      options?: {
        notificationSound?: NotificationSound;
        force?: boolean;
      }
    ) => {
      if (!mounted) return;
      if (!settings.enabled && !options?.force) return;
      if (typeof window === 'undefined') return;

      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      // Anti-spam cooldown
      const now = Date.now();
      if (!options?.force) {
        const last = lastPlayedRef.current[event] ?? 0;
        if (now - last < COOLDOWN[event]) return;
        lastPlayedRef.current[event] = now;
      }

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
        const sampleSrc = resolveSampleSrcForEvent(
          event,
          options?.notificationSound ?? settings.notificationSound
        );
        if (sampleSrc) {
          let audio = sampleAudioRef.current[sampleSrc] ?? null;
          if (!audio) {
            audio = new Audio(sampleSrc);
            audio.preload = 'auto';
            sampleAudioRef.current[sampleSrc] = audio;
          }
          audio.currentTime = 0;
          audio.volume = Math.max(0, Math.min(1, baseGain));
          void audio.play().catch(() => {
            // Fallback to synth when media playback is blocked by browser policy.
            const gain = jitter(baseGain, baseGain * 0.05);
            SYNTHS[event](ctx, gain);
          });
          return;
        }

        // Tiny volume jitter ±5%
        const gain = jitter(baseGain, baseGain * 0.05);
        SYNTHS[event](ctx, gain);
      }
    },
    [mounted, settings.enabled, settings.masterVolume, settings.notificationSound]
  );

  return (
    <SoundContext.Provider
      value={{ settings, setEnabled, setMasterVolume, setNotificationSound, play }}
    >
      {children}
    </SoundContext.Provider>
  );
}
