/** טעינת בנק החידות ובניית יעדי ההשוואה. */

import riddlesData from "./data/riddles.json";
import type { Riddle } from "./types";
import { toTarget, type Target } from "./matcher";
import { WORLDS, type WorldId } from "./worlds";

export const riddles: Riddle[] = riddlesData as Riddle[];

export const riddleById = new Map(riddles.map((r) => [r.id, r]));

/**
 * יעד השוואה לכל חידה — התשובה והנרדפים שלה בצורה מנורמלת.
 *
 * היעדים נבנים על פני כל העולמות יחד, כי כלל ההבחנה חייב לראות את
 * הבנק כולו: "מאדים" ו"מארס" לא יכולים לחיות זה לצד זה גם אם הם
 * בעולמות שונים.
 */
export const targetById = new Map<string, Target>(
  riddles.map((r) => [r.id, toTarget(r.id, r.answer, r.aliases)]),
);

export const allTargets: Target[] = [...targetById.values()];

/** החידות של עולם מסוים */
export function riddlesOfWorld(world: string): Riddle[] {
  return riddles.filter((riddle) => riddle.world === world);
}

const BY_WORLD = new Map<string, Riddle[]>(
  WORLDS.map((world) => [world.id, riddlesOfWorld(world.id)]),
);

export function worldRiddles(world: string): Riddle[] {
  return BY_WORLD.get(world) ?? [];
}

export function riddlesAtLevel(world: string, level: number): Riddle[] {
  return worldRiddles(world).filter((riddle) => riddle.level === level);
}

/** אילו רמות באמת קיימות בעולם — לפי הבנק, לא לפי ההצהרה */
export function levelsInWorld(world: string): number[] {
  return [...new Set(worldRiddles(world).map((riddle) => riddle.level))].sort(
    (a, b) => a - b,
  );
}

export function bankSummary(): { world: WorldId; count: number; levels: number[] }[] {
  return WORLDS.map((world) => ({
    world: world.id,
    count: worldRiddles(world.id).length,
    levels: levelsInWorld(world.id),
  }));
}

export { LEVEL_NAMES } from "./worlds";
