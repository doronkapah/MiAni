/**
 * מסנן הפלט של עוזר הסופר.
 *
 * עגלי יודע את התשובה, ואסור לו לומר אותה. ההוראה בפרומפט היא השכבה
 * השנייה; זו השלישית. כל קטע שמגיע מהמודל עובר כאן לפני שהוא נשלח
 * לדפדפן, והמילה עלולה להתפצל בין שני קטעים — ולכן מחזיקים חוצץ.
 */

import { normalize } from "./matcher";

/**
 * אורך החוצץ בתווים. גדול מכל תשובה בבנק, כך שתשובה שנחתכת
 * בין שני קטעים עדיין נמצאת שלמה בחוצץ כשבודקים אותו.
 */
const BUFFER = 24;

/**
 * מתחת לאורך הזה לא בודקים הכלה חופשית, רק מילים שלמות.
 * "תה" הוא תשובה חוקית, ואם היינו חוסמים אותו כתת-מחרוזת,
 * כל הודעה שמכילה "אתה" או "שותה" הייתה נקטעת.
 */
const MIN_SUBSTRING_LENGTH = 3;

/** הסרת כל מה שאינו אות עברית, כדי לתפוס גם "פ-ס-ט-ה" ו"פ ס ט ה" */
function compact(text: string): string {
  return normalize(text).replace(/\s+/g, "");
}

function words(text: string): string[] {
  const clean = normalize(text);
  return clean ? clean.split(" ") : [];
}

function containsSequence(haystack: string[], needle: string[]): boolean {
  if (!needle.length || needle.length > haystack.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    if (needle.every((w, j) => haystack[i + j] === w)) return true;
  }
  return false;
}

export class AnswerRedactor {
  private pending = "";
  /** התשובות כרצף מילים — מותאמות כמילים שלמות בלבד */
  private wordSecrets: string[][];
  /** התשובות הארוכות, דחוסות — מותאמות גם כתת-מחרוזת */
  private compactSecrets: string[];
  /** האם התשובה כמעט נאמרה, ולכן הזרם נקטע */
  tripped = false;

  constructor(secrets: string[]) {
    const seen = new Set<string>();
    this.wordSecrets = [];
    this.compactSecrets = [];

    for (const secret of secrets) {
      const parts = words(secret);
      if (!parts.length) continue;
      const key = parts.join(" ");
      if (seen.has(key)) continue;
      seen.add(key);

      this.wordSecrets.push(parts);
      const dense = compact(secret);
      if (dense.length >= MIN_SUBSTRING_LENGTH) this.compactSecrets.push(dense);
    }
  }

  /**
   * מקבל קטע חדש ומחזיר את הטקסט שבטוח לשלוח, או מחרוזת ריקה
   * אם עוד לא הצטבר מספיק. אחרי שהזרם נקטע, לא נשלח שום דבר.
   */
  push(chunk: string): string {
    if (this.tripped) return "";
    this.pending += chunk;

    if (this.leaks(this.pending)) {
      this.tripped = true;
      this.pending = "";
      return "";
    }

    if (this.pending.length <= BUFFER) return "";
    const safe = this.pending.slice(0, this.pending.length - BUFFER);
    this.pending = this.pending.slice(-BUFFER);
    return safe;
  }

  /** בסוף הזרם — מוציא את מה שנשאר בחוצץ */
  flush(): string {
    if (this.tripped) return "";
    const rest = this.pending;
    this.pending = "";
    return rest;
  }

  private leaks(text: string): boolean {
    const asWords = words(text);
    if (this.wordSecrets.some((secret) => containsSequence(asWords, secret))) return true;

    const dense = compact(text);
    return this.compactSecrets.some((secret) => dense.includes(secret));
  }
}

/** מה שעגלי אומר במקום התשובה, כשהוא כמעט מסגיר אותה */
export const REDACTED_REPLY = "אופס, כמעט אמרתי! זה סוד. תנסו לנחש בעצמכם 😄";
