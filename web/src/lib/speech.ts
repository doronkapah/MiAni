/**
 * הקראה קולית — לילדים שעוד לא קוראים.
 *
 * הקול מגיע ממערכת ההפעלה, לא מהמשחק. אם אין קול עברי מותקן,
 * אין מה לעשות מהצד שלנו — אבל *כן* צריך להגיד את זה. במצב
 * "בחירה מתוך תמונות" ההקראה היא לא קישוט: היא הדרך של הילד
 * לדעת מה כתוב, ושתיקה שקטה משאירה אותו בלי כלום.
 */

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  return window.speechSynthesis;
}

function hebrewVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const engine = synth();
  if (!engine) {
    cachedVoice = null;
    return null;
  }
  const voices = engine.getVoices();
  cachedVoice = voices.find((v) => v.lang.toLowerCase().startsWith("he")) ?? null;
  return cachedVoice;
}

/**
 * מצב ההקראה.
 *
 *   ready       — יש קול עברי, הכול עובד
 *   loading     — הדפדפן עוד טוען קולות; שווה לחכות רגע
 *   noHebrew    — יש מנוע דיבור, אבל בלי קול עברי
 *   unsupported — אין מנוע דיבור בכלל
 */
export type VoiceStatus = "ready" | "loading" | "noHebrew" | "unsupported";

export function voiceStatus(): VoiceStatus {
  const engine = synth();
  if (!engine) return "unsupported";
  if (hebrewVoice()) return "ready";
  // getVoices מחזיר רשימה ריקה עד שהדפדפן סיים לטעון אותם
  return engine.getVoices().length === 0 ? "loading" : "noHebrew";
}

/** קולות נטענים לפעמים אחרי טעינת הדף */
export function watchVoices(onChange: () => void): () => void {
  const engine = synth();
  if (!engine) return () => {};
  const handler = () => {
    cachedVoice = undefined;
    onChange();
  };
  engine.addEventListener("voiceschanged", handler);
  return () => engine.removeEventListener("voiceschanged", handler);
}

export function canSpeak(): boolean {
  return hebrewVoice() !== null;
}

export function speak(text: string): void {
  const engine = synth();
  const voice = hebrewVoice();
  if (!engine || !voice) return;
  engine.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.92;
  utterance.pitch = 1.05;
  engine.speak(utterance);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
