/**
 * דירוג הקושי לכל פרופיל, ובחירת החידה הבאה.
 *
 * לכל פרופיל דירוג עשרוני. הרמה בפועל היא החלק השלם שלו.
 * מעבר לרמה הבאה דורש שלושה פתרונות חזקים ברצף — פתרון עם רמז אחד
 * לכל היותר — כדי שילד לא ייזרק לרמה קשה בגלל ניחוש מוצלח בודד.
 */

import type { Profile, Riddle } from "./types";

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 4;

/** כמה ימים חידה שנחשפה ב"גלה לי" יושבת בצד לפני שהיא חוזרת */
export const REVEAL_COOLDOWN_DAYS = 3;

/** שלושה פתרונות חזקים ברצף פותחים את הרמה הבאה */
export const STREAK_TO_ADVANCE = 3;

export function startingRating(age: number): number {
  if (age <= 5) return 1;
  if (age <= 7) return 2;
  if (age <= 9) return 3;
  return 4;
}

export function levelOf(rating: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(rating)));
}

/** כמה רמזים נחשפים לכל היותר ברמה נתונה */
export function cluesAtLevel(level: number): number {
  return level === 1 ? 2 : level === 2 ? 3 : 4;
}

export interface SolveOutcome {
  hintsUsed: number;
}

export interface RatingChange {
  rating: number;
  streak: number;
  levelBefore: number;
  levelAfter: number;
  delta: number;
}

/**
 * פתרון מוצלח. ככל שהילד השתמש בפחות רמזים, העלייה גדולה יותר —
 * אבל אף פעם לא שלילית: מי שפתר, התקדם.
 */
export function applySolve(profile: Profile, { hintsUsed }: SolveOutcome): RatingChange {
  const levelBefore = levelOf(profile.rating);
  const delta = Math.max(0.1, 0.34 - 0.08 * Math.max(0, hintsUsed - 1));
  const strong = hintsUsed <= 1;
  const streak = strong ? profile.streak + 1 : 0;

  let rating = profile.rating + delta;

  // תקרה: אי אפשר לחצות לרמה הבאה בלי רצף של פתרונות חזקים
  if (streak < STREAK_TO_ADVANCE) {
    const ceiling = levelBefore + 0.999;
    if (rating > ceiling) rating = ceiling;
  }
  rating = Math.min(MAX_LEVEL + 0.999, rating);

  const levelAfter = levelOf(rating);
  return {
    rating,
    streak: levelAfter > levelBefore ? 0 : streak,
    levelBefore,
    levelAfter,
    delta,
  };
}

/** שימוש ב"גלה לי" — ירידה קטנה, ואיפוס הרצף */
export function applyReveal(profile: Profile): RatingChange {
  const levelBefore = levelOf(profile.rating);
  const rating = Math.max(MIN_LEVEL, profile.rating - 0.2);
  const levelAfter = levelOf(rating);
  return { rating, streak: 0, levelBefore, levelAfter, delta: rating - profile.rating };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * בוחר את החידה הבאה: מהרמה הנוכחית, מה שעוד לא נפתר,
 * ובלי חידות שנחשפו לאחרונה. אם נגמרו — מרחיב את החיפוש.
 */
export function pickRiddle(
  profile: Profile,
  riddles: Riddle[],
  now = Date.now(),
): Riddle | null {
  const level = levelOf(profile.rating);
  const solved = new Set(profile.solved);
  const cooling = new Set(
    profile.revealed
      .filter((r) => now - r.at < REVEAL_COOLDOWN_DAYS * DAY_MS)
      .map((r) => r.id),
  );

  const atLevel = riddles.filter((r) => r.level === level);

  const fresh = atLevel.filter((r) => !solved.has(r.id) && !cooling.has(r.id));
  if (fresh.length) return sample(fresh);

  // נגמרו החדשות ברמה: מחזירים חידות שנחשפו, הוותיקה ביותר קודם
  const revisit = atLevel.filter((r) => !solved.has(r.id));
  if (revisit.length) return sample(revisit);

  // נגמרה הרמה כולה: עולים רמה, ואם אין — יורדים
  for (const other of [level + 1, level - 1, level + 2, level - 2]) {
    if (other < MIN_LEVEL || other > MAX_LEVEL) continue;
    const candidates = riddles.filter((r) => r.level === other && !solved.has(r.id));
    if (candidates.length) return sample(candidates);
  }

  return null;
}

function sample<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** התקדמות הילד בתוך הרמה הנוכחית, לפס ההתקדמות */
export function progressInLevel(rating: number): number {
  const level = levelOf(rating);
  return Math.min(1, Math.max(0, rating - level));
}
