/**
 * התאמת תשובות בעברית, סלחנית לשגיאות כתיב של ילדים.
 *
 * החידות עצמן כתובות בעברית תקנית — הסלחנות כאן היא רק בצד של מה שהילד מקליד.
 *
 * הרעיון: מרחק עריכה (Damerau–Levenshtein) שבו הטעויות שילדים באמת עושים
 * עולות פחות מטעות אקראית. חילוף ט/ת עולה 0.25, אם קריאה מיותרת 0.25,
 * אות שכנה במקלדת 0.5, וכל שאר השינויים 1.0.
 *
 * בנוסף למרחק יש כלל הבחנה: תשובה מתקבלת רק אם היא קרובה לחידה הנוכחית
 * *יותר* מאשר לכל פריט אחר בבנק. בלי הכלל הזה "חלה" הייתה מתקבלת כ"חלב".
 */

// ---------------------------------------------------------------- נרמול

const NIQQUD_AND_CANTILLATION = /[֑-ׇ]/g;
const QUOTE_MARKS = /[׳״'"`‘’“”]/g;
const HEBREW_LETTER = /[א-ת]/;

const FINAL_FORMS: Record<string, string> = {
  "ך": "כ", // ך → כ
  "ם": "מ", // ם → מ
  "ן": "נ", // ן → נ
  "ף": "פ", // ף → פ
  "ץ": "צ", // ץ → צ
};

/** מילות פתיחה שילדים מוסיפים לפני התשובה */
const FILLER_WORDS = new Set([
  "אני", "חושב", "חושבת", "יודע", "יודעת", "בטוח", "בטוחה",
  "נראה", "לי", "אולי", "כנראה", "בטח", "התשובה", "המילה",
  "זה", "זאת", "זו", "הוא", "היא", "את", "האם",
  "שזה", "שזאת", "שזו", "שהתשובה", "ש",
]);

/** מסיר סימני ניקוד וטעמים בלבד; האותיות והפיסוק נשארים */
export function stripNikud(text: string): string {
  return text.normalize("NFC").replace(NIQQUD_AND_CANTILLATION, "");
}

/**
 * מנקה ניקוד, פיסוק ותווים זרים, ומאחד אותיות סופיות.
 * מחזיר מחרוזת של אותיות עבריות ורווחים בודדים בלבד.
 */
export function normalize(input: string): string {
  let s = input.normalize("NFC");
  s = s.replace(NIQQUD_AND_CANTILLATION, "");
  s = s.replace(QUOTE_MARKS, "");

  let out = "";
  for (const ch of s) {
    if (HEBREW_LETTER.test(ch)) out += FINAL_FORMS[ch] ?? ch;
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

/** מסיר מילות פתיחה מיותרות מתחילת הניחוש */
function stripFiller(s: string): string {
  const words = s.split(" ");
  let i = 0;
  while (i < words.length - 1 && FILLER_WORDS.has(words[i]!)) i++;
  return words.slice(i).join(" ");
}

/** מסיר ה' הידיעה, אבל רק כשנשארת מילה בעלת אורך סביר */
function stripDefiniteArticle(s: string): string | null {
  if (!s.startsWith("ה")) return null;
  const rest = s.slice(1);
  return rest.length >= 3 ? rest : null;
}

/**
 * גוזר צורת יחיד מריבוי נפוץ.
 * הסיומות כתובות אחרי הנרמול, ולכן ם הסופית כבר הפכה ל-מ.
 */
function singularize(s: string): string | null {
  for (const suffix of ["ימ", "ות"]) {
    if (s.endsWith(suffix) && s.length - suffix.length >= 3) {
      return s.slice(0, -suffix.length);
    }
  }
  return null;
}

const MAX_VARIANTS = 24;

export interface VariantOptions {
  /**
   * לפצל תשובה מרובת מילים למילים בודדות.
   * נכון לניחושים של ילדים, שגוי ליעדי ההשוואה — אחרת "זית"
   * היה מתקבל כתשובה מלאה ל"שמן זית".
   */
  splitWords?: boolean;
}

/** צורה מועמדת, עם קנס על צורות שנגזרו מפיצול מילים */
export interface Form {
  form: string;
  /**
   * מילה בודדת שנשלפה מתוך ניחוש מרובה מילים מקבלת קנס.
   * בלעדיו "תפוח אדמה" היה נחשב עמום, כי המילה "תפוח" לבדה
   * מתאימה בול לחידה אחרת.
   */
  penalty: number;
}

const SPLIT_PENALTY = 0.5;

/**
 * מייצר את כל הצורות שכדאי לבדוק עבור מחרוזת אחת:
 * הצורה המנורמלת, בלי מילות פתיחה, בלי ה׳ הידיעה, ביחיד,
 * ולניחושים — גם כל מילה בנפרד.
 */
export function expand(raw: string, options: VariantOptions = {}): Form[] {
  const { splitWords = true } = options;
  const base = normalize(raw);
  if (!base) return [];

  const out: Form[] = [];
  const seen = new Set<string>();
  const queue: Form[] = [{ form: base, penalty: 0 }];

  while (queue.length && out.length < MAX_VARIANTS) {
    const current = queue.shift()!;
    if (!current.form || seen.has(current.form)) continue;
    seen.add(current.form);
    out.push(current);

    const derived = [
      stripFiller(current.form),
      stripDefiniteArticle(current.form),
      singularize(current.form),
    ];
    for (const d of derived) {
      if (d && d.length >= 2 && !seen.has(d)) queue.push({ form: d, penalty: current.penalty });
    }

    if (splitWords) {
      const words = current.form.split(" ");
      if (words.length >= 2 && words.length <= 3) {
        for (const w of words) {
          if (w.length >= 3 && !seen.has(w)) {
            queue.push({ form: w, penalty: current.penalty + SPLIT_PENALTY });
          }
        }
      }
    }
  }

  return out;
}

/** אותו דבר, בלי הקנסות — נוח לבדיקות ולסקריפטים */
export function variants(raw: string, options: VariantOptions = {}): string[] {
  return expand(raw, options).map((f) => f.form);
}

// ------------------------------------------------------- עלויות עריכה

/** קבוצות אותיות שילדים מחליפים ביניהן — אותו צליל, איות אחר */
const PHONETIC_GROUPS: string[][] = [
  ["ט", "ת"],
  ["כ", "ק"],
  ["ח", "כ"],
  ["א", "ע", "ה"],
  ["ב", "ו"],
  ["ס", "ש"],
];

const PHONETIC_PARTNERS = new Map<string, Set<string>>();
for (const group of PHONETIC_GROUPS) {
  for (const letter of group) {
    const set = PHONETIC_PARTNERS.get(letter) ?? new Set<string>();
    for (const other of group) if (other !== letter) set.add(other);
    PHONETIC_PARTNERS.set(letter, set);
  }
}

/** אימות קריאה — הוספה או השמטה שלהן זולה */
const MATRES = new Set(["א", "ה", "ו", "י"]);

/** פריסת המקלדת העברית, לזיהוי החלקה לאות שכנה */
const KEYBOARD_ROWS = [
  "קראטוןםפ",
  "שדגכעיחלךף",
  "זסבהנמצתץ",
].map((row) => [...row].map((ch) => FINAL_FORMS[ch] ?? ch));

const KEYBOARD_NEIGHBORS = new Map<string, Set<string>>();
{
  const add = (a: string | undefined, b: string | undefined) => {
    if (!a || !b || a === b) return;
    const set = KEYBOARD_NEIGHBORS.get(a) ?? new Set<string>();
    set.add(b);
    KEYBOARD_NEIGHBORS.set(a, set);
  };
  KEYBOARD_ROWS.forEach((row, r) => {
    row.forEach((ch, c) => {
      add(ch, row[c - 1]);
      add(ch, row[c + 1]);
      add(ch, KEYBOARD_ROWS[r - 1]?.[c]);
      add(ch, KEYBOARD_ROWS[r + 1]?.[c]);
    });
  });
}

export const COST = {
  phonetic: 0.25,
  matres: 0.25,
  keyboard: 0.5,
  transpose: 0.5,
  other: 1,
} as const;

function substitutionCost(a: string, b: string): number {
  if (a === b) return 0;
  if (PHONETIC_PARTNERS.get(a)?.has(b)) return COST.phonetic;
  if (KEYBOARD_NEIGHBORS.get(a)?.has(b)) return COST.keyboard;
  return COST.other;
}

function indelCost(ch: string): number {
  return MATRES.has(ch) ? COST.matres : COST.other;
}

/**
 * מרחק Damerau–Levenshtein משוקלל (יישור מחרוזות אופטימלי).
 * ככל שהמספר קטן יותר, הניחוש קרוב יותר לתשובה.
 */
export function weightedDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return [...b].reduce((sum, ch) => sum + indelCost(ch), 0);
  if (n === 0) return [...a].reduce((sum, ch) => sum + indelCost(ch), 0);

  // d[i][j] = המרחק בין a[0..i) ל-b[0..j)
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) d[i]![0] = d[i - 1]![0]! + indelCost(a[i - 1]!);
  for (let j = 1; j <= n; j++) d[0]![j] = d[0]![j - 1]! + indelCost(b[j - 1]!);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const deletion = d[i - 1]![j]! + indelCost(a[i - 1]!);
      const insertion = d[i]![j - 1]! + indelCost(b[j - 1]!);
      const substitution = d[i - 1]![j - 1]! + substitutionCost(a[i - 1]!, b[j - 1]!);
      let best = Math.min(deletion, insertion, substitution);

      const swapped =
        i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1];
      if (swapped) best = Math.min(best, d[i - 2]![j - 2]! + COST.transpose);

      d[i]![j] = best;
    }
  }
  return d[m]![n]!;
}

/**
 * ספים לפי אורך התשובה — מילים קצרות סובלות פחות טעויות.
 *
 * במילה בת 4 אותיות הסף נמוך מ-1 בכוונה: החלפת אות אקראית באחרת
 * עולה 1.0 בדיוק, ואם היינו מקבלים אותה, "חלד" היה מתקבל כ"חלב".
 * טעויות הכתיב האמיתיות של ילדים — ט/ת, כ/ק, אם קריאה מיותרת —
 * עולות 0.25 בלבד, ולכן הן עוברות בקלות.
 */
export function thresholdsFor(answerLength: number): { correct: number; close: number } {
  if (answerLength <= 4) return { correct: 0.75, close: 1.5 };
  if (answerLength <= 7) return { correct: 1.5, close: 2.5 };
  return { correct: 2.0, close: 3.0 };
}

// ------------------------------------------------------------ ההשוואה

export interface Target {
  id: string;
  /** התשובה והנרדפים שלה, בצורה מנורמלת */
  forms: string[];
}

/** בונה יעד השוואה מתשובה ומרשימת נרדפים */
export function toTarget(id: string, answer: string, aliases: string[] = []): Target {
  const forms = new Set<string>();
  for (const raw of [answer, ...aliases]) {
    // בלי פיצול מילים: "זית" הוא לא תשובה מלאה ל"שמן זית"
    for (const form of variants(raw, { splitWords: false })) forms.add(form);
  }
  return { id, forms: [...forms] };
}

export interface Distance {
  value: number;
  /** צורת היעד שהתאימה הכי טוב */
  form: string;
}

/** המרחק הקטן ביותר בין אחת מצורות הניחוש לאחת מצורות היעד */
export function distanceTo(guesses: Form[], target: Target): Distance {
  let best: Distance = { value: Infinity, form: "" };
  for (const guess of guesses) {
    for (const form of target.forms) {
      const value = weightedDistance(guess.form, form) + guess.penalty;
      if (value < best.value) best = { value, form };
    }
  }
  return best;
}

export type MatchStatus = "correct" | "close" | "wrong";

export interface MatchResult {
  status: MatchStatus;
  /** המרחק המשוקלל לתשובה הנכונה */
  distance: number;
  /** למה נקבע מה שנקבע — לניפוי שגיאות ולבדיקות */
  reason:
    | "exact"
    | "fuzzy"
    | "near-threshold"
    | "partial-word"
    | "ambiguous"
    | "too-short"
    | "far";
}

/**
 * האם הניחוש כולו הוא בדיוק אחת המילים בתשובה מרובת מילים.
 * רק צורות בלי קנס נחשבות — כלומר מה שהילד הקליד ממש,
 * ולא מילה שנשלפה מתוך ניחוש ארוך יותר.
 */
function isPartialWord(guesses: Form[], target: Target): boolean {
  const multiWord = target.forms.filter((f) => f.includes(" "));
  if (!multiWord.length) return false;
  const parts = new Set(multiWord.flatMap((f) => f.split(" ")).filter((w) => w.length >= 3));
  return guesses.some((g) => g.penalty === 0 && parts.has(g.form));
}

export interface CheckOptions {
  guess: string;
  target: Target;
  /** כל שאר הפריטים בבנק — למניעת קבלה של פריט אחר */
  others?: Target[];
}

/**
 * מכריע אם הניחוש נכון, כמעט, או שגוי.
 *
 * הכללים, לפי הסדר:
 * 1. ניחוש קצר מדי נדחה מיד.
 * 2. אם הניחוש קרוב לפריט אחר בבנק כמו ליעד או יותר — שגוי.
 *    זה נבדק לפני הכול, כולל לפני התאמה מדויקת: ילד שכותב
 *    "שמן זית" בחידה על זיתים ענה על פריט אחר, לא על זה.
 * 3. התאמה מדויקת לאחת מצורות היעד — נכון.
 * 4. מרחק בתוך הסף — נכון.
 * 5. הניחוש הוא מילה אחת מתוך תשובה מרובת מילים — כמעט.
 * 6. מרחק בתוך סף ה"כמעט" — כמעט.
 */
export function checkAnswer({ guess, target, others = [] }: CheckOptions): MatchResult {
  const guesses = expand(guess);
  if (!guesses.length || guesses.every((g) => g.form.replace(/\s/g, "").length < 2)) {
    return { status: "wrong", distance: Infinity, reason: "too-short" };
  }

  const mine = distanceTo(guesses, target);

  // "שמן" כשהתשובה היא "שמן זית" — חצי תשובה, ולא ניחוש של פריט אחר.
  // נבדק לפני כלל ההבחנה, כי מילה בודדת דומה בהכרח להמון פריטים.
  if (mine.value > 0 && isPartialWord(guesses, target)) {
    return { status: "close", distance: mine.value, reason: "partial-word" };
  }

  let rival: Distance = { value: Infinity, form: "" };
  for (const other of others) {
    if (other.id === target.id) continue;
    const distance = distanceTo(guesses, other);
    if (distance.value < rival.value) rival = distance;
    if (rival.value === 0) break;
  }

  // הניחוש שייך לפריט אחר בבנק, או שהוא בדיוק על הגבול בין שניים.
  // רק אם הוא באמת קרוב לפריט האחר: ניחוש רחוק מכולם הוא פשוט שגוי,
  // ואין טעם לומר לילד שהוא ניחש פריט אחר.
  const rivalIsPlausible =
    rival.value <= mine.value && rival.value <= thresholdsFor(rival.form.length).close;
  if (rivalIsPlausible) {
    return { status: "wrong", distance: mine.value, reason: "ambiguous" };
  }

  if (mine.value === 0) return { status: "correct", distance: 0, reason: "exact" };

  const longestForm = target.forms.reduce((a, b) => (b.length > a.length ? b : a), "");
  const { correct, close } = thresholdsFor(mine.form.length || longestForm.length);

  if (mine.value <= correct) {
    return { status: "correct", distance: mine.value, reason: "fuzzy" };
  }

  if (mine.value <= close) {
    return { status: "close", distance: mine.value, reason: "near-threshold" };
  }

  return { status: "wrong", distance: mine.value, reason: "far" };
}
