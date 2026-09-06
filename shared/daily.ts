/**
 * חידת היום.
 *
 * חידה אחת ליום, שנבחרת באופן דטרמיניסטי מהתאריך — בלי שרת, בלי
 * הגרלה שנשמרת. שני ילדים באותה רמה יקבלו את אותה חידה באותו יום,
 * וזה מה שהופך אותה למשהו שאפשר לדבר עליו בארוחת ערב.
 *
 * הפרס הוא כוכבים, ולא דירוג: חידת היום היא לא שיעור, היא טקס.
 * מי שפותר בלי רמזים נוספים מקבל שלושה, ומי שנעזר מקבל פחות —
 * אבל אף אחד לא יוצא בידיים ריקות, וגם רצף הימים לא נשבר.
 */

import { riddles } from "./bank";
import { levelOf } from "./difficulty";
import { MAX_LEVEL, MIN_LEVEL } from "./worlds";
import type { DailyState, Profile, Riddle } from "./types";

/** המזהה של המצב הזה במנוע — לא עולם אמיתי, אין לו בנק משלו */
export const DAILY = "daily";

/** מפתח היום לפי השעון המקומי. חצות של המשפחה, לא של גריניץ׳. */
export function dayKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** אתמול, כדי לדעת אם הרצף נמשך */
export function previousDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const parsed = new Date(year!, month! - 1, date!);
  parsed.setDate(parsed.getDate() - 1);
  return dayKey(parsed);
}

/** גיבוב יציב — אותו קלט תמיד אותו מספר, בכל דפדפן ובכל גרסה */
function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** הרמה שממנה נלקחת חידת היום: הגבוהה מבין העולמות שהשחקן פתח */
export function dailyLevel(profile: Profile): number {
  const levels = Object.values(profile.worlds ?? {}).map((progress) =>
    levelOf(progress.rating),
  );
  if (!levels.length) return MIN_LEVEL;
  return Math.min(MAX_LEVEL, Math.max(...levels));
}

/**
 * החידה של היום.
 *
 * הבחירה נעשית מתוך הרמה של השחקן, ומדלגת על מה שהוא כבר פתר —
 * אבל תמיד באותו סדר, כך שהיא נשארת יציבה לאורך היום גם אם הוא
 * סוגר את הדף באמצע.
 */
export function dailyRiddle(
  profile: Profile,
  day: string = dayKey(),
  pool: Riddle[] = riddles,
): Riddle | null {
  const level = dailyLevel(profile);

  // הרמה עצמה קודם, ואחריה הרמות הסמוכות — כדי שגם ברמה שהתרוקנה
  // תהיה חידה יומית
  const byDistance = [...new Set(pool.map((riddle) => riddle.level))].sort(
    (a, b) => Math.abs(a - level) - Math.abs(b - level) || a - b,
  );

  const solved = new Set(profile.solved ?? []);
  for (const candidate of byDistance) {
    const atLevel = pool
      .filter((riddle) => riddle.level === candidate)
      .sort((a, b) => (a.id < b.id ? -1 : 1));
    if (!atLevel.length) continue;

    const start = hash(`${day}:${candidate}`) % atLevel.length;
    for (let step = 0; step < atLevel.length; step += 1) {
      const riddle = atLevel[(start + step) % atLevel.length]!;
      if (!solved.has(riddle.id)) return riddle;
    }
  }

  // פתר הכול — מגישים בכל זאת את חידת היום, גם אם היא מוכרת
  const all = [...pool].sort((a, b) => (a.id < b.id ? -1 : 1));
  return all.length ? all[hash(day) % all.length]! : null;
}

/** כמה כוכבים מזכה פתרון, לפי כמה רמזים נדרשו */
export function starsFor(cluesRevealed: number): number {
  if (cluesRevealed <= 1) return 3;
  if (cluesRevealed === 2) return 2;
  return 1;
}

export function emptyDaily(day: string, riddleId: string): DailyState {
  return { day, riddleId, cluesRevealed: 1, solved: false, gaveUp: false, stars: 0 };
}

/**
 * הרצף אחרי פתרון של היום.
 *
 * יום שדולג פשוט מאפס — בלי "הצלת רצף" בתשלום, ובלי לחץ להיכנס
 * כל יום. זה משחק, לא מנוי לחדר כושר.
 */
export function nextStreak(previous: number, lastDay: string | null, today: string): number {
  if (lastDay === today) return previous;
  if (lastDay && lastDay === previousDay(today)) return previous + 1;
  return 1;
}
