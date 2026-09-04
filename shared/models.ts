/**
 * המודלים שאפשר לבחור בהם לעוזר הסופר.
 *
 * ברירת המחדל היא Claude Opus 5 — הוא הכי טוב בעברית, והכי אמין
 * בשמירה על הסוד גם כשילד מנסה להערים עליו. המעבר למודל זול יותר
 * הוא החלטה של ההורה, לא של המשחק, ולכן היא נמצאת בלוח ההורים.
 *
 * מחירים לפי מיליון טוקנים, נכון ליוני 2026.
 */

export interface ModelOption {
  id: string;
  /** השם כפי שהוא מוצג להורה */
  label: string;
  /** משפט אחד: מה מקבלים ומה מוותרים */
  blurb: string;
  inputPerMTok: number;
  outputPerMTok: number;
  /**
   * האם המודל תומך ב-output_config.effort.
   * ב-Haiku 4.5 הפרמטר הזה מחזיר שגיאה, ולכן לא שולחים אותו.
   */
  supportsEffort: boolean;
  /** יחס עלות משוער לעומת ברירת המחדל, לתצוגה בלבד */
  relativeCost: string;
}

export const MODELS: ModelOption[] = [
  {
    id: "claude-opus-5",
    label: "Claude Opus 5",
    blurb: "העברית הכי טובה, והכי עקבי בשמירה על הסוד. ברירת המחדל.",
    inputPerMTok: 5,
    outputPerMTok: 25,
    supportsEffort: true,
    relativeCost: "המחיר המלא",
  },
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    blurb: "זול בערך ב-60%, ועדיין חזק מאוד בעברית. איזון טוב לשיחה עם ילד.",
    inputPerMTok: 2,
    outputPerMTok: 10,
    supportsEffort: true,
    relativeCost: "כ-40% מהעלות",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    blurb: "הכי זול והכי מהיר. מספיק לשאלות כן/לא, פחות טוב בניסוחים מורכבים.",
    inputPerMTok: 1,
    outputPerMTok: 5,
    supportsEffort: false,
    relativeCost: "כ-20% מהעלות",
  },
];

export const DEFAULT_MODEL = MODELS[0]!.id;

export function findModel(id: string): ModelOption | undefined {
  return MODELS.find((model) => model.id === id);
}

/**
 * מחיר קריאה מהמטמון הוא כעשירית ממחיר קלט רגיל, וכתיבה למטמון
 * יקרה בכ-25%. המספרים האלה הופכים את החישוב להערכה, ולכן הוא
 * מוצג להורה כהערכה ולא כחיוב.
 */
export const CACHE_READ_MULTIPLIER = 0.1;
export const CACHE_WRITE_MULTIPLIER = 1.25;

export interface TokenCounts {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export function estimateCost(model: ModelOption, tokens: TokenCounts): number {
  const input =
    tokens.input +
    tokens.cacheRead * CACHE_READ_MULTIPLIER +
    tokens.cacheWrite * CACHE_WRITE_MULTIPLIER;
  return (input * model.inputPerMTok + tokens.output * model.outputPerMTok) / 1_000_000;
}
