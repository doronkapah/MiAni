import { describe, expect, it } from "vitest";
import { choicesFor } from "./choices";
import { riddles } from "./bank";

describe("בחירה מתוך תמונות", () => {
  it("לכל חידה בבנק יש ארבע אפשרויות", () => {
    for (const riddle of riddles) {
      expect(choicesFor(riddle), riddle.id).toHaveLength(4);
    }
  });

  it("התשובה תמיד ביניהן, ותמיד פעם אחת", () => {
    for (const riddle of riddles) {
      const mine = choicesFor(riddle).filter((choice) => choice.id === riddle.id);
      expect(mine, riddle.id).toHaveLength(1);
    }
  });

  it("אין שתי אפשרויות זהות", () => {
    for (const riddle of riddles) {
      const ids = choicesFor(riddle).map((choice) => choice.id);
      expect(new Set(ids).size, riddle.id).toBe(4);
    }
  });

  it("ארבע צורות שונות — זה הכלל שמאפשר לבחור בלי לקרוא", () => {
    for (const riddle of riddles) {
      const shapes = choicesFor(riddle).map((choice) => choice.art.shape);
      expect(new Set(shapes).size, `${riddle.id}: ${shapes.join(", ")}`).toBe(4);
    }
  });

  it("רוב המסיחים עדיין מגיעים מאותו מדף", () => {
    let same = 0;
    let total = 0;
    for (const riddle of riddles) {
      for (const choice of choicesFor(riddle)) {
        if (choice.id === riddle.id) continue;
        total += 1;
        const source = riddles.find((other) => other.id === choice.id)!;
        if (source.world === riddle.world && source.aisle === riddle.aisle) same += 1;
      }
    }
    // אבחנה חזותית קודמת לקרבה נושאית, אבל הקרבה לא נזנחת
    expect(same / total).toBeGreaterThan(0.5);
  });

  it("הסדר יציב — אותה חידה, אותן אפשרויות באותו סדר", () => {
    for (const riddle of riddles.slice(0, 40)) {
      const first = choicesFor(riddle).map((choice) => choice.id);
      const second = choicesFor(riddle).map((choice) => choice.id);
      expect(second).toEqual(first);
    }
  });

  it("התשובה לא תמיד באותו מקום", () => {
    const positions = new Set(
      riddles.map((riddle) =>
        choicesFor(riddle).findIndex((choice) => choice.id === riddle.id),
      ),
    );
    expect(positions.size).toBeGreaterThan(2);
  });
});
