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
