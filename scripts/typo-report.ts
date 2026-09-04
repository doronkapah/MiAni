/**
 * דוח סלחנות: מייצר לכל תשובה בבנק את שגיאות הכתיב שילדים באמת עושים,
 * ובודק כמה מהן מתקבלות. להרצה: npm run report:typos
 *
 * ניחוש שנדחה בגלל שהוא זהה לפריט אחר בבנק הוא התנהגות נכונה,
 * ולכן הדוח מפריד בין דחייה כזאת לבין דחייה סתם.
 */

import { allTargets, riddles, targetById } from "../shared/bank";
import { checkAnswer } from "../shared/matcher";

const SWAPS: [string, string][] = [
  ["ט", "ת"], ["ת", "ט"], ["כ", "ק"], ["ק", "כ"],
  ["א", "ע"], ["ע", "א"], ["ס", "ש"], ["ב", "ו"], ["ח", "כ"],
];

/** שגיאות הכתיב הנפוצות: חילוף פונטי, אם קריאה חסרה או מיותרת */
export function commonTypos(answer: string): string[] {
  const out = new Set<string>();
  for (const [from, to] of SWAPS) {
    if (answer.includes(from)) out.add(answer.replace(from, to));
  }
  if (answer.endsWith("ה")) out.add(`${answer.slice(0, -1)}א`);
  if (answer.includes("י")) out.add(answer.replace("י", ""));
  if (answer.includes("ו")) out.add(answer.replace("ו", ""));
  out.add(`${answer[0]}א${answer.slice(1)}`);
  out.delete(answer);
  return [...out];
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "")) {
  let total = 0;
  let accepted = 0;
  const rejectedAsOther: string[] = [];
  const rejectedPlain: string[] = [];

  for (const riddle of riddles) {
    const target = targetById.get(riddle.id)!;
    for (const typo of commonTypos(riddle.answer)) {
      total += 1;
      const result = checkAnswer({ guess: typo, target, others: allTargets });
      if (result.status === "correct") {
        accepted += 1;
      } else {
        const line = `${riddle.answer} → ${typo}  (${result.status}/${result.reason}, ${result.distance.toFixed(2)})`;
        if (result.reason === "ambiguous") rejectedAsOther.push(line);
        else rejectedPlain.push(line);
      }
    }
  }

  const pct = ((accepted / total) * 100).toFixed(1);
  console.log(`\nמתקבלות: ${accepted}/${total}  (${pct}%)`);
  console.log(`נדחו כי הן פריט אחר בבנק: ${rejectedAsOther.length}  — התנהגות נכונה`);
  console.log(`נדחו סתם: ${rejectedPlain.length}\n`);

  if (rejectedPlain.length) {
    console.log("נדחו סתם:");
    for (const line of rejectedPlain) console.log("  " + line);
  }
  if (rejectedAsOther.length) {
    console.log("\nנדחו כפריט אחר:");
    for (const line of rejectedAsOther) console.log("  " + line);
  }
}
