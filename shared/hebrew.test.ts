import { describe, expect, it } from "vitest";
import { WORDS, count, fresh, isFeminine, noun, opened } from "./hebrew";
import { recipes } from "./recipes";
import { WORLDS } from "./worlds";

describe("יחיד ורבים", () => {
  it("אחד ואחת, לפי מין המילה", () => {
    expect(count(1, WORDS.item)).toBe("פריט אחד");
    expect(count(1, WORDS.riddle)).toBe("חידה אחת");
  });

  it("זוגי", () => {
    expect(count(2, WORDS.item)).toBe("שני פריטים");
    expect(count(2, WORDS.riddle)).toBe("שתי חידות");
  });

  it("שלושה ומעלה — מספר ורבים", () => {
    expect(count(3, WORDS.item)).toBe("3 פריטים");
    expect(count(12, WORDS.star)).toBe("12 כוכבים");
  });

  it("אפס הוא רבים", () => {
    expect(count(0, WORDS.item)).toBe("0 פריטים");
  });

  it("המילה לבדה, בלי המספר", () => {
    expect(noun(1, WORDS.riddle)).toBe("חידה");
    expect(noun(4, WORDS.riddle)).toBe("חידות");
  });
});

describe("מין הדבר שנפתח", () => {
  it("נפתח מול נפתחה", () => {
    expect(opened("מתכון")).toBe("נפתח");
    expect(opened("נבחרת")).toBe("נפתחה");
    expect(opened("אגדה")).toBe("נפתחה");
  });

  it("חדש מול חדשה", () => {
    expect(fresh("מסע")).toBe("חדש");
    expect(fresh("נבחרת")).toBe("חדשה");
  });

  it("כל שמות הסטים בכל העולמות מקבלים התאמה", () => {
    for (const world of WORLDS) {
      const single = world.sets.singular;
      expect(`${opened(single)} ${single} ${fresh(single)}`).toMatch(/^נפתחה?/);
    }
  });

  it("כל שמות הקבוצות בבנק מזוהים", () => {
    for (const recipe of recipes) {
      expect(typeof isFeminine(recipe.name)).toBe("boolean");
    }
  });
});
