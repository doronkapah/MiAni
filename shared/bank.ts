/**
 * בנק החידות.
 *
 * ה-JSON מיובא ישירות לתוך החבילה, כדי שאותו קוד ירוץ גם בדפדפן
 * (אתר סטטי, בלי שרת) וגם ב-Node (השרת המקומי והסקריפטים).
 */

import riddlesData from "./data/riddles.json";
import type { Riddle } from "./types";
import { toTarget, type Target } from "./matcher";

export const riddles: Riddle[] = riddlesData as Riddle[];

export const riddleById = new Map(riddles.map((r) => [r.id, r]));

/** יעד השוואה לכל חידה — התשובה והנרדפים שלה בצורה מנורמלת */
export const targetById = new Map<string, Target>(
  riddles.map((r) => [r.id, toTarget(r.id, r.answer, r.aliases)]),
);

export const allTargets: Target[] = [...targetById.values()];

export function riddlesAtLevel(level: number): Riddle[] {
  return riddles.filter((r) => r.level === level);
}

export const LEVELS = [1, 2, 3, 4] as const;

/** שמות הרמות, כפי שמוצגים לילד */
export const LEVEL_NAMES: Record<number, string> = {
  1: "מדף הגן",
  2: "מדף א׳–ב׳",
  3: "מדף ג׳–ד׳",
  4: "אלופי הסופר",
};
