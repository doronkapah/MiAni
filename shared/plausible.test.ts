import { describe, expect, it } from "vitest";
import { plausibleGuess } from "./plausible";
import { riddles, allTargets, targetById } from "./bank";
import { checkAnswer } from "./matcher";

function riddleOf(answer: string) {
  const found = riddles.find((riddle) => riddle.answer === answer);
  if (!found) throw new Error(`אין חידה עם התשובה ${answer}`);
  return found;
}

describe("ניחוש הגיוני", () => {
  it("מזהה חלופה שנכתבה ידנית", () => {
    // "אני עגול ואדום, וגדלתי על עץ" — דובדבן עונה על זה מצוין
    expect(plausibleGuess("דובדבן", riddleOf("תפוח"))).not.toBeNull();
  });

  it("מזהה פריט אחר מהבנק, ואומר מה משותף להם", () => {
    const result = plausibleGuess("עגבנייה", riddleOf("תפוח"));
    expect(result).not.toBeNull();
    expect(result!.shared).toBe("פירות וירקות");
  });

  it("פריט מבנק אחר מזוהה, בלי מכנה משותף", () => {
    const result = plausibleGuess("שוקולד", riddleOf("תפוח"));
    expect(result).not.toBeNull();
    expect(result!.shared).toBeUndefined();
  });

  it("ניחוש מהאוויר הוא לא הגיוני", () => {
    expect(plausibleGuess("מכונית", riddleOf("תפוח"))).toBeNull();
    expect(plausibleGuess("זגזוגתמנון", riddleOf("תפוח"))).toBeNull();
  });

  it("סלחני לשגיאות כתיב גם בחלופות", () => {
    expect(plausibleGuess("דובדבנ", riddleOf("תפוח"))).not.toBeNull();
  });

  it("התשובה הנכונה עצמה לא נחשבת חלופה", () => {
    expect(plausibleGuess("תפוח", riddleOf("תפוח"))).toBeNull();
  });

  it("ניחוש ריק לא נחשב", () => {
    expect(plausibleGuess("   ", riddleOf("תפוח"))).toBeNull();
  });
});

describe("שלמות רשימת החלופות", () => {
  const withFits = riddles.filter((riddle) => riddle.alsoFits?.length);

  it("יש חלופות לכל חידה ברמות 1–2", () => {
    const easy = riddles.filter((riddle) => riddle.level <= 2);
    const without = easy.filter((riddle) => !riddle.alsoFits?.length);
    expect(without.map((riddle) => riddle.id)).toEqual([]);
  });

  it("חלופה אף פעם אינה התשובה עצמה", () => {
    for (const riddle of withFits) {
      const target = targetById.get(riddle.id)!;
      for (const option of riddle.alsoFits!) {
        const result = checkAnswer({ guess: option, target, others: allTargets });
        expect(result.status, `${riddle.answer}: "${option}" מתקבל כתשובה`).not.toBe("correct");
      }
    }
  }, 60_000);

  it("אין חלופות כפולות באותה חידה", () => {
    for (const riddle of withFits) {
      expect(new Set(riddle.alsoFits!).size, riddle.id).toBe(riddle.alsoFits!.length);
    }
  });

  it("כל חלופה מזוהה כהגיונית", () => {
    for (const riddle of withFits) {
      for (const option of riddle.alsoFits!) {
        expect(
          plausibleGuess(option, riddle),
          `${riddle.answer}: "${option}" לא זוהה`,
        ).not.toBeNull();
      }
    }
  }, 60_000);
});
