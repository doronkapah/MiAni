/**
 * ניחוש שגוי שהוא בכל זאת הגיוני.
 *
 * לרמז "אני עגול ואדום, וגדלתי על עץ" התשובה "דובדבן" נכונה לגמרי —
 * היא פשוט לא החידה הזאת. ילד שקיבל על זה "לא הפעם" לומד שהחשיבה
 * שלו לא נחשבת, וזה בדיוק ההפך ממה שהמשחק מנסה לעשות.
 *
 * לכן, לפני שמכריזים על ניחוש כשגוי, בודקים שלושה דברים:
 *
 *   1. הניחוש הוא תשובה של חידה אחרת בבנק — אז הוא בוודאי דבר אמיתי,
 *      ואם הוא מאותו מקום גם ברור למה הוא עלה בדעת.
 *   2. הניחוש מופיע ב-alsoFits של החידה — רשימה שנכתבת ביד, בלי AI,
 *      של הניחושים ההגיוניים הצפויים.
 *   3. אחרת — ניחוש רגיל.
 *
 * בשני המקרים הראשונים המשחק מודה שהוא הגיוני, ומציע רמז שיבדיל.
 */

import { riddles } from "./bank";
import { checkAnswer, normalize, toTarget, variants } from "./matcher";
import type { Riddle } from "./types";

export interface Plausible {
  /** מה שהילד כתב, כפי שנציג לו בחזרה */
  guess: string;
  /** למה זה עלה בדעת: משהו שהשניים חולקים, אם יש */
  shared?: string;
  /** התשובה של החידה האחרת, כשהניחוש הוא פריט מהבנק */
  otherId?: string;
}

/** האם הניחוש הוא בעצם התשובה של חידה אחרת */
function bankItem(guess: string, targetId: string): Riddle | null {
  const forms = new Set(variants(guess, { splitWords: false }));
  if (!forms.size) return null;

  for (const riddle of riddles) {
    if (riddle.id === targetId) continue;
    const target = toTarget(riddle.id, riddle.answer, riddle.aliases ?? []);
    // התאמה מדויקת בלבד: ניחוש *קרוב* לפריט אחר הוא לא בהכרח אותו פריט
    if (target.forms.some((form) => forms.has(form))) return riddle;
  }
  return null;
}

/** האם הניחוש נמצא ברשימת החלופות הצפויות של החידה */
function expected(guess: string, riddle: Riddle): boolean {
  const normalized = normalize(guess);
  if (!normalized) return false;

  return (riddle.alsoFits ?? []).some((option) => {
    if (normalize(option) === normalized) return true;
    // סלחנות לשגיאות כתיב גם כאן, אחרת "דובדבן" ו"דובדבן" לא ייפגשו
    const target = toTarget(`fits:${option}`, option, []);
    return checkAnswer({ guess, target }).status === "correct";
  });
}

/**
 * מה משותף לשתי החידות — המשפט שמסביר למה הניחוש עלה בדעת.
 * המקום הוא הקטגוריה הטבעית: "פירות וירקות", "נבלים", "ירחים".
 */
function sharedGround(riddle: Riddle, other: Riddle): string | undefined {
  if (other.world === riddle.world && other.aisle === riddle.aisle) return riddle.aisle;
  return undefined;
}

/**
 * בודקת אם הניחוש ראוי להכרה.
 *
 * `riddle` היא החידה הפעילה, ו-`guess` מה שנכתב.
 */
export function plausibleGuess(guess: string, riddle: Riddle): Plausible | null {
  const trimmed = guess.trim();
  if (!trimmed) return null;

  const other = bankItem(trimmed, riddle.id);
  if (other) {
    return { guess: trimmed, shared: sharedGround(riddle, other), otherId: other.id };
  }

  if (expected(trimmed, riddle)) return { guess: trimmed };
  return null;
}
