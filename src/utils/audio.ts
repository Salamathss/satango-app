// src/utils/audio.ts

/**
 * Simple Web Audio API utilities for playing short feedback tones.
 * No external audio files are required; tones are generated dynamically.
 */

// Singleton AudioContext to avoid creating multiple contexts which can be limited by browsers.
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/** Play a tone at a given frequency (Hz) for a duration (seconds). */
function playTone(frequency: number, duration: number, when = 0) {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Connect nodes
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  // Fade out to avoid clicks
  gain.gain.setValueAtTime(0.001, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration);

  oscillator.start(ctx.currentTime + when);
  oscillator.stop(ctx.currentTime + when + duration);
}

/** Play success sound: two quick ascending tones (C5 -> G5). */
export function playSuccessSound() {
  // C5 (~523 Hz) then G5 (~784 Hz) each ~0.12s
  playTone(523.25, 0.12, 0);
  playTone(783.99, 0.12, 0.13);
}

/** Play error sound: a single low thud. */
export function playErrorSound() {
  // 150 Hz for ~0.3s
  playTone(150, 0.3, 0);
}
