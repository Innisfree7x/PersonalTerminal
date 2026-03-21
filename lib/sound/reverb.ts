/**
 * Reverb Engine — synthetic convolution reverb for the INNIS sound system.
 *
 * Creates a stereo impulse response (exponentially decaying white noise)
 * and caches a single ConvolverNode per AudioContext via WeakMap.
 *
 * Usage in SoundProvider:
 *   const { dry, wet } = getReverbSend(ctx);
 *   // Route the synth's final amp → dry (direct) AND → wet (reverb)
 */

const reverbCache = new WeakMap<AudioContext, ConvolverNode>();

const DEFAULT_DECAY = 1.4; // seconds

/**
 * Generate a synthetic stereo impulse response buffer.
 * Exponentially decaying white noise — no external audio file needed.
 */
function createReverbImpulse(
  ctx: AudioContext,
  decayTime: number = DEFAULT_DECAY,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.ceil(sampleRate * decayTime);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      // Exponential decay envelope * white noise
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * decayTime * 0.35));
    }
  }

  return buffer;
}

/**
 * Get or create the shared ConvolverNode for a given AudioContext.
 */
export function getReverbNode(ctx: AudioContext): ConvolverNode {
  let convolver = reverbCache.get(ctx);
  if (convolver) return convolver;

  convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx);
  convolver.connect(ctx.destination);
  reverbCache.set(ctx, convolver);

  return convolver;
}

/**
 * Create isolated wet/dry send buses for a specific synth trigger.
 *
 * Synths connect their output to BOTH:
 *   - `dry` → direct to destination (unprocessed)
 *   - `wet` → through convolver → destination (reverb)
 *
 * The convolver is shared, but the gain buses are per-call so concurrent
 * sounds can use different wet levels without mutating each other.
 */
export function getReverbSend(
  ctx: AudioContext,
  wetAmount: number = 0.25,
): { dry: GainNode; wet: GainNode } {
  const dry = ctx.createGain();
  dry.gain.value = 1.0;
  dry.connect(ctx.destination);

  const wet = ctx.createGain();
  wet.gain.value = wetAmount;
  const convolver = getReverbNode(ctx);
  wet.connect(convolver);

  return { dry, wet };
}
