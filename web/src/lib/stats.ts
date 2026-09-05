/**
 * נתוני שימוש — מצטברים, מקומיים, ולא עוזבים את המכשיר.
 *
 * היומן (lib/log.ts) שומר 300 אירועים אחרונים ואז מוחק את הישנים,
 * ולכן אי אפשר לגזור ממנו סטטיסטיקה לאורך זמן. כאן נשמרים מונים
 * מצטברים בלבד — מספרים, בלי טקסט חופשי — והם לא נמחקים לעולם.
 */

const KEY = "agali:stats";

export interface ProfileStats {
  solved: number;
  wrong: number;
  close: number;
  hints: number;
  reveals: number;
  skips: number;
  firstPlay: number;
  lastPlay: number;
  /** תאריך (YYYY-MM-DD) → כמה חידות נפתרו באותו יום */
  days: Record<string, number>;
}

export interface RiddleStats {
  solved: number;
  wrong: number;
  reveals: number;
  /** סכום הרמזים שנחשפו בפתרונות מוצלחים, לחישוב ממוצע */
  hintsAtSolve: number;
}

export interface Stats {
  version: 1;
  profiles: Record<string, ProfileStats>;
  riddles: Record<string, RiddleStats>;
}

const EMPTY_PROFILE = (): ProfileStats => ({
  solved: 0,
  wrong: 0,
  close: 0,
  hints: 0,
  reveals: 0,
  skips: 0,
  firstPlay: Date.now(),
  lastPlay: Date.now(),
  days: {},
});

const EMPTY_RIDDLE = (): RiddleStats => ({ solved: 0, wrong: 0, reveals: 0, hintsAtSolve: 0 });

function read(): Stats {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Stats) : null;
    if (parsed?.version === 1) return parsed;
  } catch {
    // אחסון חסום — מתחילים מאפס
  }
  return { version: 1, profiles: {}, riddles: {} };
}

function write(stats: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // אין מקום — המשחק ממשיך בלי סטטיסטיקה
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function touch(stats: Stats, profileId: string): ProfileStats {
  const entry = (stats.profiles[profileId] ??= EMPTY_PROFILE());
  entry.lastPlay = Date.now();
  return entry;
}

export function recordSolve(profileId: string, riddleId: string, hintsUsed: number): void {
  const stats = read();
  const profile = touch(stats, profileId);
  profile.solved += 1;
  profile.days[today()] = (profile.days[today()] ?? 0) + 1;

  const riddle = (stats.riddles[riddleId] ??= EMPTY_RIDDLE());
  riddle.solved += 1;
  riddle.hintsAtSolve += hintsUsed;

  write(stats);
}

export function recordMiss(
  profileId: string,
  riddleId: string,
  status: "close" | "wrong",
): void {
  const stats = read();
  const profile = touch(stats, profileId);
  if (status === "close") profile.close += 1;
  else profile.wrong += 1;

  const riddle = (stats.riddles[riddleId] ??= EMPTY_RIDDLE());
  riddle.wrong += 1;

  write(stats);
}

/**
 * סימון השתתפות בלי לשנות מונים.
 *
 * במצב תחרותי ילד שלא זכה באף סבב לא היה מקבל שום רישום, והיה
 * נעלם מהסיכום כאילו לא שיחק. הוא כן שיחק.
 */
export function recordSession(profileIds: string[]): void {
  const stats = read();
  for (const id of profileIds) touch(stats, id);
  write(stats);
}

export function recordHint(profileId: string): void {
  const stats = read();
  touch(stats, profileId).hints += 1;
  write(stats);
}

export function recordReveal(profileId: string, riddleId: string): void {
  const stats = read();
  touch(stats, profileId).reveals += 1;
  (stats.riddles[riddleId] ??= EMPTY_RIDDLE()).reveals += 1;
  write(stats);
}

export function recordSkip(profileId: string): void {
  const stats = read();
  touch(stats, profileId).skips += 1;
  write(stats);
}

export function readStats(): Stats {
  return read();
}

export function clearStats(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // כלום
  }
}

// ------------------------------------------------------------ גזירות

export interface ChildRow {
  id: string;
  solved: number;
  guesses: number;
  /** אחוז הניחושים שהיו נכונים */
  accuracy: number;
  hintsPerRiddle: number;
  reveals: number;
  skips: number;
  activeDays: number;
  lastPlay: number;
}

/** מחזיר שורה מאופסת לשחקן שעוד לא שיחק, כדי שלא ייעלם מהטבלה */
export function childRow(profileId: string, stats = read()): ChildRow {
  const entry = stats.profiles[profileId] ?? EMPTY_PROFILE();
  const guesses = entry.solved + entry.wrong + entry.close;
  return {
    id: profileId,
    solved: entry.solved,
    guesses,
    accuracy: guesses ? entry.solved / guesses : 0,
    hintsPerRiddle: entry.solved ? entry.hints / entry.solved : 0,
    reveals: entry.reveals,
    skips: entry.skips ?? 0,
    activeDays: Object.keys(entry.days).length,
    lastPlay: entry.lastPlay,
  };
}

export interface DayBar {
  day: string;
  label: string;
  solved: number;
}

/** פעילות ב-N הימים האחרונים, כולל ימים ריקים */
export function activity(days = 14, stats = read()): DayBar[] {
  const out: DayBar[] = [];
  const now = new Date();

  for (let back = days - 1; back >= 0; back--) {
    const date = new Date(now);
    date.setDate(now.getDate() - back);
    const key = date.toISOString().slice(0, 10);
    const solved = Object.values(stats.profiles).reduce(
      (sum, profile) => sum + (profile.days[key] ?? 0),
      0,
    );
    out.push({
      day: key,
      label: date.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }),
      solved,
    });
  }
  return out;
}

export interface HardRiddle {
  id: string;
  wrong: number;
  reveals: number;
  solved: number;
  /** ממוצע הרמזים שנדרשו כדי לפתור */
  avgHints: number;
}

/**
 * החידות שהכי הקשו.
 * הדירוג לפי ניחושים שגויים ועל "גלה לי", כי אלה מה שמעיד על קושי.
 */
export function hardestRiddles(limit = 6, stats = read()): HardRiddle[] {
  return Object.entries(stats.riddles)
    .map(([id, entry]) => ({
      id,
      wrong: entry.wrong,
      reveals: entry.reveals,
      solved: entry.solved,
      avgHints: entry.solved ? entry.hintsAtSolve / entry.solved : 0,
    }))
    .filter((entry) => entry.wrong > 0 || entry.reveals > 0)
    .sort((a, b) => b.wrong + b.reveals * 2 - (a.wrong + a.reveals * 2))
    .slice(0, limit);
}

export interface Totals {
  solved: number;
  guesses: number;
  reveals: number;
  skips: number;
  activeDays: number;
  firstPlay: number | null;
}

export function totals(stats = read()): Totals {
  const all = Object.values(stats.profiles);
  const days = new Set<string>();
  for (const profile of all) for (const day of Object.keys(profile.days)) days.add(day);

  return {
    solved: all.reduce((sum, profile) => sum + profile.solved, 0),
    guesses: all.reduce(
      (sum, profile) => sum + profile.solved + profile.wrong + profile.close,
      0,
    ),
    reveals: all.reduce((sum, profile) => sum + profile.reveals, 0),
    skips: all.reduce((sum, profile) => sum + (profile.skips ?? 0), 0),
    activeDays: days.size,
    firstPlay: all.length ? Math.min(...all.map((profile) => profile.firstPlay)) : null,
  };
}
