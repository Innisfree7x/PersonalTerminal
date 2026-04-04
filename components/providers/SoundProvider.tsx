'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { getReverbSend } from '@/lib/sound/reverb';
import { type SoundPack, isValidSoundPack, resolvePackSoundPath } from '@/lib/sound/packs';

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
  | 'champ-focus'
  | 'goal-created'
  | 'goal-completed'
  | 'error'
  | 'streak-milestone'
  | 'modal-open'
  | 'modal-close';

export type NotificationSound = 'classic' | 'teams-default';

export interface SoundSettings {
  enabled: boolean;
  masterVolume: number; // 0..1
  notificationSound: NotificationSound;
  soundPack: SoundPack;
}

export interface SoundContextType {
  settings: SoundSettings;
  setEnabled: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  setNotificationSound: (v: NotificationSound) => void;
  setSoundPack: (v: SoundPack) => void;
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
  soundPack: 'default',
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
  'goal-created': 0.75,
  'goal-completed': 0.85,
  error: 0.5,
  'streak-milestone': 0.9,
  'modal-open': 0.3,
  'modal-close': 0.25,
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
  'goal-created': 2000,
  'goal-completed': 2000,
  error: 1000,
  'streak-milestone': 5000,
  'modal-open': 150,
  'modal-close': 150,
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
  const { dry, wet } = getReverbSend(ctx, 0.3);
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
    amp.connect(dry);
    amp.connect(wet);
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

// ─── Champion Ability Synths ─────────────────────────────────────────────────

/**
 * champ-q – Laser Beam: high-freq charge sweep + noise burst at release
 * Sine 1200→3200Hz with parallel noise transient, ~200ms
 */
function synthChampQ(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;

  // Laser charge: sine sweep up
  const osc = ctx.createOscillator();
  const oscAmp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(1200, 100), now);
  osc.frequency.exponentialRampToValueAtTime(jitter(3200, 200), now + 0.14);
  oscAmp.gain.setValueAtTime(0.0001, now);
  oscAmp.gain.linearRampToValueAtTime(gain * 0.7, now + 0.03);
  oscAmp.gain.setValueAtTime(gain * 0.7, now + 0.1);
  oscAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  osc.connect(oscAmp);
  oscAmp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.22);

  // Harmonic overtone for richness
  const osc2 = ctx.createOscillator();
  const osc2Amp = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(jitter(2400, 150), now);
  osc2.frequency.exponentialRampToValueAtTime(jitter(4800, 300), now + 0.12);
  osc2Amp.gain.setValueAtTime(0.0001, now);
  osc2Amp.gain.linearRampToValueAtTime(gain * 0.25, now + 0.04);
  osc2Amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  osc2.connect(osc2Amp);
  osc2Amp.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.18);

  // Noise burst at release point
  const bufLen = Math.ceil(ctx.sampleRate * 0.06);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource();
  ns.buffer = buffer;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 4000;
  nf.Q.value = 1.5;
  const na = ctx.createGain();
  na.gain.setValueAtTime(0.0001, now + 0.1);
  na.gain.linearRampToValueAtTime(gain * 0.5, now + 0.115);
  na.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  ns.connect(nf);
  nf.connect(na);
  na.connect(ctx.destination);
  ns.start(now + 0.1);
}

/**
 * champ-w – Arcane Mark: dual detuned oscillators with tremolo shimmer
 * Mystical pulse feel, ~250ms
 */
function synthChampW(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;

  // Primary tone
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(jitter(660, 20), now);

  // Detuned shimmer
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(jitter(668, 20), now); // ~8Hz detune = shimmer

  // Tremolo LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 18;
  lfoGain.gain.value = gain * 0.15;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.linearRampToValueAtTime(gain * 0.55, now + 0.035);
  amp.gain.setValueAtTime(gain * 0.55, now + 0.12);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  // Sub-bass body
  const sub = ctx.createOscillator();
  const subAmp = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(165, now);
  subAmp.gain.setValueAtTime(0.0001, now);
  subAmp.gain.linearRampToValueAtTime(gain * 0.3, now + 0.02);
  subAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  lfo.connect(lfoGain);
  lfoGain.connect(amp.gain);
  osc1.connect(amp);
  osc2.connect(amp);
  amp.connect(ctx.destination);
  sub.connect(subAmp);
  subAmp.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  lfo.start(now);
  sub.start(now);
  osc1.stop(now + 0.27);
  osc2.stop(now + 0.27);
  lfo.stop(now + 0.27);
  sub.stop(now + 0.2);
}

/**
 * champ-e – Dash: fast descending whoosh, very short and punchy
 * Noise sweep 2200→300Hz, ~100ms
 */
function synthChampE(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const bufLen = Math.ceil(ctx.sampleRate * 0.1);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(jitter(2200, 200), now);
  filter.frequency.exponentialRampToValueAtTime(jitter(300, 50), now + 0.08);
  filter.Q.value = 3;

  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain * 1.3, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start(now);
}

/**
 * champ-r – Ultimate: bass impact + high shimmer + reverb tail
 * Layered epic feel, ~400ms
 */
function synthChampR(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.3);

  // Layer 1: Bass impact
  const bass = ctx.createOscillator();
  const bassAmp = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(jitter(85, 10), now);
  bass.frequency.exponentialRampToValueAtTime(40, now + 0.2);
  bassAmp.gain.setValueAtTime(0.0001, now);
  bassAmp.gain.linearRampToValueAtTime(gain * 0.9, now + 0.008);
  bassAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  bass.connect(bassAmp);
  bassAmp.connect(dry);
  bass.start(now);
  bass.stop(now + 0.38);

  // Layer 2: Mid punch
  const mid = ctx.createOscillator();
  const midAmp = ctx.createGain();
  mid.type = 'triangle';
  mid.frequency.setValueAtTime(jitter(340, 30), now);
  mid.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  midAmp.gain.setValueAtTime(0.0001, now);
  midAmp.gain.linearRampToValueAtTime(gain * 0.45, now + 0.01);
  midAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  mid.connect(midAmp);
  midAmp.connect(dry);
  midAmp.connect(wet);
  mid.start(now);
  mid.stop(now + 0.22);

  // Layer 3: High shimmer tail
  const shimmer = ctx.createOscillator();
  const shimmer2 = ctx.createOscillator();
  const shimmerAmp = ctx.createGain();
  shimmer.type = 'sine';
  shimmer2.type = 'sine';
  shimmer.frequency.setValueAtTime(jitter(1200, 60), now);
  shimmer2.frequency.setValueAtTime(jitter(1210, 60), now);
  shimmer.frequency.exponentialRampToValueAtTime(800, now + 0.35);
  shimmer2.frequency.exponentialRampToValueAtTime(805, now + 0.35);
  shimmerAmp.gain.setValueAtTime(0.0001, now + 0.02);
  shimmerAmp.gain.linearRampToValueAtTime(gain * 0.3, now + 0.06);
  shimmerAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  shimmer.connect(shimmerAmp);
  shimmer2.connect(shimmerAmp);
  shimmerAmp.connect(wet);
  shimmer.start(now + 0.02);
  shimmer2.start(now + 0.02);
  shimmer.stop(now + 0.42);
  shimmer2.stop(now + 0.42);

  // Noise impact transient
  const bufLen = Math.ceil(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const d = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource();
  ns.buffer = buffer;
  const nf = ctx.createBiquadFilter();
  nf.type = 'lowpass';
  nf.frequency.value = 2000;
  const na = ctx.createGain();
  na.gain.setValueAtTime(gain * 0.6, now);
  na.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  ns.connect(nf);
  nf.connect(na);
  na.connect(dry);
  ns.start(now);
}

/**
 * champ-pentakill – Fanfare: 5-note ascending arpeggio
 * C5→E5→G5→C6→E6, triumphant, ~600ms
 */
function synthChampPentakill(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.35);
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5 E5 G5 C6 E6

  notes.forEach((freq, i) => {
    const start = now + i * 0.1;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc2.frequency.setValueAtTime(freq * 1.002, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.01, start + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(4000 + i * 400, start);
    filter.Q.value = 0.6;

    const noteGain = gain * (0.65 + i * 0.07);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(noteGain, start + 0.015);
    amp.gain.setValueAtTime(noteGain * 0.9, start + 0.08);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(amp);
    amp.connect(dry);
    amp.connect(wet);
    osc.start(start);
    osc2.start(start);
    osc.stop(start + 0.24);
    osc2.stop(start + 0.24);
  });
}

/**
 * champ-victory – Triumph: sustained major chord (C4+E4+G4)
 * Majestic, warm, ~350ms
 */
function synthChampVictory(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.3);
  const chord = [261.63, 329.63, 392.0]; // C4 E4 G4

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.005, now + 0.3);

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(gain * (0.5 - i * 0.05), now + 0.04);
    amp.gain.setValueAtTime(gain * (0.45 - i * 0.05), now + 0.2);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(amp);
    amp.connect(dry);
    amp.connect(wet);
    osc.start(now);
    osc.stop(now + 0.37);
  });

  // High octave shimmer
  const shimmer = ctx.createOscillator();
  const sAmp = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(523.25, now);
  sAmp.gain.setValueAtTime(0.0001, now + 0.03);
  sAmp.gain.linearRampToValueAtTime(gain * 0.15, now + 0.08);
  sAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  shimmer.connect(sAmp);
  sAmp.connect(wet);
  shimmer.start(now + 0.03);
  shimmer.stop(now + 0.34);
}

/**
 * champ-panic – Warning Pulse: double rapid sawtooth pulse
 * Urgent, alarming, ~200ms
 */
function synthChampPanic(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;

  for (let p = 0; p < 2; p++) {
    const start = now + p * 0.1;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(jitter(320, 20), start);
    osc.frequency.exponentialRampToValueAtTime(240, start + 0.07);

    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 1;

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain * 0.6, start + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);

    osc.connect(filter);
    filter.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.09);
  }
}

/**
 * champ-level-up – Ascending Arp: E4→A4→C#5→E5
 * Positive, achievement feel, ~300ms
 */
function synthChampLevelUp(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const notes = [329.63, 440.0, 554.37, 659.25]; // E4 A4 C#5 E5

  notes.forEach((freq, i) => {
    const start = now + i * 0.065;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.015, start + 0.12);

    const noteGain = gain * (0.6 + i * 0.08);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(noteGain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);

    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.16);
  });
}

/**
 * champ-focus – Focus Lock: deep sine ping + subtle high shimmer
 * Meditative, clean, ~180ms
 */
function synthChampFocus(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;

  // Deep ping
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(220, 10), now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.linearRampToValueAtTime(gain * 0.5, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);

  // High shimmer overlay
  const hi = ctx.createOscillator();
  const hiAmp = ctx.createGain();
  hi.type = 'triangle';
  hi.frequency.setValueAtTime(880, now);
  hiAmp.gain.setValueAtTime(0.0001, now);
  hiAmp.gain.linearRampToValueAtTime(gain * 0.12, now + 0.02);
  hiAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  hi.connect(hiAmp);
  hiAmp.connect(ctx.destination);
  hi.start(now);
  hi.stop(now + 0.16);
}

/**
 * champ-move – Footstep: very short soft thud
 * Subtle, ~40ms
 */
function synthChampMove(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(65, 8), now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.035);
  amp.gain.setValueAtTime(gain * 0.7, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.045);
}

// ─── UI Sound Synths ─────────────────────────────────────────────────────────

/**
 * goal-created – Ascending two-note, motivating
 * C5→G5, ~200ms
 */
function synthGoalCreated(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const notes = [523.25, 783.99]; // C5 G5

  notes.forEach((freq, i) => {
    const start = now + i * 0.09;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.01, start + 0.12);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gain * (0.65 + i * 0.1), start + 0.015);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.16);
  });
}

/**
 * goal-completed – Mini celebration chord (C5+E5+G5)
 * Brighter than momentum-up, ~300ms
 */
function synthGoalCompleted(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.25);
  const chord = [523.25, 659.25, 783.99]; // C5 E5 G5

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = i === 2 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(gain * (0.55 - i * 0.05), now + 0.02);
    amp.gain.setValueAtTime(gain * (0.5 - i * 0.05), now + 0.15);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(amp);
    amp.connect(dry);
    amp.connect(wet);
    osc.start(now);
    osc.stop(now + 0.32);
  });

  // Sparkle on top
  const sparkle = ctx.createOscillator();
  const sAmp = ctx.createGain();
  sparkle.type = 'sine';
  sparkle.frequency.setValueAtTime(1568, now + 0.05);
  sAmp.gain.setValueAtTime(0.0001, now + 0.05);
  sAmp.gain.linearRampToValueAtTime(gain * 0.15, now + 0.07);
  sAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  sparkle.connect(sAmp);
  sAmp.connect(wet);
  sparkle.start(now + 0.05);
  sparkle.stop(now + 0.22);
}

/**
 * error – 3-layer warning: filtered sawtooth sweep + sub-bass thud + noise crack
 * Urgent but not harsh, ~200ms
 */
function synthError(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.15);

  // Layer 1: Filtered sawtooth descent 300→180Hz
  const osc = ctx.createOscillator();
  const oscAmp = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(jitter(300, 20), now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.14);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.14);
  filter.Q.value = 0.8;
  oscAmp.gain.setValueAtTime(0.0001, now);
  oscAmp.gain.linearRampToValueAtTime(gain * 0.55, now + 0.01);
  oscAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(filter);
  filter.connect(oscAmp);
  oscAmp.connect(dry);
  oscAmp.connect(wet);
  osc.start(now);
  osc.stop(now + 0.2);

  // Layer 2: Sub-bass thud — sine at 80Hz, fast attack
  const sub = ctx.createOscillator();
  const subAmp = ctx.createGain();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(jitter(80, 8), now);
  sub.frequency.exponentialRampToValueAtTime(50, now + 0.1);
  subAmp.gain.setValueAtTime(gain * 0.7, now);
  subAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  sub.connect(subAmp);
  subAmp.connect(dry);
  sub.start(now);
  sub.stop(now + 0.14);

  // Layer 3: Noise crack — bandpass at 3kHz, 30ms
  const bufLen = Math.ceil(ctx.sampleRate * 0.03);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const ns = ctx.createBufferSource();
  ns.buffer = buffer;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = 3000;
  nf.Q.value = 2;
  const na = ctx.createGain();
  na.gain.setValueAtTime(gain * 0.35, now);
  na.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  ns.connect(nf);
  nf.connect(na);
  na.connect(dry);
  ns.start(now);
}

/**
 * streak-milestone – Celebration: ascending sparkle arpeggio
 * Special, rare, ~500ms
 */
function synthStreakMilestone(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.3);
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6

  notes.forEach((freq, i) => {
    const start = now + i * 0.08;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const amp = ctx.createGain();

    osc.type = 'sine';
    osc2.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc2.frequency.setValueAtTime(freq * 2.005, start);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, start + 0.16);

    const noteGain = gain * (0.5 + i * 0.1);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(noteGain, start + 0.015);
    amp.gain.setValueAtTime(noteGain * 0.85, start + 0.08);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);

    osc.connect(amp);
    osc2.connect(amp);
    amp.connect(dry);
    amp.connect(wet);
    osc.start(start);
    osc2.start(start);
    osc.stop(start + 0.22);
    osc2.stop(start + 0.22);
  });

  // Final sustained shimmer
  const shimmer = ctx.createOscillator();
  const shimmerAmp = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2093, now + 0.32);
  shimmerAmp.gain.setValueAtTime(0.0001, now + 0.32);
  shimmerAmp.gain.linearRampToValueAtTime(gain * 0.1, now + 0.36);
  shimmerAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  shimmer.connect(shimmerAmp);
  shimmerAmp.connect(wet);
  shimmer.start(now + 0.32);
  shimmer.stop(now + 0.52);
}

/**
 * modal-open – Soft pop: quick sine, very subtle
 * ~80ms
 */
function synthModalOpen(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(520, 20), now);
  osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.linearRampToValueAtTime(gain * 0.5, now + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * modal-close – Reverse pop: descending, very subtle
 * ~60ms
 */
function synthModalClose(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(jitter(520, 20), now);
  osc.frequency.exponentialRampToValueAtTime(340, now + 0.05);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.linearRampToValueAtTime(gain * 0.4, now + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.065);
}

/**
 * trajectory-at-risk – 4-layer ominous warning: filtered sawtooth + detuned sine pair
 * + double-pulse rhythm + high tension shimmer, ~400ms
 */
function synthTrajectoryAtRisk(ctx: AudioContext, gain: number): void {
  const now = ctx.currentTime;
  const { dry, wet } = getReverbSend(ctx, 0.2);

  // Layer 1: Filtered sawtooth descent with filter sweep
  const osc = ctx.createOscillator();
  const oscAmp = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(jitter(220, 15), now);
  osc.frequency.exponentialRampToValueAtTime(170, now + 0.35);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(800, now + 0.3);
  filter.Q.value = 1.2;
  oscAmp.gain.setValueAtTime(0.0001, now);
  oscAmp.gain.linearRampToValueAtTime(gain * 0.5, now + 0.015);
  oscAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  osc.connect(filter);
  filter.connect(oscAmp);
  oscAmp.connect(dry);
  oscAmp.connect(wet);
  osc.start(now);
  osc.stop(now + 0.4);

  // Layer 2: Detuned sine pair at 165/168Hz — ominous vibrato
  const sinA = ctx.createOscillator();
  const sinB = ctx.createOscillator();
  const pairAmp = ctx.createGain();
  sinA.type = 'sine';
  sinB.type = 'sine';
  sinA.frequency.setValueAtTime(165, now);
  sinB.frequency.setValueAtTime(168, now); // 3Hz beating
  pairAmp.gain.setValueAtTime(0.0001, now);
  pairAmp.gain.linearRampToValueAtTime(gain * 0.35, now + 0.03);
  pairAmp.gain.setValueAtTime(gain * 0.3, now + 0.2);
  pairAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  sinA.connect(pairAmp);
  sinB.connect(pairAmp);
  pairAmp.connect(dry);
  pairAmp.connect(wet);
  sinA.start(now);
  sinB.start(now);
  sinA.stop(now + 0.42);
  sinB.stop(now + 0.42);

  // Layer 3: Double-pulse rhythm (two hits at 0ms and 140ms)
  for (let p = 0; p < 2; p++) {
    const start = now + p * 0.14;
    const pulse = ctx.createOscillator();
    const pulseAmp = ctx.createGain();
    pulse.type = 'triangle';
    pulse.frequency.setValueAtTime(jitter(280, 15), start);
    pulse.frequency.exponentialRampToValueAtTime(200, start + 0.06);
    pulseAmp.gain.setValueAtTime(gain * 0.4, start);
    pulseAmp.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
    pulse.connect(pulseAmp);
    pulseAmp.connect(dry);
    pulse.start(start);
    pulse.stop(start + 0.08);
  }

  // Layer 4: High tension shimmer — quiet triangle at 880Hz
  const shimmer = ctx.createOscillator();
  const shimmerAmp = ctx.createGain();
  shimmer.type = 'triangle';
  shimmer.frequency.setValueAtTime(880, now + 0.05);
  shimmerAmp.gain.setValueAtTime(0.0001, now + 0.05);
  shimmerAmp.gain.linearRampToValueAtTime(gain * 0.1, now + 0.1);
  shimmerAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  shimmer.connect(shimmerAmp);
  shimmerAmp.connect(wet);
  shimmer.start(now + 0.05);
  shimmer.stop(now + 0.42);
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
  'champ-move': synthChampMove,
  'champ-q': synthChampQ,
  'champ-w': synthChampW,
  'champ-e': synthChampE,
  'champ-r': synthChampR,
  'champ-pentakill': synthChampPentakill,
  'champ-victory': synthChampVictory,
  'champ-panic': synthChampPanic,
  'champ-level-up': synthChampLevelUp,
  'champ-focus': synthChampFocus,
  'goal-created': synthGoalCreated,
  'goal-completed': synthGoalCompleted,
  error: synthError,
  'streak-milestone': synthStreakMilestone,
  'modal-open': synthModalOpen,
  'modal-close': synthModalClose,
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
          ...(isValidSoundPack(parsed.soundPack) ? { soundPack: parsed.soundPack } : {}),
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

  const setSoundPack = useCallback((v: SoundPack) => {
    setSettings((s) => ({ ...s, soundPack: v }));
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

      // Silent pack: skip entirely
      if (settings.soundPack === 'silent') return;

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

        // Sound pack override (lofi/nature) — try pack-specific sample first
        const packSrc = resolvePackSoundPath(settings.soundPack, event);
        if (packSrc) {
          let audio = sampleAudioRef.current[packSrc] ?? null;
          if (!audio) {
            audio = new Audio(packSrc);
            audio.preload = 'auto';
            sampleAudioRef.current[packSrc] = audio;
          }
          audio.currentTime = 0;
          audio.volume = Math.max(0, Math.min(1, baseGain));
          void audio.play().catch(() => {
            // Graceful fallback: pack sample missing → use default synth/sample
            fallbackToDefault(baseGain);
          });
          return;
        }

        fallbackToDefault(baseGain);

        function fallbackToDefault(gain: number) {
          if (!ctx) return;
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
            audio.volume = Math.max(0, Math.min(1, gain));
            void audio.play().catch(() => {
              const g = jitter(gain, gain * 0.05);
              SYNTHS[event](ctx, g);
            });
            return;
          }
          const g = jitter(gain, gain * 0.05);
          SYNTHS[event](ctx, g);
        }
      }
    },
    [mounted, settings.enabled, settings.masterVolume, settings.notificationSound, settings.soundPack]
  );

  return (
    <SoundContext.Provider
      value={{ settings, setEnabled, setMasterVolume, setNotificationSound, setSoundPack, play }}
    >
      {children}
    </SoundContext.Provider>
  );
}
