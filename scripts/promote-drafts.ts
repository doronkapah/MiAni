/**
 * העברת טיוטות שאושרו לבנק.
 *
 * זה השלב היחיד שנוגע ב-riddles.json, והוא דורש שאדם סימן
 * `"approved": true` על כל חידה. אין דגל שעוקף את זה.
 *
 *   npm run riddles:promote            # בדיקה בלבד — מה ייכנס
 *   npm run riddles:promote -- --write # מחיל
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { screen } from "./riddle-rules";
import type { Riddle } from "../shared/types";

const DRAFTS = new URL("../shared/data/drafts.json", import.meta.url);
const BANK = new URL("../shared/data/riddles.json", import.meta.url);
const NIKUD = new URL("../shared/data/clues-nikud.json", import.meta.url);

interface Draft extends Riddle {
  draftedAt: string;
  approved: boolean;
}

function main() {
  const write = process.argv.includes("--write");

  if (!existsSync(DRAFTS)) {
    console.log("אין טיוטות.");
    return;
  }

  const drafts: Draft[] = JSON.parse(readFileSync(DRAFTS, "utf8"));
  const ready = drafts.filter((draft) => draft.approved);
  const waiting = drafts.filter((draft) => !draft.approved);

  if (!ready.length) {
    console.log(`אין טיוטות מאושרות. ${waiting.length} ממתינות לקריאה.`);
    return;
  }

  // הבנק השתנה מאז שהטיוטה נכתבה — בודקים שוב, מהתחלה
  const clean = ready.map(({ draftedAt: _draftedAt, approved: _approved, ...riddle }) => riddle);
  const { accepted, rejected } = screen(clean as Riddle[]);

  if (rejected.length) {
    console.log(`\n${rejected.length} טיוטות מאושרות כבר לא עוברות את הכללים:`);
    for (const { riddle, problems } of rejected) {
      console.log(`\n  ✗ ${riddle.answer}`);
      for (const problem of problems) console.log(`      ${problem.rule}: ${problem.detail}`);
    }
  }

  console.log(`\n${accepted.length} חידות ייכנסו לבנק:`);
  for (const riddle of accepted) console.log(`  + ${riddle.answer} (${riddle.world}, רמה ${riddle.level})`);

  if (!write) {
    console.log("\nבדיקה בלבד. להחלה: npm run riddles:promote -- --write");
    return;
  }
  if (!accepted.length) return;

  const bank: Riddle[] = JSON.parse(readFileSync(BANK, "utf8"));
  writeFileSync(BANK, `${JSON.stringify([...bank, ...accepted], null, 2)}\n`, "utf8");

  // מקור האמת של הניקוד נשמר בנפרד, כדי שאפשר יהיה לתקן ניקוד בלי לגעת בבנק
  const nikud: Record<string, string[]> = JSON.parse(readFileSync(NIKUD, "utf8"));
  for (const riddle of accepted) {
    if (riddle.cluesNikud) nikud[riddle.id] = riddle.cluesNikud;
  }
  writeFileSync(NIKUD, `${JSON.stringify(nikud, null, 2)}\n`, "utf8");

  const left = drafts.filter(
    (draft) => !accepted.some((riddle) => riddle.id === draft.id),
  );
  writeFileSync(DRAFTS, `${JSON.stringify(left, null, 2)}\n`, "utf8");

  console.log(`\nנכנסו לבנק. הריצו עכשיו:\n  npm test\n  npm run report:collisions`);
}

main();
