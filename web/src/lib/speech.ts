/**
 * הקראה קולית — לילדים שעוד לא קוראים.
 * אם אין קול עברי מותקן במערכת, הכפתור פשוט לא מוצג.
 */

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function hebrewVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  if (typeof window === "undefined" || !window.speechSynthesis) {
    cachedVoice = null;
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  cachedVoice = voices.find((v) => v.lang.toLowerCase().startsWith("he")) ?? null;
  return cachedVoice;
}

/** קולות נטענים לפעמים אחרי טעינת הדף */
export function watchVoices(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  const handler = () => {
    cachedVoice = undefined;
    onChange();
  };
  window.speechSynthesis.addEventListener("voiceschanged", handler);
  return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
}

export function canSpeak(): boolean {
  return hebrewVoice() !== null;
}

export function speak(text: string): void {
  const voice = hebrewVoice();
  if (!voice) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
