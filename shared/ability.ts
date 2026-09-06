/**
 * יכולת השחקן — נפרדת מהגיל.
 *
 * גיל הוא ניחוש גס לשלושה דברים שונים: כמה ידע יש, כמה טוב קוראים,
 * וכמה נוח להקליד. המשחק שאל רק "בן כמה?" והסיק מזה את כל השלושה,
 * ולכן ילד בן שש שיודע הכול על כוכבי לכת קיבל חידות של בן שש, וילד
 * בן עשר שמקליד באצבע אחת ויתר באמצע.
 *
 * הידע נשאר בדירוג לכל עולם. כאן יושבים רק שני האחרים.
 */

import type { Answering, Profile, Reading } from "./types";

/** ברירת מחדל לפי גיל, לפרופילים שנוצרו לפני שהיה מה לשאול */
export function defaultReading(age: number): Reading {
  if (age <= 5) return "notYet";
  if (age <= 7) return "learning";
  return "fluent";
}

export function readingOf(profile: Profile): Reading {
  return profile.reading ?? defaultReading(profile.age);
}

export function answeringOf(profile: Profile): Answering {
  return profile.answering ?? (profile.age <= 5 ? "pictures" : "typing");
}

/** האם להקריא את הרמז מיד כשהוא מופיע */
export function autoReads(profile: Profile): boolean {
  return readingOf(profile) === "notYet";
}

/** האם הניקוד דלוק כברירת מחדל */
export function wantsNikud(profile: Profile): boolean {
  return readingOf(profile) !== "fluent";
}

export const READING_LABELS: Record<Reading, { title: string; note: string }> = {
  notYet: { title: "עדיין לא", note: "אקריא את הרמזים בקול" },
  learning: { title: "לומד/ת", note: "ניקוד דלוק, והקראה בלחיצה" },
  fluent: { title: "קורא/ת שוטף", note: "בלי ניקוד ובלי הקראה" },
};

export const ANSWERING_LABELS: Record<Answering, { title: string; note: string }> = {
  typing: { title: "בהקלדה", note: "כותבים את התשובה" },
  pictures: { title: "בבחירה", note: "בוחרים מתוך ארבע תמונות" },
};
