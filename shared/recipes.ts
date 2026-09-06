/**
 * מתכונים.
 *
 * כשילד אוסף לעגלה את המצרכים של מתכון, המתכון נפתח וקופץ על המסך.
 * זו הסיבה הראשונה במשחק לאסוף פריט מסוים ולא סתם עוד אחד.
 *
 * הטקסט נשמר מנוקד בלבד, והגרסה בלי ניקוד נגזרת ממנו בהסרת הסימנים.
 * כך אין שתי גרסאות שיכולות להתפצל.
 */

import recipesData from "./data/recipes.json";
import { stripNikud } from "./matcher";
import type { Riddle } from "./types";

export interface RecipeSource {
  id: string;
  /** באיזה עולם הסט הזה נפתח */
  world: string;
  nameNikud: string;
  teaserNikud: string;
  /** מזהי חידות שחייבים להיות בעגלה */
  requires: string[];
  /** לחלופין: לפחות count מתוך הרשימה */
  anyOf?: { count: number; items: string[] };
  stepsNikud: string[];
  factNikud: string;
  art: string;
}

export interface Recipe extends RecipeSource {
  name: string;
  teaser: string;
  steps: string[];
  fact: string;
  /** כמה פריטים בסך הכול צריך כדי לפתוח את הסט */
  totalNeeded: number;
}

function hydrate(source: RecipeSource): Recipe {
  return {
    ...source,
    name: stripNikud(source.nameNikud),
    teaser: stripNikud(source.teaserNikud),
    steps: source.stepsNikud.map(stripNikud),
    fact: stripNikud(source.factNikud),
    totalNeeded: source.requires.length + (source.anyOf?.count ?? 0),
  };
}

export const recipes: Recipe[] = (recipesData as RecipeSource[]).map(hydrate);

export const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));

/** הסטים של עולם מסוים */
export function recipesOfWorld(world: string): Recipe[] {
  return recipes.filter((recipe) => recipe.world === world);
}

/** כמה מהמצרכים של המתכון כבר נמצאים בעגלה */
export function ingredientsHeld(recipe: Recipe, solved: Set<string>): number {
  const required = recipe.requires.filter((id) => solved.has(id)).length;
  const flexible = recipe.anyOf
    ? Math.min(recipe.anyOf.count, recipe.anyOf.items.filter((id) => solved.has(id)).length)
    : 0;
  return required + flexible;
}

export function isComplete(recipe: Recipe, solved: Set<string>): boolean {
  return ingredientsHeld(recipe, solved) >= recipe.totalNeeded;
}

/** כל המתכונים שאפשר להכין עם מה שיש בעגלה */
export function completedRecipes(solvedIds: string[], world?: string): Recipe[] {
  const solved = new Set(solvedIds);
  const pool = world ? recipesOfWorld(world) : recipes;
  return pool.filter((recipe) => isComplete(recipe, solved));
}

/**
 * מתכונים שנפתחו עכשיו ועוד לא נפתחו קודם.
 * זה מה שמפעיל את הקפיצה על המסך.
 */
export function newlyCompleted(solvedIds: string[], alreadyUnlocked: string[]): Recipe[] {
  const known = new Set(alreadyUnlocked);
  return completedRecipes(solvedIds).filter((recipe) => !known.has(recipe.id));
}

export interface RecipeProgress {
  id: string;
  name: string;
  teaser: string;
  art: string;
  unlocked: boolean;
  held: number;
  needed: number;
}

/**
 * מצב כל המתכונים, לספר המתכונים.
 *
 * חשוב: לא מחזיר שמות של מצרכים חסרים, רק כמה חסרים. שם של מצרך
 * שעוד לא נפתר הוא תשובה לחידה שהילד עוד לא פתר.
 */
export function recipeProgress(
  solvedIds: string[],
  unlocked: string[],
  world?: string,
): RecipeProgress[] {
  const solved = new Set(solvedIds);
  const known = new Set(unlocked);
  return (world ? recipesOfWorld(world) : recipes).map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    teaser: recipe.teaser,
    art: recipe.art,
    unlocked: known.has(recipe.id) || isComplete(recipe, solved),
    held: ingredientsHeld(recipe, solved),
    needed: recipe.totalNeeded,
  }));
}

export interface Goal {
  id: string;
  name: string;
  /** כמה כבר נאספו, וכמה צריך בסך הכול */
  held: number;
  needed: number;
  /** הפריטים שכבר יש, לפי סדר האיסוף */
  have: { id: string; answer: string; art: Riddle["art"] }[];
}

/**
 * היעד הקרוב ביותר בעולם.
 *
 * "תאספו פריטים" הוא לא יעד — הוא הוראה. יעד הוא שם, מספר, ותמונה
 * של מה שכבר יש. בוחרים את הסט שהכי קרוב להשלמה, וכשאין התקדמות
 * בכלל בוחרים את הקטן ביותר — כדי שהראשון יהיה בר־השגה במפגש אחד.
 */
export function nextGoal(
  solvedIds: string[],
  unlocked: string[],
  world: string,
  bank: Riddle[],
): Goal | null {
  const solved = new Set(solvedIds);
  const known = new Set(unlocked);
  const byId = new Map(bank.map((riddle) => [riddle.id, riddle]));

  const open = recipesOfWorld(world).filter(
    (recipe) => !known.has(recipe.id) && !isComplete(recipe, solved),
  );
  if (!open.length) return null;

  const scored = open.map((recipe) => {
    const held = ingredientsHeld(recipe, solved);
    const members = [...recipe.requires, ...(recipe.anyOf?.items ?? [])];

    /*
     * כמה רחוק הסט הזה בפועל: הרמה של הפריט הקשה ביותר
     * מבין הקלים שבו. סט שדורש רמה 4 הוא לא יעד ראשון, הוא
     * הבטחה רחוקה — גם אם יש בו פחות פריטים.
     */
    const levels = members
      .map((id) => byId.get(id)?.level ?? 99)
      .sort((a, b) => a - b)
      .slice(0, recipe.totalNeeded);
    const reach = levels.length ? Math.max(...levels) : 99;

    return { recipe, held, reach, ratio: held / recipe.totalNeeded };
  });

  scored.sort(
    (a, b) =>
      b.ratio - a.ratio ||
      a.reach - b.reach ||
      a.recipe.totalNeeded - b.recipe.totalNeeded ||
      (a.recipe.id < b.recipe.id ? -1 : 1),
  );

  const best = scored[0]!;
  const members = [...best.recipe.requires, ...(best.recipe.anyOf?.items ?? [])];

  return {
    id: best.recipe.id,
    name: best.recipe.name,
    held: best.held,
    needed: best.recipe.totalNeeded,
    have: members
      .filter((id) => solved.has(id))
      .slice(0, best.recipe.totalNeeded)
      .map((id) => byId.get(id))
      .filter((riddle): riddle is Riddle => Boolean(riddle))
      .map((riddle) => ({ id: riddle.id, answer: riddle.answer, art: riddle.art })),
  };
}
