import { describe, expect, it } from "vitest";
import { checkRiddle, screen } from "./riddle-rules";
import { riddles } from "../shared/bank";
import type { Riddle } from "../shared/types";

/** מועמדת תקינה, שממנה גוזרים את כל המקרים השבורים */
function candidate(overrides: Partial<Riddle> = {}): Riddle {
  return {
    id: "testfruit",
    world: "market",
    level: 2,
    aisle: "פירות וירקות",
    answer: "אפרסמון",
    answerNikud: "אֲפַרְסְמוֹן",
    aliases: [],
    clues: [
      "אני כתום, עגול, ורך כשאני בשל.",
      "אני מבשיל דווקא בסתיו, כשכל השאר נגמרו.",
    ],
    cluesNikud: [
      "אֲנִי כָּתוֹם, עָגוֹל, וְרַךְ כְּשֶׁאֲנִי בָּשֵׁל.",
      "אֲנִי מַבְשִׁיל דַּווְקָא בַּסְּתָיו, כְּשֶׁכָּל הַשְּׁאָר נִגְמְרוּ.",
    ],
    reveal: "הזן הנפוץ בישראל פותח בעמק החולה, ונקרא על שם השרון.",
    art: { shape: "roundFruit", color: "#E8842A" },
    ...overrides,
  } as Riddle;
}

/** בלי ההצלבה מול כל הבנק — לכללים שלא נוגעים בהבחנה */
const fast = (riddle: Riddle) => checkRiddle(riddle, [], { crossCheck: false });

describe("כללי החידה", () => {
  it("מועמדת תקינה עוברת", () => {
    expect(checkRiddle(candidate())).toEqual([]);
  }, 30_000);

  it("הבנק הקיים כולו עובר את הכללים", () => {
    // בלי הצלבה מול כל הבנק — את זה עושה report:collisions
    for (const riddle of riddles) {
      const problems = checkRiddle(riddle, [], { crossCheck: false }).filter(
        (problem) => !(problem.rule === "id" && problem.detail.includes("כבר קיים")),
      );
      expect(problems, `${riddle.id}: ${problems.map((p) => p.detail).join(", ")}`).toEqual([]);
    }
  }, 30_000);

  it("תופסת רמז שמכיל את התשובה", () => {
    const broken = candidate({
      clues: ["אפרסמון גדל על עץ.", "אני כתום ורך."],
      cluesNikud: ["אֲפַרְסְמוֹן גָּדֵל עַל עֵץ.", "אֲנִי כָּתוֹם וְרַךְ."],
    });
    expect(fast(broken).some((p) => p.rule === "דליפה")).toBe(true);
  });

  it("תופסת שלט שמכיל את התשובה", () => {
    // "מאפייה" הוא שם מעבר בסופר — תשובה בשם הזה תדלוף דרך השלט
    const broken = candidate({
      answer: "מאפייה",
      answerNikud: "מַאֲפִייָה",
      aisle: "מאפייה",
    });
    expect(
      fast(broken).some((p) => p.rule === "דליפה" && p.detail.includes("שלט")),
    ).toBe(true);
  });

  it("תופסת התנגשות עם תשובה קיימת בבנק", () => {
    const broken = candidate({ answer: "לחם", answerNikud: "לֶחֶם", aisle: "מאפייה" });
    expect(checkRiddle(broken).some((p) => p.rule === "הבחנה")).toBe(true);
  });

  it("תופסת כתיב חסר ברמז המנוקד", () => {
    const broken = candidate({
      clues: ["אני כתם, עגל, ורך כשאני בשל.", "אני מבשיל בסתיו."],
      cluesNikud: [
        "אֲנִי כָּתֹם, עָגֹל, וְרַךְ כְּשֶׁאֲנִי בָּשֵׁל.",
        "אֲנִי מַבְשִׁיל בַּסְּתָיו.",
      ],
    });
    expect(fast(broken).some((p) => p.rule === "כתיב מלא")).toBe(true);
  });

  it("תופסת קובוץ במקום שורוק", () => {
    const broken = candidate({
      clues: ["כולם אוהבים אותי.", "אני מבשיל בסתיו."],
      cluesNikud: ["כֻּלָּם אוֹהֲבִים אוֹתִי.", "אֲנִי מַבְשִׁיל בַּסְּתָיו."],
    });
    expect(fast(broken).some((p) => p.detail.includes("קובוץ"))).toBe(true);
  });

  it("תופסת מנוקד שלא תואם לרגיל", () => {
    const broken = candidate({
      cluesNikud: ["אֲנִי אָדוֹם לְגַמְרֵי.", "אֲנִי מַבְשִׁיל בַּסְּתָיו."],
    });
    expect(fast(broken).some((p) => p.rule === "cluesNikud")).toBe(true);
  });

  it("תופסת מקום שלא קיים בעולם", () => {
    expect(
      fast(candidate({ aisle: "מחלקת הדגים" })).some((p) => p.rule === "aisle"),
    ).toBe(true);
  });

  it("תופסת רמה שלא קיימת בעולם", () => {
    // האולימפיאדה מתחילה ברמה 2 — אין בה רמה 1
    const broken = candidate({ world: "olympics", level: 1, aisle: "אתלטיקה" });
    expect(fast(broken).some((p) => p.rule === "level")).toBe(true);
  });

  it("תופסת צבע לא תקין", () => {
    expect(
      fast(candidate({ art: { shape: "roundFruit", color: "כתום" } as Riddle["art"] }))
        .some((p) => p.rule === "art"),
    ).toBe(true);
  });

  it("תופסת מזהה שכבר קיים", () => {
    expect(fast(candidate({ id: "banana" })).some((p) => p.rule === "id")).toBe(true);
  });

  it("בודקת מועמדות גם זו מול זו", () => {
    const first = candidate();
    const twin = candidate({ id: "testfruit2" });
    const { accepted, rejected } = screen([first, twin]);
    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  }, 30_000);
});
