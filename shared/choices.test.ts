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

  it("כל המסיחים מאותו עולם — אחרת הבחירה טריוויאלית", () => {
    for (const riddle of riddles) {
      for (const choice of choicesFor(riddle)) {
        const source = riddles.find((other) => other.id === choice.id)!;
        expect(source.world, `${riddle.id} ← ${choice.id}`).toBe(riddle.world);
      }
    }
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
