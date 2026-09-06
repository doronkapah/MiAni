/**
 * ניחוש שגוי שהוא בכל זאת הגיוני — ומתי הוא מפסיק להיות כזה.
 *
 * לרמז "אני קר מאוד, וגר במקפיא" התשובה "קרטיב" נכונה לגמרי.
 * אבל ברגע שנחשף "אוכלים אותי בגביע", קרטיב כבר *לא* מתאים —
 * ולהמשיך לומר "הניחוש מתאים לרמזים" זה לא עידוד, זה שקר קטן
 * שהילד יכול לתפוס.
 *
 * לכן לכל חלופה יש שני מצבים:
 *
 *   fits     — עדיין מסתדרת עם כל מה שנחשף. "ניחוש חכם."
 *   ruledOut — רמז מסוים פסל אותה, ואומרים בדיוק איזה ולמה.
 *
 * ההבדל נכתב ביד לכל חלופה, בלי AI. חלופה בלי `ruledOutBy` פשוט
 * מתאימה לאורך כל החידה.
 */

import { riddles } from "./bank";
import { checkAnswer, normalize, toTarget, variants } from "./matcher";
import type { AlsoFits, Riddle } from "./types";

export interface Plausible {
  /** מה שהילד כתב, כפי שנציג לו בחזרה */
  guess: string;
  /** האם הניחוש עדיין מסתדר עם הרמזים שנחשפו */
  status: "fits" | "ruledOut";
  /** למה זה עלה בדעת: משהו שהשניים חולקים, אם יש */
  shared?: string;
  /** ההבדל, כשרמז כבר פסל את הניחוש */
  because?: string;
  /** התשובה של החידה האחרת, כשהניחוש הוא פריט מהבנק */
  otherId?: string;
}

function guessOf(option: AlsoFits): string {
  return typeof option === "string" ? option : option.guess;
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

/** החלופה שנכתבה לחידה הזאת, אם הניחוש הוא אחת מהן */
function matchOption(guess: string, riddle: Riddle): AlsoFits | null {
  const normalized = normalize(guess);
  if (!normalized) return null;

  for (const option of riddle.alsoFits ?? []) {
    const text = guessOf(option);
    if (normalize(text) === normalized) return option;

    // סלחנות לשגיאות כתיב גם כאן, אחרת "דובדבן" ו"דודבן" לא ייפגשו
    const target = toTarget(`fits:${text}`, text, []);
    if (checkAnswer({ guess, target }).status === "correct") return option;
  }
  return null;
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
 * בודקת אם הניחוש ראוי להכרה, ואם הוא עדיין תקף.
 *
 * `cluesRevealed` הוא כמה רמזים כבר על המסך. חלופה שנפסלת ברמז 2
 * עדיין תקפה כשרק רמז אחד נחשף.
 */
export function plausibleGuess(
  guess: string,
  riddle: Riddle,
  cluesRevealed = 1,
): Plausible | null {
  const trimmed = guess.trim();
  if (!trimmed) return null;

  const option = matchOption(trimmed, riddle);
  const other = bankItem(trimmed, riddle.id);
  if (!option && !other) return null;

  const base: Plausible = {
    guess: trimmed,
    status: "fits",
    shared: other ? sharedGround(riddle, other) : undefined,
    otherId: other?.id,
  };

  if (option && typeof option !== "string" && cluesRevealed >= option.ruledOutBy) {
    return { ...base, status: "ruledOut", because: option.because };
  }
  return base;
}

/** הרמז שפוסל את הניחוש, אם עוד לא נחשף */
export function rulingClue(guess: string, riddle: Riddle): number | null {
  const option = matchOption(guess.trim(), riddle);
  if (!option || typeof option === "string") return null;
  return option.ruledOutBy;
}

/** כל הניחושים שברשימה, כטקסט — לבדיקות ולכלי האיכות */
export function fitsList(riddle: Riddle): string[] {
  return (riddle.alsoFits ?? []).map(guessOf);
}
