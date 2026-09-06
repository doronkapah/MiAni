import { describe, expect, it } from "vitest";
import { riddleById, riddles } from "./bank";
import { stripNikud } from "./matcher";
import {
  completedRecipes,
  ingredientsHeld,
  isComplete,
  newlyCompleted,
  recipeProgress,
  recipes,
  recipeById,
  nextGoal,
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

describe("היעד גלוי גם כשהוא נעול", () => {
  const bank = riddles;

  it("סט נעול מדווח את שמו — לא ??? ", () => {
    const progress = recipeProgress([], [], "market", bank);
    for (const recipe of progress) {
      expect(recipe.name.length, recipe.id).toBeGreaterThan(2);
    }
  });

  it("הפריטים שנאספו מגיעים עם ציור ושם", () => {
    const omelet = recipeById.get("omelet")!;
    const first = omelet.requires[0]!;
    const progress = recipeProgress([first], [], "market", bank);
    const mine = progress.find((recipe) => recipe.id === "omelet")!;

    expect(mine.held).toBe(1);
    expect(mine.have).toHaveLength(1);
    expect(mine.have[0]!.id).toBe(first);
    expect(mine.have[0]!.art.shape.length).toBeGreaterThan(2);
  });

  it("פריטים שעוד לא נאספו לא מודלפים", () => {
    const omelet = recipeById.get("omelet")!;
    const progress = recipeProgress([omelet.requires[0]!], [], "market", bank);
    const mine = progress.find((recipe) => recipe.id === "omelet")!;

    // רק מה שנפתר; השאר נשאר משבצת ריקה על המסך
    expect(mine.have).toHaveLength(1);
    expect(mine.have.length).toBeLessThan(mine.needed);
  });

  it("פס היעד והספר מסכימים על אותו מספר", () => {
    const some = riddles.filter((riddle) => riddle.world === "market").slice(0, 3);
    const solved = some.map((riddle) => riddle.id);

    const goal = nextGoal(solved, [], "market", bank)!;
    const inBook = recipeProgress(solved, [], "market", bank).find(
      (recipe) => recipe.id === goal.id,
    )!;

    expect(inBook.held).toBe(goal.held);
    expect(inBook.needed).toBe(goal.needed);
    expect(inBook.name).toBe(goal.name);
  });
});
