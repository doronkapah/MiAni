import { describe, expect, it } from "vitest";
import { riddleById } from "./bank";
import { stripNikud } from "./matcher";
import {
  completedRecipes,
  ingredientsHeld,
  isComplete,
  newlyCompleted,
  recipeProgress,
  recipes,
} from "./recipes";

const ids = (list: { id: string }[]) => list.map((item) => item.id);

describe("בנק המתכונים", () => {
  it("כל מצרך מצביע על חידה שקיימת בבנק", () => {
    for (const recipe of recipes) {
      for (const id of [...recipe.requires, ...(recipe.anyOf?.items ?? [])]) {
        expect(riddleById.has(id), `${recipe.id}: ${id}`).toBe(true);
      }
    }
  });

  it("לכל מתכון יש שם, שלבים וטריוויה", () => {
    for (const recipe of recipes) {
      expect(recipe.name.length, recipe.id).toBeGreaterThan(2);
      expect(recipe.steps.length, recipe.id).toBeGreaterThanOrEqual(3);
      expect(recipe.fact.length, recipe.id).toBeGreaterThan(10);
    }
  });

  it("הטקסט באמת מנוקד, והגרסה בלי ניקוד נגזרת ממנו", () => {
    for (const recipe of recipes) {
      expect(recipe.nameNikud, recipe.id).not.toBe(recipe.name);
      expect(stripNikud(recipe.nameNikud)).toBe(recipe.name);
      for (const [index, step] of recipe.stepsNikud.entries()) {
        expect(step, `${recipe.id}[${index}]`).not.toBe(recipe.steps[index]);
        expect(stripNikud(step)).toBe(recipe.steps[index]);
      }
    }
  });

  it("מספר המצרכים הנדרש הגיוני", () => {
    for (const recipe of recipes) {
      expect(recipe.totalNeeded, recipe.id).toBeGreaterThanOrEqual(3);
      expect(recipe.totalNeeded, recipe.id).toBeLessThanOrEqual(6);
    }
  });
});

describe("פתיחת מתכון", () => {
  it("חביתה נפתחת בדיוק כשיש ביצה, חמאה ומלח", () => {
    const omelet = recipes.find((recipe) => recipe.id === "omelet")!;
    expect(isComplete(omelet, new Set(["egg", "butter"]))).toBe(false);
    expect(isComplete(omelet, new Set(["egg", "butter", "salt"]))).toBe(true);
  });

  it("סלט פירות דורש ארבעה פירות, לא שלושה", () => {
    const salad = recipes.find((recipe) => recipe.id === "fruitsalad")!;
    expect(isComplete(salad, new Set(["banana", "apple", "orange"]))).toBe(false);
    expect(isComplete(salad, new Set(["banana", "apple", "orange", "grapes"]))).toBe(true);
  });

  it("פירות נוספים מעבר לנדרש לא שוברים את הספירה", () => {
    const salad = recipes.find((recipe) => recipe.id === "fruitsalad")!;
    const all = new Set(salad.anyOf!.items);
    expect(ingredientsHeld(salad, all)).toBe(salad.totalNeeded);
  });

  it("מתכון שכבר נפתח לא נפתח שוב", () => {
    const solved = ["egg", "butter", "salt"];
    expect(ids(newlyCompleted(solved, []))).toEqual(["omelet"]);
    expect(newlyCompleted(solved, ["omelet"])).toEqual([]);
  });

  it("עגלה ריקה לא פותחת כלום", () => {
    expect(completedRecipes([])).toEqual([]);
  });

  it("אפשר לפתוח את כל המתכונים כשפותרים את כל הבנק", () => {
    const everything = [...riddleById.keys()];
    expect(completedRecipes(everything)).toHaveLength(recipes.length);
  });
});

describe("ספר המתכונים", () => {
  it("מתכון נעול מדווח כמה חסר, בלי לחשוף אילו מצרכים", () => {
    const progress = recipeProgress(["egg"], []);
    const omelet = progress.find((recipe) => recipe.id === "omelet")!;

    expect(omelet.unlocked).toBe(false);
    expect(omelet.held).toBe(1);
    expect(omelet.needed).toBe(3);

    // שם של מצרך שעוד לא נפתר הוא תשובה לחידה — אסור שיופיע
    const serialized = JSON.stringify(progress);
    for (const id of ["butter", "salt", "flour", "biscuits"]) {
      expect(serialized, `דלף השם של ${id}`).not.toContain(riddleById.get(id)!.answer);
    }
  });

  it("מתכון פתוח מסומן ככזה גם אחרי שנשמר בפרופיל", () => {
    const progress = recipeProgress([], ["omelet"]);
    expect(progress.find((recipe) => recipe.id === "omelet")!.unlocked).toBe(true);
  });
});
