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
