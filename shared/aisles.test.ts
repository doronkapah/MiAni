import { describe, expect, it } from "vitest";
import { riddles } from "./bank";
import { AISLE_DECOR, aisleView, solvedAisleView } from "./aisles";

const AISLES = [...new Set(riddles.map((riddle) => riddle.aisle))];

describe("מדפי הסופר", () => {
  it("לכל מעבר בבנק יש מוצרי רקע משלו", () => {
    for (const aisle of AISLES) {
      expect(AISLE_DECOR[aisle], aisle).toBeDefined();
      expect(AISLE_DECOR[aisle]!.length, aisle).toBeGreaterThanOrEqual(5);
    }
  });

  it("ברמות 1–2 השלט מדויק והמוצרים מתאימים למעבר", () => {
    for (const aisle of AISLES) {
      for (const level of [1, 2]) {
        const view = aisleView(aisle, level);
        expect(view.sign, `${aisle} ברמה ${level}`).toBe(aisle);
        expect(view.precise).toBe(true);
        expect(view.decor).toEqual(AISLE_DECOR[aisle]);
      }
    }
  });

  it("ברמה 3 מוצג רק האזור הכללי, לא המעבר", () => {
    for (const aisle of AISLES) {
      const view = aisleView(aisle, 3);
      expect(view.precise).toBe(false);
      expect(view.sign, aisle).not.toBe(aisle);
      expect(view.sign.length).toBeGreaterThan(2);
    }
  });

  it("כל אזור מכסה יותר ממעבר אחד — אחרת הוא לא מחליש כלום", () => {
    const zones = new Map<string, string[]>();
    for (const aisle of AISLES) {
      const zone = aisleView(aisle, 3).sign;
      zones.set(zone, [...(zones.get(zone) ?? []), aisle]);
    }
    for (const [zone, covered] of zones) {
      expect(covered.length, `האזור "${zone}" מכיל רק את ${covered[0]}`).toBeGreaterThan(1);
    }
  });

  it("ברמה 4 השלט לא מגלה כלום", () => {
    for (const aisle of AISLES) {
      const view = aisleView(aisle, 4);
      expect(view.sign).toBe("מדף מסתורי");
      expect(view.precise).toBe(false);
    }
  });

  it("מוצרי הרקע ברמות הגבוהות זהים לכל המעברים — אחרת הם מסגירים", () => {
    const shapes = (level: number) =>
      AISLES.map((aisle) => JSON.stringify(aisleView(aisle, level).decor));
    for (const level of [3, 4]) {
      expect(new Set(shapes(level)).size, `רמה ${level}`).toBe(1);
    }
  });

  it("אחרי הפתרון תמיד מציגים את המעבר האמיתי", () => {
    for (const aisle of AISLES) {
      const view = solvedAisleView(aisle);
      expect(view.sign).toBe(aisle);
      expect(view.precise).toBe(true);
    }
  });
});
