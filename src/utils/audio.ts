// src/utils/audio.ts

/**
 * High-performance Web Audio API sound engine for SATANGO.
 * Pure dynamic synthetic audio — zero external mp3 files required.
 * Respects user mute preference stored in localStorage.
 */

const STORAGE_KEY = "satango_sound_enabled";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx && typeof window !== "undefined") {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/** Check if sound is enabled (defaults to true) */
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val === "true";
}

/** Toggle sound on/off and return the new state */
export function toggleSound(): boolean {
  const current = isSoundEnabled();
  const next = !current;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent("satango_sound_toggled", { detail: next }));
  }
  return next;
}

/** Set sound enabled explicitly */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent("satango_sound_toggled", { detail: enabled }));
  }
}

/** Internal helper to synthesize a shaped tone */
function playTone(
  frequency: number,
  duration: number,
  when = 0,
  type: OscillatorType = "sine",
  peakGain = 0.15
) {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + when);

    osc.connect(gain);
    gain.connect(ctx.destination);

    const startTime = ctx.currentTime + when;
    const endTime = startTime + duration;

    // Smooth envelope to prevent audio clipping clicks
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peakGain, startTime + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    osc.start(startTime);
    osc.stop(endTime);
  } catch {
    // Graceful fallback if browser restricts audio
  }
}

/**
 * 1. UI Tactile Click:
 * Minimalist, ultra-subtle mechanical click (Linear/Notion style).
 */
export function playClickSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    const startTime = ctx.currentTime;
    // Rapid pitch drop creates a crisp physical tactile click
    osc.frequency.setValueAtTime(440, startTime);
    osc.frequency.exponentialRampToValueAtTime(140, startTime + 0.025);

    gain.gain.setValueAtTime(0.06, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.025);
  } catch {
    // ignore
  }
}

/**
 * 2. Success Chime:
 * Uplifting two-tone major third / fifth chime (Duolingo / Apple style).
 */
export function playSuccessSound() {
  playTone(523.25, 0.14, 0, "sine", 0.18); // C5
  playTone(659.25, 0.16, 0.09, "sine", 0.18); // E5
  playTone(783.99, 0.28, 0.18, "sine", 0.22); // G5
}

/**
 * 3. Error / Miss Sound:
 * Soft, low-frequency muted double tap (gentle, informative, not harsh).
 */
export function playErrorSound() {
  playTone(220, 0.12, 0, "triangle", 0.16);
  playTone(164.81, 0.18, 0.09, "triangle", 0.14);
}

/**
 * 4. Chest Reward / Victory Jingle:
 * Joyful ascending arpeggio with a shimmering peak for claiming daily chest / gems.
 */
export function playChestRewardSound() {
  playTone(523.25, 0.12, 0, "sine", 0.18); // C5
  playTone(659.25, 0.12, 0.08, "sine", 0.18); // E5
  playTone(783.99, 0.14, 0.16, "sine", 0.2); // G5
  playTone(1046.5, 0.35, 0.24, "triangle", 0.22); // C6
}

/**
 * 5. Level Up / Milestone Fanfare:
 * Grand celebratory multi-note arpeggio.
 */
export function playLevelUpSound() {
  playTone(392.0, 0.12, 0, "sine", 0.16); // G4
  playTone(523.25, 0.12, 0.08, "sine", 0.18); // C5
  playTone(659.25, 0.12, 0.16, "sine", 0.2); // E5
  playTone(783.99, 0.14, 0.24, "sine", 0.22); // G5
  playTone(1046.5, 0.45, 0.32, "triangle", 0.25); // C6
}
