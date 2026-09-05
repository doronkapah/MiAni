/**
 * שיתוף — בהרשאה בלבד.
 *
 * שום דבר כאן לא נשלח מעצמו. כל פונקציה מחזירה טקסט, והמשתמש הוא
 * זה שלוחץ, רואה מה נכתב, ובוחר לאן להעביר. אין קריאת רשת אחת
 * בקובץ הזה.
 */

/** כתובת המשחק, כפי שהיא פתוחה כרגע */
export function gameUrl(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * פותח את חלון השיתוף של המכשיר, ואם אין כזה — את וואטסאפ.
 * מחזיר את מה ששותף, כדי שאפשר יהיה לרשום זאת ביומן.
 */
export async function share(text: string, title = "עגלי — חידות בסופר"): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch {
      // המשתמש ביטל, או שהדפדפן סירב — נופלים לוואטסאפ
    }
  }
  if (typeof window === "undefined") return false;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  return true;
}

/**
 * החידה כפי שהיא נשלחת לחברים.
 * רק הרמזים שכבר נחשפו לילד — התשובה לא מופיעה כאן בשום צורה.
 */
export function riddleMessage(clues: string[], aisleSign: string): string {
  return [
    "🛒 מי אני? עזרו לי לפתור!",
    "",
    ...clues.map((clue, index) => `רמז ${index + 1}: ${clue}`),
    "",
    `המדף: ${aisleSign}`,
    "",
    "מה זה? 🤔",
    gameUrl(),
  ].join("\n");
}

export interface ReportInput {
  solved: number;
  guesses: number;
  accuracy: number;
  activeDays: number;
  reveals: number;
  skips: number;
  players: number;
  byLevel: { level: number; name: string; solved: number }[];
  hardest: { answer: string; wrong: number; reveals: number }[];
  bankSize: number;
}

/**
 * דוח אנונימי לשיפור המשחק.
 *
 * אין כאן שמות, גילאים, מזהים או טקסט שילד הקליד — רק מספרים
 * ושמות של חידות מהבנק. זה הטקסט המלא, וההורה רואה אותו לפני
 * שהוא בוחר לשלוח.
 */
export function statsReport(input: ReportInput): string {
  const lines = [
    "📊 נתוני משחק אנונימיים — עגלי",
    new Date().toLocaleDateString("he-IL"),
    "",
    `חידות שנפתרו: ${input.solved} מתוך ${input.bankSize}`,
    `ניחושים: ${input.guesses} · דיוק ${Math.round(input.accuracy * 100)}%`,
    `ימי משחק: ${input.activeDays} · שחקנים: ${input.players}`,
    `גלה לי: ${input.reveals} · דילוגים: ${input.skips}`,
  ];

  const played = input.byLevel.filter((entry) => entry.solved > 0);
  if (played.length) {
    lines.push("", "לפי רמה:");
    for (const entry of played) lines.push(`  ${entry.name}: ${entry.solved}`);
  }

  if (input.hardest.length) {
    lines.push("", "החידות שהכי הקשו:");
    for (const entry of input.hardest) {
      lines.push(`  ${entry.answer} — ${entry.wrong} שגויים, ${entry.reveals} גילויים`);
    }
  }

  lines.push("", "אין בדוח שמות, גילאים או מזהים.", gameUrl());
  return lines.join("\n");
}
