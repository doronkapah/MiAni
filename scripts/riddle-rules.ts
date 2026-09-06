/**
 * הכללים שחידה חדשה חייבת לעמוד בהם.
 *
 * זה אותו סט כללים שהבדיקות אוכפות על הבנק, אלא שכאן הוא רץ על
 * מועמדת אחת מול הבנק הקיים — כדי שאפשר יהיה לפסול אותה לפני
 * שהיא נכנסת. הסוכן שכותב חידות מריץ את זה על כל מה שהוא מייצר,
 * ומה שלא עובר פשוט לא נשמר.
 *
 * כל כלל כאן נולד מבאג אמיתי:
 *   "מלח" הופיע בתוך הרמז של עצמו.
 *   "טלסקופ" הופיע בשלט של המעבר שלו, והשלט נשלח בהודעת השיתוף.
 *   "אתונה" התקבלה כ"טונה".
 *   הרמזים נכתבו בכתיב חסר, והגרסה בלי ניקוד יצאה "אזנים".
 */

import { allTargets, riddleById, riddles } from "../shared/bank";
import {
  checkAnswer,
  normalize,
  stripNikud,
  toTarget,
  weightedDistance,
} from "../shared/matcher";
import { placesOf } from "../shared/aisles";
import { aisleView } from "../shared/aisles";
import { getWorld, WORLDS } from "../shared/worlds";
import type { Riddle } from "../shared/types";

export interface Problem {
  rule: string;
  detail: string;
}

const HEX = /^#[0-9A-Fa-f]{6}$/;
const NIKUD = /[֑-ׇ]/;
const KUBUTZ = /ֻ/;
const HOLAM = /ֹ/;

/**
 * מילים שבהן חולם חסר הוא הכתיב הנכון.
 * "לא", "ראש" ו"זאת" לא מקבלים וי"ו גם בכתיב מלא.
 */
const HOLAM_OK = new Set(["לא", "ראש", "בראש", "זאת", "כה", "מאד", "איפה"]);

/** האם המילה נכתבה בכתיב מלא — מה שהשחקן יראה כשהניקוד כבוי */
function fullSpellingProblems(pointed: string): string[] {
  const bad: string[] = [];
  for (const word of pointed.split(/\s+/)) {
    const plain = stripNikud(word).replace(/[.,!?"״׳()]/g, "");
    if (!plain) continue;

    if (KUBUTZ.test(word)) {
      bad.push(`${plain} (קובוץ — צריך שורוק)`);
      continue;
    }
    if (!HOLAM.test(word) || HOLAM_OK.has(plain)) continue;

    // חולם שיושב על אות ואחריו לא וי"ו ולא אל"ף הוא חולם חסר
    for (let index = 0; index < word.length; index += 1) {
      if (word[index] !== "ֹ") continue;
      const before = stripNikud(word.slice(0, index)).slice(-1);
      const after = stripNikud(word.slice(index + 1)).slice(0, 1);
      if (before !== "ו" && after !== "א") {
        bad.push(`${plain} (חולם חסר)`);
        break;
      }
    }
  }
  return bad;
}

/**
 * בודקת מועמדת אחת מול הבנק.
 *
 * `against` מאפשר לבדוק גם מועמדות זו מול זו, ולא רק מול מה שכבר
 * בבנק — שתי חידות חדשות שנכתבו באותה נשימה עלולות להתנגש.
 */
export interface CheckOptions {
  /**
   * הצלבה מול כל הבנק — החלק היקר, כשלוש שניות למועמדת.
   * הסוכן מריץ אותו תמיד; בדיקה שעוברת על כל הבנק מוותרת עליו,
   * כי הוא בדיוק מה ש-report:collisions עושה במלואו.
   */
  crossCheck?: boolean;
}

export function checkRiddle(
  candidate: Riddle,
  against: Riddle[] = [],
  { crossCheck = true }: CheckOptions = {},
): Problem[] {
  const problems: Problem[] = [];
  const add = (rule: string, detail: string) => problems.push({ rule, detail });

  // --- מבנה ---
  if (!candidate.id || !/^[a-z][a-z0-9]{2,}$/.test(candidate.id)) {
    add("id", `מזהה חייב להיות אנגלית קטנה, לפחות 3 תווים: "${candidate.id}"`);
  }
  if (riddleById.has(candidate.id) || against.some((other) => other.id === candidate.id)) {
    add("id", `המזהה "${candidate.id}" כבר קיים`);
  }

  const world = WORLDS.find((entry) => entry.id === candidate.world);
  if (!world) {
    add("world", `עולם לא מוכר: "${candidate.world}"`);
    return problems;
  }
  if (!world.levels.includes(candidate.level)) {
    add("level", `רמה ${candidate.level} לא קיימת ב${world.name}`);
  }
  if (!placesOf(world.id).includes(candidate.aisle)) {
    add("aisle", `"${candidate.aisle}" הוא לא מקום ב${world.name}`);
  }
  if (!HEX.test(candidate.art?.color ?? "")) {
    add("art", `צבע לא תקין: "${candidate.art?.color}"`);
  }
  if (!candidate.art?.shape || candidate.art.shape.length < 3) {
    add("art", "חסרה צורה");
  }
  if (!candidate.reveal || candidate.reveal.length < 10) {
    add("reveal", "משפט הפתרון קצר מדי");
  }

  // --- ניקוד וכתיב ---
  const clues = candidate.clues ?? [];
  if (clues.length < 2) add("clues", "צריך לפחות שני רמזים");

  // מותר הפרש של אם קריאה — כתיב מנוקד חסר מול כתיב מלא
  if (
    weightedDistance(
      normalize(candidate.answerNikud ?? ""),
      normalize(candidate.answer ?? ""),
    ) > 0.5
  ) {
    add("answerNikud", "התשובה המנוקדת לא תואמת לתשובה");
  }

  if (candidate.level <= 4) {
    const pointed = candidate.cluesNikud ?? [];
    if (pointed.length !== clues.length) {
      add("cluesNikud", "ברמות 1–4 צריך רמז מנוקד לכל רמז");
    } else {
      pointed.forEach((clue, index) => {
        if (stripNikud(clue) !== clues[index]) {
          add("cluesNikud", `רמז ${index + 1}: המנוקד לא תואם לרגיל, אות באות`);
        }
        if (!NIKUD.test(clue)) {
          add("cluesNikud", `רמז ${index + 1} לא באמת מנוקד`);
        }
        for (const word of fullSpellingProblems(clue)) {
          add("כתיב מלא", `רמז ${index + 1}: ${word}`);
        }
      });
    }
  }

  // --- דליפות ---
  const answer = normalize(candidate.answer ?? "");
  if (!answer) {
    add("answer", "תשובה ריקה או בלי אותיות עבריות");
    return problems;
  }

  for (const [index, clue] of clues.entries()) {
    if (normalize(clue).includes(answer)) {
      add("דליפה", `רמז ${index + 1} מכיל את התשובה`);
    }
  }
  for (const [index, clue] of (candidate.cluesNikud ?? []).entries()) {
    if (normalize(clue).includes(answer)) {
      add("דליפה", `הרמז המנוקד ${index + 1} מכיל את התשובה`);
    }
  }

  /*
   * השלט של המקום נשלח בהודעת השיתוף, ולכן הוא לא יכול להכיל את
   * התשובה של חידה שיושבת בו — גם לא בגרסה המוחלשת של רמה 3.
   */
  for (const level of world.levels) {
    const sign = normalize(aisleView(world.id, candidate.aisle, level).sign);
    if (sign.includes(answer)) {
      add("דליפה", `השלט "${aisleView(world.id, candidate.aisle, level).sign}" מכיל את התשובה`);
      break;
    }
  }

  // --- כלל ההבחנה ---
  const neighbours = [...against.filter((other) => other.id !== candidate.id)];
  const asTarget = (riddle: Riddle) => toTarget(riddle.id, riddle.answer, riddle.aliases ?? []);
  const mine = asTarget(candidate);

  /*
   * רשימת היריבות חייבת להיות בדיוק זו של המשחק אחרי שהחידה
   * תיכנס — כולל החידה עצמה. בלעדיה כל תשובה חדשה נראית
   * כמו דליפה לפריט רחוק שנמצא במקרה בטווח, משום שאין מי שיחלוק עליו.
   */
  const targets = [...allTargets, ...neighbours.map(asTarget)];
  if (!targets.some((target) => target.id === mine.id)) targets.push(mine);

  const self = checkAnswer({ guess: candidate.answer, target: mine, others: targets });
  if (self.status !== "correct") {
    add("הבחנה", `התשובה של עצמה לא מתקבלת (${self.reason ?? self.status})`);
  }
  for (const alias of candidate.aliases ?? []) {
    const result = checkAnswer({ guess: alias, target: mine, others: targets });
    if (result.status !== "correct") {
      add("הבחנה", `הנרדף "${alias}" לא מתקבל (${result.reason ?? result.status})`);
    }
  }

  if (!crossCheck) return problems;

  const bank = [...riddles, ...neighbours];
  for (const other of bank) {
    if (other.id === candidate.id) continue;
    const target = asTarget(other);
    if (checkAnswer({ guess: candidate.answer, target, others: targets }).status === "correct") {
      add("הבחנה", `התשובה מתקבלת גם בחידה של "${other.answer}"`);
    }
    if (checkAnswer({ guess: other.answer, target: mine, others: targets }).status === "correct") {
      add("הבחנה", `"${other.answer}" מתקבל גם כאן`);
    }
  }

  return problems;
}

/** מפרידה מועמדות שעברו ממועמדות שנפסלו */
export function screen(candidates: Riddle[]): {
  accepted: Riddle[];
  rejected: { riddle: Riddle; problems: Problem[] }[];
} {
  const accepted: Riddle[] = [];
  const rejected: { riddle: Riddle; problems: Problem[] }[] = [];

  for (const candidate of candidates) {
    const problems = checkRiddle(candidate, accepted);
    if (problems.length) rejected.push({ riddle: candidate, problems });
    else accepted.push(candidate);
  }

  return { accepted, rejected };
}

/** תיאור קצר של עולם, לפרומפט */
export function worldBrief(worldId: string) {
  const world = getWorld(worldId);
  const inWorld = riddles.filter((riddle) => riddle.world === worldId);
  return {
    world,
    places: placesOf(world.id),
    levels: world.levels,
    answers: inWorld.map((riddle) => riddle.answer),
    shapes: [...new Set(inWorld.map((riddle) => riddle.art.shape))],
    byLevel: Object.fromEntries(
      world.levels.map((level) => [
        level,
        inWorld.filter((riddle) => riddle.level === level).length,
      ]),
    ),
  };
}
