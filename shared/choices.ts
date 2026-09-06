/**
 * תשובה בבחירה, לילדים שעדיין לא מקלידים.
 *
 * ארבע אפשרויות: התשובה, ושלושה מסיחים. שני כללים, לפי סדר:
 *
 *   1. **כל ארבע הצורות שונות זו מזו.** זה הכלל החשוב. ילד שלא
 *      קורא רואה ציורים, ואם שלוש מהאפשרויות הן אותו כיכר לחם
 *      בגוונים שונים — אין כאן בחירה, יש ניחוש.
 *   2. אחרי זה, מסיחים מאותו מקום ואותה רמה. כך הבחירה דורשת
 *      להבין את הרמז, ולא רק לזהות איזה ציור יפה יותר.
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
  const others = pool.filter((other) => other.id !== riddle.id);

  /*
   * שלוש שכבות של קרבה, מהטובה לפחות טובה. עוברים עליהן לפי הסדר
   * ולוקחים רק מה שמוסיף צורה חדשה — כך שהמסיחים קרובים ככל האפשר,
   * אבל אף פעם לא על חשבון האבחנה החזותית.
   */
  const layers = [
    others.filter((o) => o.world === riddle.world && o.aisle === riddle.aisle),
    others.filter((o) => o.world === riddle.world && o.aisle !== riddle.aisle),
    others.filter((o) => o.world !== riddle.world),
  ];

  const used = new Set([riddle.art.shape]);
  const picked: Riddle[] = [];

  for (const layer of layers) {
    for (const candidate of shuffle(layer, `${riddle.id}:${layer.length}`)) {
      if (picked.length >= 3) break;
      if (used.has(candidate.art.shape)) continue;
      used.add(candidate.art.shape);
      picked.push(candidate);
    }
    if (picked.length >= 3) break;
  }

  const options = [riddle, ...picked];
  return shuffle(options, riddle.id).map((option) => ({
    id: option.id,
    label: option.answer,
    art: option.art,
  }));
}
