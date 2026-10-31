/**
 * Procedural Web Audio API sound effects for CatDo
 * Crafted for soft, warm, natural feline acoustics.
 * No harsh sawtooth or buzzer waves!
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const playSound = {
  /**
   * Sweet, gentle petting sound: soft affectionate kitten chirp & warm purr
   */
  pet: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // 1. Soft warm rising chirp ("먕~")
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      // Pitch contour: starts at 520Hz, softly glides to 680Hz, relaxes to 590Hz
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(590, now + 0.35);

      // Lowpass filter to ensure zero harsh digital edge
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);

      // 2. Gentle heart sparkle chime (soft soothing overtone)
      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      sparkleOsc.type = 'sine';
      sparkleOsc.frequency.setValueAtTime(1174.66, now + 0.05); // D6
      sparkleOsc.frequency.exponentialRampToValueAtTime(1479.98, now + 0.25); // F#6

      sparkleGain.gain.setValueAtTime(0.0001, now);
      sparkleGain.gain.exponentialRampToValueAtTime(0.06, now + 0.09);
      sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkleOsc.start(now + 0.05);
      sparkleOsc.stop(now + 0.38);
    } catch {
      // Audio fails gracefully if disabled
    }
  },

  /**
   * Sweet kitten meow ("야옹~")
   */
  meow: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      subOsc.type = 'sine';

      // Natural pitch glide (M-e-o-w)
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.45);

      subOsc.frequency.setValueAtTime(230, now);
      subOsc.frequency.exponentialRampToValueAtTime(390, now + 0.12);
      subOsc.frequency.exponentialRampToValueAtTime(260, now + 0.45);

      // Warm formant filter
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, now);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.15, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

      osc.connect(filter);
      subOsc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      subOsc.start(now);
      osc.stop(now + 0.5);
      subOsc.stop(now + 0.5);
    } catch {}
  },

  /**
   * Soothing soft purring rumble
   */
  purr: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Soft warm low-frequency sine oscillation, strictly filtered
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  },

  /**
   * Crunching eating munch sound
   */
  munch: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 50, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch {}
  },

  /**
   * Cheerful coin chime
   */
  coin: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.07); // E6

      osc2.frequency.setValueAtTime(1975.53, now + 0.07);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.07);
      osc1.stop(now + 0.38);
      osc2.stop(now + 0.38);
    } catch {}
  },

  /**
   * Triumphant level up fanfare
   */
  levelUp: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const t = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch {}
  },

  /**
   * Deep, resonant, peaceful singing bowl / temple chime for bowing & healing
   */
  zenBowl: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Fundamental warm resonant gong tone (216Hz - A3 relaxing frequency)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(216, now);
      osc2.frequency.setValueAtTime(432, now); // 1st harmonic octave

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.6);
      osc2.stop(now + 2.6);
    } catch {}
  },

  /**
   * Shimmering breeze chime for heart offerings & incense
   */
  zenChime: () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const pentatonic = [880, 987.77, 1174.66, 1318.51, 1567.98]; // A5, B5, D6, E6, G6

      pentatonic.forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 1.3);
      });
    } catch {}
  },
};
