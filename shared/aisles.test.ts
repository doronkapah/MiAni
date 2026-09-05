import { describe, expect, it } from "vitest";
import { riddles } from "./bank";
import { PLACE_DECOR, aisleView, placesOf, solvedAisleView } from "./aisles";
import { WORLDS, type WorldId } from "./worlds";

/** המקומות שבאמת מופיעים בבנק, לכל עולם */
function placesInBank(world: string): string[] {
  return [...new Set(riddles.filter((r) => r.world === world).map((r) => r.aisle))];
}

describe("המקומות של כל עולם", () => {
  for (const world of WORLDS) {
    describe(world.name, () => {
      it("לכל מקום שמופיע בבנק יש פריטי רקע משלו", () => {
        for (const place of placesInBank(world.id)) {
          expect(PLACE_DECOR[world.id][place], `${world.id}: ${place}`).toBeDefined();
          expect(PLACE_DECOR[world.id][place]!.length, place).toBeGreaterThanOrEqual(5);
        }
      });

      it("ברמות 1–2 השלט מדויק והפריטים מתאימים", () => {
        for (const place of placesOf(world.id)) {
          for (const level of [1, 2]) {
            const view = aisleView(world.id, place, level);
            expect(view.sign, `${place} ברמה ${level}`).toBe(place);
            expect(view.precise).toBe(true);
            expect(view.decor).toEqual(PLACE_DECOR[world.id][place]);
          }
        }
      });

      it("ברמה 3 מוצג רק האזור הכללי", () => {
        for (const place of placesOf(world.id)) {
          const view = aisleView(world.id, place, 3);
          expect(view.precise).toBe(false);
          expect(view.sign, place).not.toBe(place);
          expect(view.sign.length).toBeGreaterThan(2);
        }
      });

      it("כל אזור מכסה יותר ממקום אחד — אחרת הוא לא מחליש כלום", () => {
        const zones = new Map<string, string[]>();
        for (const place of placesOf(world.id)) {
          const zone = aisleView(world.id, place, 3).sign;
          zones.set(zone, [...(zones.get(zone) ?? []), place]);
        }
        for (const [zone, covered] of zones) {
          expect(covered.length, `${world.id}: "${zone}" מכסה רק את ${covered[0]}`).toBeGreaterThan(1);
        }
      });

      it("מרמה 4 ומעלה השלט לא מגלה כלום", () => {
        for (const place of placesOf(world.id)) {
          for (const level of [4, 5, 6]) {
            const view = aisleView(world.id, place, level);
            expect(view.sign).toBe(world.mysteryPlace);
            expect(view.precise).toBe(false);
          }
        }
      });

      it("הפריטים ברמות הגבוהות זהים לכל המקומות", () => {
        const shapes = placesOf(world.id).map((place) =>
          JSON.stringify(aisleView(world.id, place, 4).decor),
        );
        expect(new Set(shapes).size).toBe(1);
      });

      it("אחרי הפתרון תמיד מציגים את המקום האמיתי", () => {
        for (const place of placesOf(world.id)) {
          const view = solvedAisleView(world.id, place);
          expect(view.sign).toBe(place);
          expect(view.precise).toBe(true);
        }
      });
    });
  }

  it("שלט מסתורי שונה בכל עולם", () => {
    const signs = WORLDS.map((world) => world.mysteryPlace);
    expect(new Set(signs).size).toBe(WORLDS.length);
  });

  it("אין מקום בבנק שאין לו עולם מוכר", () => {
    const known = new Set<string>(WORLDS.map((world) => world.id));
    for (const riddle of riddles) {
      expect(known.has(riddle.world), `${riddle.id}: ${riddle.world}`).toBe(true);
    }
  });

  it("הרמות שהעולם מצהיר עליהן קיימות בבנק", () => {
    for (const world of WORLDS) {
      const inBank = new Set(
        riddles.filter((r) => r.world === world.id).map((r) => r.level),
      );
      for (const level of inBank) {
        expect(world.levels, `${world.id} רמה ${level}`).toContain(level);
      }
      expect(inBank.size, `${world.id} ריק`).toBeGreaterThan(0);
    }
  });
});

describe("שלמות טיפוסי העולם", () => {
  it("כל עולם מוגדר במפת המקומות", () => {
    for (const world of WORLDS) {
      expect(PLACE_DECOR[world.id as WorldId]).toBeDefined();
    }
  });
});
