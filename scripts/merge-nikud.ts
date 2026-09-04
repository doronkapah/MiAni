/**
 * ממזג את clues-nikud.json לתוך riddles.json.
 *
 * הרמזים ללא ניקוד נגזרים מהגרסה המנוקדת בהסרת סימני הניקוד, כך
 * ששתי הגרסאות תמיד זהות אות באות. הסקריפט מדפיס כל שינוי טקסט
 * לעומת מה שהיה קודם, כדי שאפשר יהיה לעבור עליו לפני שמאשרים.
 *
 * להרצה: npm run merge:nikud        (בדיקה בלבד)
 *         npm run merge:nikud -- --write
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Riddle } from "../shared/types";
import { stripNikud } from "../shared/matcher";

const here = path.dirname(fileURLToPath(import.meta.url));
const RIDDLES = path.join(here, "..", "shared", "data", "riddles.json");
const NIKUD = path.join(here, "..", "shared", "data", "clues-nikud.json");

const riddles: Riddle[] = JSON.parse(fs.readFileSync(RIDDLES, "utf8"));
const nikud: Record<string, string[]> = JSON.parse(fs.readFileSync(NIKUD, "utf8"));

const problems: string[] = [];
const changes: string[] = [];
let vocalized = 0;

for (const riddle of riddles) {
  const pointed = nikud[riddle.id];
  if (!pointed) {
    problems.push(`חסר ניקוד: ${riddle.id}`);
    continue;
  }
  if (pointed.length !== riddle.clues.length) {
    problems.push(
      `${riddle.id}: ${pointed.length} רמזים מנוקדים מול ${riddle.clues.length} רמזים`,
    );
    continue;
  }

  const plain = pointed.map(stripNikud);
  for (const [index, line] of plain.entries()) {
    if (line !== riddle.clues[index]) {
      changes.push(`${riddle.id}[${index}]\n    לפני: ${riddle.clues[index]}\n    אחרי: ${line}`);
    }
    // רמז מנוקד שנשאר בלי ניקוד בכלל הוא כמעט תמיד שכחה
    if (line === pointed[index]) {
      problems.push(`${riddle.id}[${index}]: הרמז לא מנוקד בכלל`);
    }
  }

  riddle.cluesNikud = pointed;
  riddle.clues = plain;
  vocalized += pointed.length;
}

// רמז מנוקד לא יכול להכיל את התשובה
for (const riddle of riddles) {
  const answer = stripNikud(riddle.answer);
  for (const clue of riddle.cluesNikud ?? []) {
    if (stripNikud(clue).includes(answer)) {
      problems.push(`${riddle.id}: רמז מכיל את התשובה — ${clue}`);
    }
  }
}

console.log(`\nרמזים מנוקדים: ${vocalized}`);

if (changes.length) {
  console.log(`\nשינויי נוסח (${changes.length}):`);
  for (const change of changes) console.log("  " + change);
}

if (problems.length) {
  console.log(`\nבעיות (${problems.length}):`);
  for (const problem of problems) console.log("  " + problem);
  process.exit(1);
}

if (process.argv.includes("--write")) {
  fs.writeFileSync(RIDDLES, JSON.stringify(riddles, null, 2) + "\n", "utf8");
  console.log("\nnriddles.json עודכן.");
} else {
  console.log("\nבדיקה בלבד. להחלה: npm run merge:nikud -- --write");
}
