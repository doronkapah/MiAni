/**
 * יחיד ורבים בעברית.
 *
 * "1 פריטים" ו"1 חידות פתורות" הן שגיאות שילד שלומד לקרוא רואה
 * ולומד מהן. בעברית יש גם צורת זוגי ("שתי חידות") וגם התאמת מין,
 * ולכן אי אפשר להסתפק ב-s בסוף.
 */

export interface Plural {
  /** אחד — "פריט אחד" */
  one: string;
  /** שניים ומעלה — "3 פריטים" */
  many: string;
  /** נקבה? קובע "אחת" מול "אחד", ו"שתי" מול "שני" */
  feminine?: boolean;
}

/** המילים הספורות שמופיעות עם מספר במסכים */
export const WORDS = {
  item: { one: "פריט", many: "פריטים" },
  riddle: { one: "חידה", many: "חידות", feminine: true },
  star: { one: "כוכב", many: "כוכבים" },
  clue: { one: "רמז", many: "רמזים" },
  day: { one: "יום", many: "ימים" },
  player: { one: "שחקן", many: "שחקנים" },
} as const satisfies Record<string, Plural>;

/**
 * מספר ומילה, מותאמים.
 *
 *   count(1, WORDS.item)   → "פריט אחד"
 *   count(2, WORDS.riddle) → "שתי חידות"
 *   count(7, WORDS.star)   → "7 כוכבים"
 */
export function count(amount: number, word: Plural): string {
  if (amount === 1) return `${word.one} ${word.feminine ? "אחת" : "אחד"}`;
  if (amount === 2) return `${word.feminine ? "שתי" : "שני"} ${word.many}`;
  return `${amount} ${word.many}`;
}

/** רק המילה, בלי המספר — לכותרות שהמספר מוצג בהן בנפרד */
export function noun(amount: number, word: Plural): string {
  return amount === 1 ? word.one : word.many;
}

/**
 * "נפתח" מול "נפתחה", לפי מין הדבר שנפתח.
 *
 * "נפתח נבחרת חדשה" צורם בדיוק כמו "1 פריטים".
 */
export function opened(name: string): string {
  return isFeminine(name) ? "נפתחה" : "נפתח";
}

export function fresh(name: string): string {
  return isFeminine(name) ? "חדשה" : "חדש";
}

/**
 * ניחוש מין המילה.
 *
 * סיומת ה"א או תי"ו היא נקבה ברוב המכריע של המקרים, וברשימה
 * הסגורה שלנו — מתכון, מסע, סיפור, נבחרת — היא מדויקת.
 */
export function isFeminine(name: string): boolean {
  const last = name.trim().slice(-1);
  return last === "ה" || last === "ת";
}

/**
 * לשון פנייה.
 *
 * בעברית כל פועל בגוף שני מגודר, ואי אפשר לכתוב משפט אחד שמתאים
 * לכולם. המשחק שמר את ההעדפה מאז יצירת הפרופיל אבל דיבר בלשון רבים
 * לכולם — מה שנשמע נכון בסבב משפחתי, וזר לילד שמשחק לבד.
 *
 * `plural` גובר על המין: במצב "הורה שואל" מדברים באמת אל כמה אנשים.
 */
export type Address = "male" | "female";

export interface Voice {
  address: Address;
  plural: boolean;
}

/** בוחר את הנוסח המתאים מתוך שלוש הצורות */
export function say(
  voice: Voice,
  forms: { male: string; female: string; plural: string },
): string {
  if (voice.plural) return forms.plural;
  return voice.address === "female" ? forms.female : forms.male;
}

/** הפעלים הבודדים שחוזרים בטקסטים של המשחק */
export const VERBS = {
  solved: { male: "פתרת", female: "פתרת", plural: "פתרתם" },
  tryAgain: { male: "נסה שוב", female: "נסי שוב", plural: "נסו שוב" },
  guessAgain: {
    male: "נסה עוד ניחוש!",
    female: "נסי עוד ניחוש!",
    plural: "נסו עוד ניחוש!",
  },
  write: {
    male: "כתוב לי מילה שלמה ואבדוק אותה.",
    female: "כתבי לי מילה שלמה ואבדוק אותה.",
    plural: "כתבו לי מילה שלמה ואבדוק אותה.",
  },
  addWord: {
    male: "תוסיף מילה, או בקש עוד רמז.",
    female: "תוסיפי מילה, או בקשי עוד רמז.",
    plural: "תוסיפו מילה, או בקשו עוד רמז.",
  },
} as const;
