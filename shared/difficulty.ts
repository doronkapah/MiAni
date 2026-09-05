/**
 * דירוג הקושי, ובחירת החידה הבאה.
 *
 * לכל שחקן דירוג עשרוני **נפרד לכל עולם**. הרמה בפועל היא החלק
 * השלם שלו. מעבר לרמה הבאה דורש שלושה פתרונות חזקים ברצף — פתרון
 * עם רמז אחד לכל היותר — כדי ששחקן לא ייזרק לרמה קשה בגלל ניחוש
 * מוצלח בודד.
 */

import type { Profile, Riddle, WorldProgress } from "./types";
import { MAX_LEVEL, MIN_LEVEL } from "./worlds";
import { levelsInWorld } from "./bank";

export { MIN_LEVEL, MAX_LEVEL };

/** כמה ימים חידה שנחשפה או שדילגו עליה יושבת בצד */
export const REVEAL_COOLDOWN_DAYS = 3;

/** שלושה פתרונות חזקים ברצף פותחים את הרמה הבאה */
export const STREAK_TO_ADVANCE = 3;

/**
 * רמת הפתיחה לפי גיל.
 *
 * מבוגר נרשם כגיל 18 ומתחיל ברמה 5, לא 6 — רמה 6 נשארת
 * משהו שמרוויחים אותו. פתיחה ברמה הגבוהה ביותר מגישה מיד את הקשות
 * מכולן, ומשאירה לשחקן לאן להתקדם.
 */
export function startingRating(age: number): number {
  if (age <= 5) return 1;
  if (age <= 7) return 2;
  if (age <= 9) return 3;
  if (age <= 11) return 4;
  return 5;
}

/**
 * רמת הפתיחה בעולם מסוים.
 *
 * עולם לא חייב להתחיל ברמה 1 — באולימפיאדה אין חידות ברמה 1, ואין
 * טעם להתחיל שם ילד בן חמש ברמה שאין בה כלום.
 */
export function startingRatingForWorld(age: number, world: string): number {
  const levels = levelsInWorld(world);
  if (!levels.length) return startingRating(age);
  const wanted = startingRating(age);
  const lowest = levels[0]!;
  const highest = levels[levels.length - 1]!;
  return Math.min(highest, Math.max(lowest, wanted));
}

export function levelOf(rating: number): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.floor(rating)));
}

/** כמה רמזים נחשפים לכל היותר ברמה נתונה */
export function cluesAtLevel(level: number): number {
  return level === 1 ? 2 : level === 2 ? 3 : 4;
}

export function emptyProgress(age: number, world: string): WorldProgress {
  return { rating: startingRatingForWorld(age, world), streak: 0, answerStreak: 0 };
}

/** ההתקדמות בעולם, עם השלמה לפרופילים שעוד לא שיחקו בו */
export function progressIn(profile: Profile, world: string): WorldProgress {
  return profile.worlds[world] ?? emptyProgress(profile.age, world);
}

export interface RatingChange {
  rating: number;
  streak: number;
  levelBefore: number;
  levelAfter: number;
  delta: number;
}

/**
 * פתרון מוצלח. ככל שהשחקן השתמש בפחות רמזים, העלייה גדולה יותר —
 * אבל אף פעם לא שלילית: מי שפתר, התקדם.
 */
export function applySolve(
  progress: WorldProgress,
  { hintsUsed }: { hintsUsed: number },
  world?: string,
): RatingChange {
  const levelBefore = levelOf(progress.rating);
  const delta = Math.max(0.1, 0.34 - 0.08 * Math.max(0, hintsUsed - 1));
  const strong = hintsUsed <= 1;
  const streak = strong ? progress.streak + 1 : 0;

  let rating = progress.rating + delta;

  // תקרה: אי אפשר לחצות לרמה הבאה בלי רצף של פתרונות חזקים
  if (streak < STREAK_TO_ADVANCE) {
    const ceiling = levelBefore + 0.999;
    if (rating > ceiling) rating = ceiling;
  }

  // ולא מעבר לרמה הגבוהה ביותר שיש בעולם הזה חידות עבורה
  const levels = world ? levelsInWorld(world) : [];
  const top = levels.length ? levels[levels.length - 1]! : MAX_LEVEL;
  rating = Math.min(top + 0.999, rating);

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
export function applyReveal(progress: WorldProgress, world?: string): RatingChange {
  const levelBefore = levelOf(progress.rating);
  const levels = world ? levelsInWorld(world) : [];
  const floor = levels.length ? levels[0]! : MIN_LEVEL;
  const rating = Math.max(floor, progress.rating - 0.2);
  const levelAfter = levelOf(rating);
  return { rating, streak: 0, levelBefore, levelAfter, delta: rating - progress.rating };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * בוחר את החידה הבאה: מהעולם הנוכחי, מהרמה הנוכחית, מה שעוד לא
 * נפתר, ובלי חידות שנחשפו או שדילגו עליהן לאחרונה.
 */
export function pickRiddle(
  profile: Profile,
  world: string,
  pool: Riddle[],
  now = Date.now(),
): Riddle | null {
  const level = levelOf(progressIn(profile, world).rating);
  const solved = new Set(profile.solved);
  const cooling = new Set(
    profile.revealed
      .filter((entry) => now - entry.at < REVEAL_COOLDOWN_DAYS * DAY_MS)
      .map((entry) => entry.id),
  );

  const inWorld = pool.filter((riddle) => riddle.world === world);
  const atLevel = inWorld.filter((riddle) => riddle.level === level);

  const fresh = atLevel.filter((r) => !solved.has(r.id) && !cooling.has(r.id));
  if (fresh.length) return sample(fresh);

  const revisit = atLevel.filter((r) => !solved.has(r.id));
  if (revisit.length) return sample(revisit);

  // נגמרה הרמה: מחפשים ברמות הקרובות, מהקרובה לרחוקה
  const others = [...new Set(inWorld.map((riddle) => riddle.level))]
    .filter((other) => other !== level)
    .sort((a, b) => Math.abs(a - level) - Math.abs(b - level));

  for (const other of others) {
    const candidates = inWorld.filter((r) => r.level === other && !solved.has(r.id));
    if (candidates.length) return sample(candidates);
  }
  return null;
}

function sample<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** התקדמות בתוך הרמה הנוכחית, לפס ההתקדמות */
export function progressInLevel(rating: number): number {
  const level = levelOf(rating);
  return Math.min(1, Math.max(0, rating - level));
}
