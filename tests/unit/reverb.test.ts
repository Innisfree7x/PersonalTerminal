import { describe, expect, it, vi } from 'vitest';
import { getReverbNode, getReverbSend } from '@/lib/sound/reverb';

function createMockAudioContext() {
  const destination = { kind: 'destination' };

  const createBuffer = vi.fn((channels: number, length: number, sampleRate: number) => {
    const channelData = Array.from({ length: channels }, () => new Float32Array(length));
    return {
      sampleRate,
      getChannelData: (channel: number) => channelData[channel]!,
    };
  });

  const createConvolver = vi.fn(() => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
  }));

  const createGain = vi.fn(() => ({
    gain: { value: 0 },
    connect: vi.fn(),
  }));

  const ctx = {
    sampleRate: 48_000,
    destination,
    createBuffer,
    createConvolver,
    createGain,
  } as unknown as AudioContext;

  return { ctx, createConvolver, createGain };
}

describe('reverb', () => {
  it('caches the convolver per audio context', () => {
    const { ctx, createConvolver } = createMockAudioContext();

    const first = getReverbNode(ctx);
    const second = getReverbNode(ctx);

    expect(first).toBe(second);
    expect(createConvolver).toHaveBeenCalledTimes(1);
  });

  it('creates isolated wet/dry buses per send call', () => {
    const { ctx, createConvolver, createGain } = createMockAudioContext();

    const first = getReverbSend(ctx, 0.35);
    const second = getReverbSend(ctx, 0.15);

    expect(first).not.toBe(second);
    expect(first.dry).not.toBe(second.dry);
    expect(first.wet).not.toBe(second.wet);
    expect(first.wet.gain.value).toBe(0.35);
    expect(second.wet.gain.value).toBe(0.15);
    expect(createConvolver).toHaveBeenCalledTimes(1);
    expect(createGain).toHaveBeenCalledTimes(4);
  });
});
