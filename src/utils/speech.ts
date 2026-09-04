// Web Speech API text-to-speech helper for Cram AI

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string,
  options?: {
    rate?: number;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Stop any active speech
  stopSpeech();

  // Strip markdown formatting for cleaner speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted for audio. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*•]\s+/gm, '')
    .trim();

  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options?.rate || 1.0;
  utterance.pitch = 1.0;

  // Try to pick a natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    currentUtterance = null;
    options?.onError?.(e);
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
