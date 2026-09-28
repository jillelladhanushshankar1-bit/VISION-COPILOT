/**
 * Safe Browser Speech Synthesis Helper
 */
export function speakText(
  text: string,
  isMuted: boolean,
  rate: number = 1.0,
  isHazardOverride: boolean = false
) {
  // If muted and NOT a hazard override, suppress speech
  if ((isMuted && !isHazardOverride) || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = isHazardOverride ? 1.05 : 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis not available or blocked:', err);
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
