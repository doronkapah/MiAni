import { describe, expect, it } from "vitest";
import { riddles } from "./bank";
import {
  dailyLevel,
  dailyRiddle,
  dayKey,
  nextStreak,
  previousDay,
  starsFor,
} from "./daily";
import type { Profile } from "./types";

function player(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "p1",
    name: "בדיקה",
    age: 8,
    address: "male",
    avatar: "cat",
    worlds: { market: { rating: 3, streak: 0, answerStreak: 0 } },
    solved: [],
    revealed: [],
    recipes: [],
    createdAt: 0,
    chat: { day: "", count: 0 },
    ...overrides,
  };
}

describe("מפתח היום", () => {
  it("מחזיר תאריך מקומי בפורמט קבוע", () => {
    expect(dayKey(new Date(2026, 8, 6))).toBe("2026-09-06");
    expect(dayKey(new Date(2026, 0, 1))).toBe("2026-01-01");
  });

  it("היום הקודם עובר גם חודש וגם שנה", () => {
    expect(previousDay("2026-09-06")).toBe("2026-09-05");
    expect(previousDay("2026-09-01")).toBe("2026-08-31");
    expect(previousDay("2026-01-01")).toBe("2025-12-31");
  });
});

describe("בחירת חידת היום", () => {
  it("אותו יום ואותה רמה מחזירים תמיד את אותה חידה", () => {
    const first = dailyRiddle(player(), "2026-09-06");
    const second = dailyRiddle(player(), "2026-09-06");
    expect(first?.id).toBe(second?.id);
  });

  it("יום אחר מחזיר חידה אחרת", () => {
    const days = ["2026-09-06", "2026-09-07", "2026-09-08", "2026-09-09"];
    const picked = days.map((day) => dailyRiddle(player(), day)?.id);
    expect(new Set(picked).size).toBeGreaterThan(1);
  });

  it("החידה מגיעה מהרמה של השחקן", () => {
    const kid = player({ worlds: { market: { rating: 1, streak: 0, answerStreak: 0 } } });
    expect(dailyRiddle(kid, "2026-09-06")?.level).toBe(1);

    const grown = player({ worlds: { space: { rating: 6, streak: 0, answerStreak: 0 } } });
    expect(dailyRiddle(grown, "2026-09-06")?.level).toBe(6);
  });

  it("לא מגישה חידה שכבר נפתרה", () => {
    const day = "2026-09-06";
    const fresh = dailyRiddle(player(), day)!;
    const after = dailyRiddle(player({ solved: [fresh.id] }), day);
    expect(after?.id).not.toBe(fresh.id);
  });

  it("גם מי שפתר הכול מקבל חידה", () => {
    const everything = player({ solved: riddles.map((riddle) => riddle.id) });
    expect(dailyRiddle(everything, "2026-09-06")).not.toBeNull();
  });

  it("שחקן חדש בלי עולמות מקבל את הרמה הנמוכה", () => {
    expect(dailyLevel(player({ worlds: {} }))).toBe(1);
  });

  it("הרמה נלקחת מהעולם שבאמת משחקים בו", () => {
    const marketRiddles = riddles
      .filter((riddle) => riddle.world === "market")
      .slice(0, 4)
      .map((riddle) => riddle.id);

    // רמה 5 בחלל על הנייר, אבל כל מה שנפתר בפועל הוא בסופר
    const mixed = player({
      worlds: {
        market: { rating: 2, streak: 0, answerStreak: 0 },
        space: { rating: 5, streak: 0, answerStreak: 0 },
      },
      solved: marketRiddles,
    });
    expect(dailyLevel(mixed)).toBe(2);
  });

  it("שחקן שעבר לעולם אחר מקבל את הרמה שלו שם", () => {
    const spaceRiddles = riddles
      .filter((riddle) => riddle.world === "space")
      .slice(0, 6)
      .map((riddle) => riddle.id);

    const moved = player({
      worlds: {
        market: { rating: 2, streak: 0, answerStreak: 0 },
        space: { rating: 5, streak: 0, answerStreak: 0 },
      },
      solved: spaceRiddles,
    });
    expect(dailyLevel(moved)).toBe(5);
  });
});

describe("כוכבים ורצף", () => {
  it("פחות רמזים, יותר כוכבים", () => {
    expect(starsFor(1)).toBe(3);
    expect(starsFor(2)).toBe(2);
    expect(starsFor(3)).toBe(1);
    expect(starsFor(9)).toBe(1);
  });

  it("יום אחרי יום ממשיך את הרצף", () => {
    expect(nextStreak(4, "2026-09-05", "2026-09-06")).toBe(5);
  });

  it("יום שדולג מאפס", () => {
    expect(nextStreak(9, "2026-09-03", "2026-09-06")).toBe(1);
  });

  it("פתרון שני באותו יום לא מנפח את הרצף", () => {
    expect(nextStreak(4, "2026-09-06", "2026-09-06")).toBe(4);
  });

  it("שחקן חדש מתחיל ביום אחד", () => {
    expect(nextStreak(0, null, "2026-09-06")).toBe(1);
  });
});
