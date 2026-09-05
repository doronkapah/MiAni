import { describe, expect, it } from "vitest";
import {
  checkAnswer,
  normalize,
  thresholdsFor,
  stripNikud,
  toTarget,
  variants,
  weightedDistance,
} from "./matcher";
import { allTargets, riddles, targetById } from "./bank";
import { commonTypos } from "../scripts/typo-report";

const pasta = toTarget("pasta", "פסטה", ["ספגטי", "מקרוני", "אטריות"]);
const others = () => allTargets;

describe("normalize", () => {
  it("מסיר ניקוד", () => {
    expect(normalize("פַּסְטָה")).toBe("פסטה");
    // כתיב מנוקד חסר יו"ד אחת לעומת כתיב מלא — זו התנהגות נכונה
    expect(normalize("עַגְבָנִיָּה")).toBe("עגבניה");
  });

  it("מאחד אותיות סופיות", () => {
    expect(normalize("מים")).toBe("מימ");
    expect(normalize("לחם")).toBe("לחמ");
    expect(normalize("ארץ")).toBe("ארצ");
  });

  it("מסיר פיסוק, מרכאות ורווחים מיותרים", () => {
    expect(normalize("  פסטה!!  ")).toBe("פסטה");
    expect(normalize("ג׳ינג׳ר")).toBe("גינגר");
    expect(normalize("תפוח   אדמה")).toBe("תפוח אדמה");
  });

  it("מתעלם מתווים שאינם עבריים", () => {
    expect(normalize("pasta פסטה 123")).toBe("פסטה");
  });
});

describe("variants", () => {
  it("מסיר מילות פתיחה של ילדים", () => {
    expect(variants("אני חושבת שזה פסטה")).toContain("פסטה");
    expect(variants("אולי זה לחם")).toContain("לחמ");
    expect(variants("התשובה היא דבש")).toContain("דבש");
  });

  it("מסיר ה׳ הידיעה", () => {
    expect(variants("הפסטה")).toContain("פסטה");
  });

  it("גוזר יחיד מריבוי", () => {
    expect(variants("עגבניות")).toContain("עגבני");
    expect(variants("תפוחים")).toContain("תפוח");
  });
});

describe("weightedDistance", () => {
  it("חילוף בתוך קבוצה פונטית זול", () => {
    expect(weightedDistance("פסתה", "פסטה")).toBeCloseTo(0.25);
    expect(weightedDistance("קמח", "כמח")).toBeCloseTo(0.25);
  });

  it("אם קריאה מיותרת זולה", () => {
    expect(weightedDistance("פאסטה", "פסטה")).toBeCloseTo(0.25);
    expect(weightedDistance("חומצ", "חומצ")).toBe(0);
  });

  it("היפוך אותיות זול", () => {
    expect(weightedDistance("פסהט", "פסטה")).toBeCloseTo(0.5);
  });

  it("החלפה אקראית עולה מלא", () => {
    expect(weightedDistance("פסטר", "פסטה")).toBeCloseTo(1);
  });

  it("סימטרי", () => {
    expect(weightedDistance("פסתה", "פסטה")).toBeCloseTo(weightedDistance("פסטה", "פסתה"));
  });
});

describe("thresholdsFor", () => {
  it("מילים קצרות מקבלות סף נמוך", () => {
    expect(thresholdsFor(3).correct).toBeLessThan(thresholdsFor(6).correct);
    expect(thresholdsFor(6).correct).toBeLessThan(thresholdsFor(10).correct);
  });
});

describe("checkAnswer — תשובות עם שגיאות כתיב", () => {
  const accepted = [
    "פסטה",
    "פסתה",
    "פאסטה",
    "פסטא",
    "פאסתא",
    "הפסטה",
    "אני חושב שזה פסטה",
    "  פסטה  ",
    "ספגטי",
    "מקרוני",
    "אטריות",
  ];

  for (const guess of accepted) {
    it(`מקבל: ${guess}`, () => {
      expect(checkAnswer({ guess, target: pasta, others: others() }).status).toBe("correct");
    });
  }

  const rejected = ["פסטר", "לחם", "אורז", "שוקולד", "אבטיח"];
  for (const guess of rejected) {
    it(`דוחה: ${guess}`, () => {
      expect(checkAnswer({ guess, target: pasta, others: others() }).status).not.toBe("correct");
    });
  }

  it("ניחוש קצר מדי נדחה", () => {
    expect(checkAnswer({ guess: "פ", target: pasta }).reason).toBe("too-short");
    expect(checkAnswer({ guess: "", target: pasta }).reason).toBe("too-short");
  });
});

describe("checkAnswer — כלל ההבחנה", () => {
  it("לא מקבל שם של פריט אחר בבנק", () => {
    const milk = targetById.get("milk")!;
    const result = checkAnswer({ guess: "חלה", target: milk, others: others() });
    expect(result.status).toBe("wrong");
    expect(result.reason).toBe("ambiguous");
  });

  it("תמרים אינם שמרים", () => {
    const yeast = targetById.get("yeast")!;
    expect(checkAnswer({ guess: "תמרים", target: yeast, others: others() }).status).toBe("wrong");
  });

  it("שמנת אינה שמן", () => {
    const soup = targetById.get("soupmix")!;
    expect(checkAnswer({ guess: "שמנת", target: soup, others: others() }).status).toBe("wrong");
  });
});

describe("checkAnswer — כמעט", () => {
  it("מילה אחת מתוך תשובה בת שתי מילים היא כמעט", () => {
    const oil = targetById.get("oliveoil")!;
    const result = checkAnswer({ guess: "שמן", target: oil, others: others() });
    expect(result.status).toBe("close");
    expect(result.reason).toBe("partial-word");
  });

  it("טעות אחת גדולה במילה קצרה היא כמעט, לא נכון", () => {
    const rice = targetById.get("rice")!;
    const result = checkAnswer({ guess: "אורד", target: rice, others: others() });
    expect(result.status).toBe("close");
    expect(result.reason).toBe("near-threshold");
  });

  it("ניחוש שנמצא בדיוק בין שני פריטים נדחה", () => {
    // "מלק" רחוק במידה שווה מ"מלח" ומ"סלק"
    const salt = targetById.get("salt")!;
    const result = checkAnswer({ guess: "מלק", target: salt, others: others() });
    expect(result.reason).toBe("ambiguous");
  });
});

describe("בנק החידות", () => {
  it("לכל חידה תשובה שמתקבלת כמו שהיא", () => {
    for (const riddle of riddles) {
      const target = targetById.get(riddle.id)!;
      const result = checkAnswer({ guess: riddle.answer, target, others: allTargets });
      expect(result.status, `${riddle.id}: ${riddle.answer}`).toBe("correct");
    }
  });

  it("לכל חידה כל הנרדפים מתקבלים", () => {
    for (const riddle of riddles) {
      const target = targetById.get(riddle.id)!;
      for (const alias of riddle.aliases) {
        const result = checkAnswer({ guess: alias, target, others: allTargets });
        expect(result.status, `${riddle.id}: ${alias}`).toBe("correct");
      }
    }
  });

  it("התשובה המנוקדת תואמת לתשובה הרגילה", () => {
    // הפרש של אם קריאה מותר: כתיב מנוקד חסר מול כתיב מלא
    for (const riddle of riddles) {
      const distance = weightedDistance(
        normalize(riddle.answerNikud),
        normalize(riddle.answer),
      );
      expect(distance, `${riddle.id}: ${riddle.answerNikud}`).toBeLessThanOrEqual(0.5);
    }
  });

  it("כל תשובה מנוקדת מתקבלת כניחוש", () => {
    for (const riddle of riddles) {
      const target = targetById.get(riddle.id)!;
      const result = checkAnswer({ guess: riddle.answerNikud, target, others: allTargets });
      expect(result.status, `${riddle.id}: ${riddle.answerNikud}`).toBe("correct");
    }
  });

  it("לכל חידה יש רמזים מנוקדים", () => {
    for (const riddle of riddles) {
      expect(riddle.cluesNikud, riddle.id).toBeDefined();
      expect(riddle.cluesNikud!.length, riddle.id).toBe(riddle.clues.length);
    }
  });

  it("הרמז המנוקד זהה לרמז הרגיל, אות באות", () => {
    for (const riddle of riddles) {
      for (const [index, pointed] of (riddle.cluesNikud ?? []).entries()) {
        expect(stripNikud(pointed), `${riddle.id}[${index}]`).toBe(riddle.clues[index]);
      }
    }
  });

  it("כל רמז מנוקד באמת מנוקד", () => {
    for (const riddle of riddles) {
      for (const [index, pointed] of (riddle.cluesNikud ?? []).entries()) {
        expect(pointed === riddle.clues[index], `${riddle.id}[${index}] בלי ניקוד`).toBe(false);
      }
    }
  });

  it("שום רמז מנוקד לא מכיל את התשובה", () => {
    for (const riddle of riddles) {
      const answer = normalize(riddle.answer);
      for (const pointed of riddle.cluesNikud ?? []) {
        expect(normalize(pointed).includes(answer), `${riddle.id}: ${pointed}`).toBe(false);
      }
    }
  });

  it("שום רמז לא מכיל את התשובה עצמה", () => {
    for (const riddle of riddles) {
      const answer = normalize(riddle.answer);
      for (const clue of riddle.clues) {
        expect(normalize(clue).includes(answer), `${riddle.id}: ${clue}`).toBe(false);
      }
    }
  });

  it("לכל חידה צבע וצורה תקינים", () => {
    for (const riddle of riddles) {
      expect(riddle.art.color, `${riddle.id}: ${riddle.art.color}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(riddle.art.shape.length, riddle.id).toBeGreaterThan(2);
      expect(riddle.aisle.length, riddle.id).toBeGreaterThan(2);
    }
  });

  it("אין שתי חידות עם אותה תשובה", () => {
    const seen = new Map<string, string>();
    for (const riddle of riddles) {
      const key = normalize(riddle.answer);
      const previous = seen.get(key);
      expect(previous, `${riddle.id} מתנגש עם ${previous}`).toBeUndefined();
      seen.set(key, riddle.id);
    }
  });
});

describe("סלחנות על פני כל הבנק", () => {
  it("כל שגיאות הכתיב הנפוצות מתקבלות", () => {
    const rejected: string[] = [];
    for (const riddle of riddles) {
      const target = targetById.get(riddle.id)!;
      for (const typo of commonTypos(riddle.answer)) {
        const result = checkAnswer({ guess: typo, target, others: allTargets });
        if (result.status !== "correct") {
          rejected.push(`${riddle.answer} → ${typo} (${result.reason})`);
        }
      }
    }
    expect(rejected).toEqual([]);
  });

  it("תשובה של פריט אחד לא מתקבלת בחידה של פריט אחר", () => {
    // מדגם קבוע — הבדיקה המלאה על כל הבנק היא npm run report:collisions
    const sample = riddles.filter((_, index) => index % 7 === 0);
    const leaks: string[] = [];
    for (const source of sample) {
      for (const other of sample) {
        if (other.id === source.id) continue;
        const result = checkAnswer({
          guess: source.answer,
          target: targetById.get(other.id)!,
          others: allTargets,
        });
        if (result.status === "correct") {
          leaks.push(`"${source.answer}" התקבל בחידה של ${other.answer}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  }, 30_000);
});
