/**
 * תשובה בבחירה, לילדים שעדיין לא מקלידים.
 *
 * ארבע אפשרויות: התשובה, ושלושה מסיחים מאותו מקום ואותה רמה —
 * כך שהבחירה דורשת להבין את הרמז ולא רק לזהות איזו מילה יפה יותר.
 * אם אין מספיק מאותו מקום, מרחיבים לאותו עולם.
 *
 * הסדר נקבע מזהה החידה ולא באקראי, כך שהאפשרויות לא קופצות
 * ממקום למקום בכל רינדור.
 */

import { riddles } from "./bank";
import type { Riddle } from "./types";

export interface Choice {
  id: string;
  label: string;
  art: Riddle["art"];
}

/** גיבוב יציב, כדי שהערבוב יהיה זהה בכל טעינה של אותה חידה */
function seed(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function shuffle<T>(items: T[], key: string): T[] {
  const out = [...items];
  let state = seed(key) || 1;
  for (let index = out.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [out[index], out[swap]] = [out[swap]!, out[index]!];
  }
  return out;
}

/**
 * ארבע אפשרויות לחידה.
 *
 * `pool` קיים לבדיקות; ברירת המחדל היא הבנק כולו.
 */
export function choicesFor(riddle: Riddle, pool: Riddle[] = riddles): Choice[] {
  const sameSpot = pool.filter(
    (other) =>
      other.id !== riddle.id &&
      other.world === riddle.world &&
      other.aisle === riddle.aisle,
  );
  const sameWorld = pool.filter(
    (other) =>
      other.id !== riddle.id &&
      other.world === riddle.world &&
      !sameSpot.includes(other),
  );

  // מסיחים מאותו מדף קודם — הם דורשים באמת לקרוא את הרמז
  const ranked = [
    ...shuffle(sameSpot, `${riddle.id}:spot`),
    ...shuffle(sameWorld, `${riddle.id}:world`),
  ];

  const options = [riddle, ...ranked.slice(0, 3)];
  return shuffle(options, riddle.id).map((option) => ({
    id: option.id,
    label: option.answer,
    art: option.art,
  }));
}
