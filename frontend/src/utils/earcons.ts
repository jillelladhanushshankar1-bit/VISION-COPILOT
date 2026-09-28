/**
 * Earcons & Haptic Audio Feedback for Vision Copilot
 * Synthesizes instantaneous, distinct short audio cues (<300ms) using Web Audio API
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext initialization failed:', err);
    return null;
  }
}

/**
 * 1. Awareness Started: Rising two-note chime (440Hz -> 880Hz, total ~240ms)
 */
export function playAwarenessStartedEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.setValueAtTime(0.25, now + 0.10);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(440, now); // A4
  osc1.start(now);
  osc1.stop(now + 0.12);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(880, now + 0.11); // A5
  osc2.start(now + 0.11);
  osc2.stop(now + 0.25);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
}

/**
 * 2. Awareness Stopped: Falling two-note chime (880Hz -> 440Hz, total ~240ms)
 */
export function playAwarenessStoppedEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  gain.gain.setValueAtTime(0.25, now + 0.10);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now); // A5
  osc1.start(now);
  osc1.stop(now + 0.12);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(440, now + 0.11); // A4
  osc2.start(now + 0.11);
  osc2.stop(now + 0.24);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
}

/**
 * 3. Listening Started (Ask AI mic active): Short crisp pop/blip (~90ms)
 */
export function playListeningStartedEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

/**
 * 4. Connection Lost: Low double warning tone (220Hz & 180Hz, total ~240ms)
 */
export function playConnectionLostEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(220, now);
  osc1.start(now);
  osc1.stop(now + 0.1);

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(175, now + 0.12);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.24);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
  gain.gain.setValueAtTime(0.18, now + 0.09);
  gain.gain.linearRampToValueAtTime(0.001, now + 0.1);

  gain.gain.setValueAtTime(0.001, now + 0.12);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.13);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
}

/**
 * 5. Connection Restored: Rapid ascending 3-note affirmation (C5-E5-G5, total ~240ms)
 */
export function playConnectionRestoredEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const duration = 0.07;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noteStart = now + i * 0.075;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.001, noteStart);
    gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + duration);
  });
}

/**
 * Audio-guided OCR Aiming Tone
 * Plays a single guidance pulse where pitch and frequency reflect text density (320Hz to 880Hz)
 */
export function playOcrAimingTone(score: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Map 0..1 score to pitch between 320 Hz (no text / blank) and 880 Hz (dense clear text)
  const pitch = Math.max(320, Math.min(880, 320 + Math.round(score * 560)));

  osc.type = score > 0.4 ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(pitch, now);

  const vol = 0.15 + score * 0.1;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.12);
}

/**
 * Distinct prompt cue when camera is aimed at a blank scene
 */
export function playOcrNoTextPromptEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(380, now);
  osc1.start(now);
  osc1.stop(now + 0.12);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(260, now + 0.13);
  osc2.start(now + 0.13);
  osc2.stop(now + 0.28);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
  gain.gain.setValueAtTime(0.2, now + 0.11);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
}

/**
 * Camera shutter / capture confirmation earcon for OCR
 */
export function playOcrCaptureEarcon() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Crisp high click followed by quick resonant confirmation tone
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
  osc.frequency.setValueAtTime(587.33, now + 0.05); // D5 chime

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
  gain.gain.setValueAtTime(0.3, now + 0.04);
  gain.gain.linearRampToValueAtTime(0.2, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

/**
 * Vibration API helper
 * Routine: short tap [80ms]
 * Hazard: strong distinct high-priority pattern [200ms, 100ms, 200ms, 100ms, 400ms]
 */
export function triggerHaptic(type: 'routine' | 'hazard' = 'routine') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'hazard') {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } else {
        navigator.vibrate(80);
      }
    } catch {
      // ignore
    }
  }
}
