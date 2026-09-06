/**
 * דוח התנגשויות: בודק שתשובה של פריט אחד — ושגיאות הכתיב שלה —
 * לא מתקבלת בחידה של פריט אחר. להרצה: npm run report:collisions
 *
 * זו הבדיקה שצריך להריץ אחרי כל הוספה של חידה לבנק. היא איטית
 * (כל ניחוש מושווה לכל הבנק), ולכן היא סקריפט ולא בדיקה רגילה.
 */

import { allTargets, riddles } from "../shared/bank";
import { checkAgainstAll, thresholdsFor, weightedDistance } from "../shared/matcher";
import { commonTypos } from "./typo-report";

const leaks: string[] = [];
let checks = 0;

/*
 * כל ניחוש נבדק מול כל הבנק בבת אחת.
 *
 * `checkAnswer` סורק את כל היריבות מחדש עבור כל יעד, וכאן היעדים
 * הם כל הבנק — כלומר אותה סריקה חוזרת מאתיים ושלושים פעם על אותו
 * ניחוש. `checkAgainstAll` עושה אותה פעם אחת, ומגיע לאותן הכרעות
 * בדיוק (יש על זה בדיקה ב-matcher.test.ts).
 */
for (const source of riddles) {
  for (const guess of [source.answer, ...commonTypos(source.answer)]) {
    const results = checkAgainstAll(guess, allTargets);
    for (const other of riddles) {
      if (other.id === source.id) continue;
      checks += 1;
      if (results.get(other.id)?.status === "correct") {
        leaks.push(`"${guess}" (${source.answer}) התקבל בחידה של ${other.answer}`);
      }
    }
  }
}

// זוגות תשובות שקרובות מספיק כדי להסתמך על כלל ההבחנה
const close: string[] = [];
for (let i = 0; i < riddles.length; i++) {
  for (let j = i + 1; j < riddles.length; j++) {
    const a = riddles[i]!;
    const b = riddles[j]!;
    const distance = weightedDistance(a.answer, b.answer);
    if (distance <= thresholdsFor(Math.max(a.answer.length, b.answer.length)).close) {
      close.push(`${a.answer} ↔ ${b.answer}  (${distance.toFixed(2)})`);
    }
  }
}

console.log(`\nנבדקו ${checks} ניחושים מוצלבים.`);
console.log(`דליפות: ${leaks.length}`);
for (const leak of leaks) console.log("  " + leak);

console.log(`\nזוגות תשובות קרובות (מסתמכים עליהן על כלל ההבחנה): ${close.length}`);
for (const pair of close) console.log("  " + pair);

process.exit(leaks.length ? 1 : 0);
