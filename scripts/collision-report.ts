/**
 * דוח התנגשויות: בודק שתשובה של פריט אחד — ושגיאות הכתיב שלה —
 * לא מתקבלת בחידה של פריט אחר. להרצה: npm run report:collisions
 *
 * זו הבדיקה שצריך להריץ אחרי כל הוספה של חידה לבנק. היא איטית
 * (כל ניחוש מושווה לכל הבנק), ולכן היא סקריפט ולא בדיקה רגילה.
 */

import { allTargets, riddles, targetById } from "../shared/bank";
import { checkAnswer, thresholdsFor, weightedDistance } from "../shared/matcher";
import { commonTypos } from "./typo-report";

const leaks: string[] = [];
let checks = 0;

for (const source of riddles) {
  const guesses = [source.answer, ...commonTypos(source.answer)];
  for (const other of riddles) {
    if (other.id === source.id) continue;
    const target = targetById.get(other.id)!;
    for (const guess of guesses) {
      checks += 1;
      const result = checkAnswer({ guess, target, others: allTargets });
      if (result.status === "correct") {
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
