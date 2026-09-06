/**
 * הסוכן שכותב חידות.
 *
 * רץ בבוקר, מבקש מקלוד כמה חידות לעולם ולרמה שהכי דלים בבנק,
 * מריץ עליהן את כל הכללים, וכותב את מה שעבר ל-drafts.json.
 *
 * **הוא לא נוגע ב-riddles.json.** חידה נכנסת למשחק רק אחרי שאדם
 * קרא אותה ואישר — `npm run riddles:promote`. סוכן שמפרסם לבד
 * הוא סוכן שיום אחד יפרסם שטות, ומשחק לילדים הוא לא המקום לגלות
 * את זה בדיעבד.
 *
 *   npm run riddles:write                 # העולם והרמה הדלים ביותר
 *   npm run riddles:write -- disney 3     # עולם ורמה מפורשים
 *   npm run riddles:write -- --count 6
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { config } from "dotenv";
import { riddles } from "../shared/bank";
import { WORLDS } from "../shared/worlds";
import { screen, worldBrief, type Problem } from "./riddle-rules";
import type { Riddle } from "../shared/types";

config();

const DRAFTS = new URL("../shared/data/drafts.json", import.meta.url);
const MODEL = process.env.RIDDLE_MODEL ?? "claude-opus-5";

interface Draft extends Riddle {
  /** נכתב בבוקר הזה */
  draftedAt: string;
  /** אדם קרא ואישר. רק אז promote יכניס אותה למשחק. */
  approved: boolean;
}

/** העולם והרמה שהכי צריכים חידות — הכי מעט חידות ביחס לאחרים */
function thinnest(): { world: string; level: number } {
  let best = { world: WORLDS[0]!.id as string, level: WORLDS[0]!.levels[0]!, count: Infinity };
  for (const world of WORLDS) {
    for (const level of world.levels) {
      const count = riddles.filter(
        (riddle) => riddle.world === world.id && riddle.level === level,
      ).length;
      if (count < best.count) best = { world: world.id, level, count };
    }
  }
  return { world: best.world, level: best.level };
}

function buildPrompt(worldId: string, level: number, count: number): string {
  const brief = worldBrief(worldId);
  const examples = riddles
    .filter((riddle) => riddle.world === worldId && riddle.level === level)
    .slice(0, 3);
  const fallback = riddles.filter((riddle) => riddle.world === worldId).slice(0, 3);

  return `אתה כותב חידות "מי אני" בעברית למשחק ילדים בשם עגלי.

## המשימה
כתוב ${count} חידות חדשות לעולם "${brief.world.fullName}", ברמה ${level}.

## העולם
${brief.world.tagline}
המקומות שאפשר לשבץ בהם (השדה aisle) — בדיוק אחד מהם, מילה במילה:
${brief.places.map((place) => `  - ${place}`).join("\n")}

הצורות שאפשר לבחור בהן (השדה art.shape) — בדיוק אחת מהן:
${brief.shapes.join(", ")}

## תשובות שכבר קיימות בעולם הזה — אל תחזור עליהן, ואל תבחר משהו שנשמע דומה
${brief.answers.join(" · ")}

## הרמה
רמה 1: שני רמזים, אוצר מילים של גיל 4–5, הכול קונקרטי (צבע, טעם, מה עושים עם זה).
רמה 2: שלושה רמזים, שיוך לקטגוריה ותכונה אחת שדורשת מחשבה.
רמה 3: שלושה רמזים, תפקיד ותהליך, ורמז שלילה אחד.
רמה 4: שלושה רמזים, דו־משמעות ומקור המילה. הרמז הראשון מטעה בכוונה.
רמה 5: ארבעה רמזים, ידע של מי שמתעניין בתחום. בלי ניקוד.
רמה 6: ארבעה רמזים, ידע של מבוגר בקיא. בלי ניקוד.

## חוקים שאסור להפר
1. **הרמז לא מכיל את התשובה**, בשום צורה ובשום הטיה.
2. **התשובה לא דומה לאף תשובה קיימת בבנק.** מנוע ההתאמה סלחני לשגיאות
   כתיב, ולכן "אתונה" ו"טונה" מתנגשות. בחר משהו רחוק.
3. **התשובה לא מופיעה בשם המקום** שבו שיבצת אותה.
4. ברמות 1–4 חובה \`cluesNikud\` — אותם רמזים בדיוק, עם ניקוד.
   הפשטת הניקוד מ-\`cluesNikud\` חייבת להחזיר את \`clues\` **אות באות**.
   ברמות 5–6 אל תכלול \`cluesNikud\` בכלל.
5. **כתיב מלא, עם ניקוד מעליו.** זה החוק שהכי קל להיכשל בו: הגרסה
   בלי הניקוד היא מה שרוב השחקנים רואים. כתוב "אוֹזְנַיִים" ולא "אָזְנַיִם",
   "כּוּלָּם" ולא "כֻּלָּם", "צָהוֹב" ולא "צָהֹב", "סִיפּוּר" ולא "סִפּוּר".
   בלי קובוץ ובלי חולם חסר.
6. \`answerNikud\` היא התשובה עם ניקוד, אותן אותיות בדיוק.
7. \`reveal\` הוא משפט אחד אחרי הפתרון — עובדה מפתיעה, לא חזרה על הרמז.
8. \`id\` באנגלית קטנה, בלי רווחים, ייחודי.
9. עברית תקנית. פנייה בגוף ראשון ("אני..."), כי זו חידת "מי אני".

## דוגמאות מהבנק
${JSON.stringify(examples.length ? examples : fallback, null, 2)}

## הפלט
JSON בלבד — מערך של ${count} אובייקטים, בלי טקסט לפניו או אחריו,
בלי גדרות קוד. השדה world חייב להיות "${worldId}" והשדה level חייב להיות ${level}.`;
}

function parseRiddles(text: string): Riddle[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) throw new Error("המודל לא החזיר מערך JSON");
  const parsed: unknown = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("הפלט אינו מערך");
  return parsed as Riddle[];
}

function report(rejected: { riddle: Riddle; problems: Problem[] }[]) {
  for (const { riddle, problems } of rejected) {
    console.log(`\n  ✗ ${riddle.answer ?? riddle.id}`);
    for (const problem of problems) console.log(`      ${problem.rule}: ${problem.detail}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const countFlag = args.indexOf("--count");
  const count = countFlag >= 0 ? Number(args[countFlag + 1]) : 5;
  const positional = args.filter((arg) => !arg.startsWith("--") && Number(arg) !== count);

  const target = positional.length
    ? { world: positional[0]!, level: Number(positional[1] ?? 1) }
    : thinnest();

  if (!WORLDS.some((world) => world.id === target.world)) {
    console.error(`עולם לא מוכר: ${target.world}`);
    process.exit(1);
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error("חסר ANTHROPIC_API_KEY. הוסיפו אותו ל-.env או לסביבה.");
    process.exit(1);
  }

  console.log(`\nכותב ${count} חידות ל"${target.world}", רמה ${target.level}…`);

  const client = new Anthropic({ apiKey: key });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: buildPrompt(target.world, target.level, count) }],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  const candidates = parseRiddles(text).map((riddle) => ({
    ...riddle,
    world: target.world,
    level: target.level,
  }));

  const { accepted, rejected } = screen(candidates);

  console.log(`\nהתקבלו ${accepted.length} מתוך ${candidates.length}.`);
  if (rejected.length) {
    console.log("\nנפסלו:");
    report(rejected);
  }

  if (!accepted.length) {
    console.log("\nאין מה לשמור.");
    return;
  }

  const existing: Draft[] = existsSync(DRAFTS)
    ? JSON.parse(readFileSync(DRAFTS, "utf8"))
    : [];
  const draftedAt = new Date().toISOString().slice(0, 10);
  const drafts: Draft[] = [
    ...existing,
    ...accepted.map((riddle) => ({ ...riddle, draftedAt, approved: false })),
  ];

  writeFileSync(DRAFTS, `${JSON.stringify(drafts, null, 2)}\n`, "utf8");

  console.log(`\nנשמרו ל-shared/data/drafts.json. סה"כ ממתינות: ${drafts.length}.`);
  console.log("קראו אותן, סמנו approved: true למה שאהבתם, והריצו:");
  console.log("  npm run riddles:promote");
  for (const riddle of accepted) {
    console.log(`\n  ✓ ${riddle.answer}  (${riddle.aisle})`);
    for (const clue of riddle.clues) console.log(`      ${clue}`);
    console.log(`      ← ${riddle.reveal}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
