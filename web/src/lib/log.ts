/**
 * יומן המשחק.
 *
 * המשחק רץ כולו בדפדפן, ולכן אין שרת שאפשר להסתכל בלוגים שלו.
 * במקום זה נשמר כאן יומן מקומי של מה שקרה — מי שיחק, מה ניחש,
 * מה נפתח. הוא נשאר על המכשיר כמו כל שאר הנתונים, ואפשר לצפות
 * בו ולהוריד אותו מלוח ההורים.
 */

const KEY = "agali:log";

/** כמה אירועים נשמרים לאחור. מעבר לזה, הישנים נמחקים. */
const MAX_ENTRIES = 300;

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  at: number;
  level: LogLevel;
  /** באיזה חלק של המשחק — riddle, answer, recipe, parent, chat, app */
  scope: string;
  message: string;
  /** מי שיחק, כשרלוונטי */
  who?: string;
  data?: Record<string, unknown>;
}

function read(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as LogEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(entries: LogEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
  } catch {
    // אין מקום — היומן פשוט לא נשמר, והמשחק ממשיך
  }
}

export function log(
  scope: string,
  message: string,
  extra: { who?: string; level?: LogLevel; data?: Record<string, unknown> } = {},
): void {
  const entry: LogEntry = {
    at: Date.now(),
    level: extra.level ?? "info",
    scope,
    message,
    ...(extra.who ? { who: extra.who } : {}),
    ...(extra.data ? { data: extra.data } : {}),
  };

  write([...read(), entry]);

  // גם לקונסולה של הדפדפן, למי שפתח את כלי הפיתוח
  const line = `[עגלי·${scope}] ${message}`;
  if (entry.level === "error") console.error(line, entry.data ?? "");
  else if (entry.level === "warn") console.warn(line, entry.data ?? "");
  else console.info(line, entry.data ?? "");
}

export function readLog(): LogEntry[] {
  return read().slice().reverse();
}

export function clearLog(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // כלום
  }
}

export function formatTime(at: number): string {
  return new Date(at).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
