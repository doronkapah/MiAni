/**
 * כל הנתונים של המשחק, על המכשיר בלבד.
 *
 * פרופילים, התקדמות, מפתח ה-API ומוני השימוש חיים ב-localStorage
 * של הדפדפן. שום דבר מכאן לא נשלח לשום שרת — גם כשהמשחק מתארח
 * בענן, מה שמתארח שם הוא רק הקוד הסטטי.
 */

import type { AddressForm, Profile } from "../../../shared/types";
import { startingRating } from "../../../shared/difficulty";
import { DEFAULT_MODEL, findModel, type TokenCounts } from "../../../shared/models";

const KEYS = {
  profiles: "agali:profiles",
  settings: "agali:settings",
  usage: "agali:usage",
  lastProfile: "agali:lastProfile",
} as const;

/** localStorage לא זמין בגלישה פרטית ובחלק מהדפדפנים המוגבלים */
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אין מקום או אין הרשאה — המשחק ממשיך, פשוט בלי לזכור
  }
}

export function storageAvailable(): boolean {
  try {
    const probe = "agali:probe";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------ פרופילים

export function listProfiles(): Profile[] {
  return read<Profile[]>(KEYS.profiles, []);
}

function saveProfiles(profiles: Profile[]): void {
  write(KEYS.profiles, profiles);
}

export function getProfile(id: string): Profile | undefined {
  return listProfiles().find((profile) => profile.id === id);
}

export interface NewProfile {
  name: string;
  age: number;
  address: AddressForm;
  avatar: string;
}

export function createProfile(input: NewProfile): Profile {
  const profile: Profile = {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: input.name.trim().slice(0, 20),
    age: Math.min(14, Math.max(3, Math.round(input.age))),
    address: input.address,
    avatar: input.avatar,
    rating: startingRating(input.age),
    streak: 0,
    solved: [],
    revealed: [],
    createdAt: Date.now(),
    chat: { day: today(), count: 0 },
  };
  saveProfiles([...listProfiles(), profile]);
  return profile;
}

export function updateProfile(id: string, patch: Partial<Profile>): Profile | undefined {
  const profiles = listProfiles();
  const index = profiles.findIndex((profile) => profile.id === id);
  if (index === -1) return undefined;
  const updated = { ...profiles[index]!, ...patch };
  profiles[index] = updated;
  saveProfiles(profiles);
  return updated;
}

export function deleteProfile(id: string): boolean {
  const profiles = listProfiles();
  const remaining = profiles.filter((profile) => profile.id !== id);
  if (remaining.length === profiles.length) return false;
  saveProfiles(remaining);
  return true;
}

export function rememberLastProfile(id: string | null): void {
  try {
    if (id) localStorage.setItem(KEYS.lastProfile, id);
    else localStorage.removeItem(KEYS.lastProfile);
  } catch {
    // גלישה פרטית — לא זוכרים, וזה בסדר
  }
}

export function lastProfileId(): string | null {
  try {
    return localStorage.getItem(KEYS.lastProfile);
  } catch {
    return null;
  }
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** מגדיל את מונה הצ'אט היומי; מחזיר כמה נשארו, או null אם נגמר */
export function consumeChatQuota(profile: Profile, limit: number): number | null {
  const day = today();
  const chat = profile.chat.day === day ? profile.chat : { day, count: 0 };
  if (chat.count >= limit) return null;
  updateProfile(profile.id, { chat: { day, count: chat.count + 1 } });
  return limit - chat.count - 1;
}

export function chatUsage(profile: Profile, limit: number): { used: number; left: number } {
  const used = profile.chat.day === today() ? profile.chat.count : 0;
  return { used, left: Math.max(0, limit - used) };
}

// ------------------------------------------------------------- הגדרות

/** מאיפה מגיע המפתח לשיחה עם עגלי */
export type ChatSource =
  /** הדפדפן פונה ישירות ל-api.anthropic.com עם המפתח של המשתמש */
  | "direct"
  /** השרת המקומי מחזיק את המפתח ב-.env, והדפדפן פונה אליו */
  | "server"
  /** עגלי כבוי לגמרי */
  | "off";

export interface Settings {
  model: string;
  chatSource: ChatSource;
  /** נשמר רק כאן, ונשלח רק ל-api.anthropic.com */
  apiKey: string;
  /** תקרת הודעות ליום לכל פרופיל */
  dailyLimit: number;
}

const DEFAULT_SETTINGS: Settings = {
  model: DEFAULT_MODEL,
  chatSource: "off",
  apiKey: "",
  dailyLimit: 40,
};

export function getSettings(): Settings {
  const stored = read<Partial<Settings>>(KEYS.settings, {});
  return {
    model: stored.model && findModel(stored.model) ? stored.model : DEFAULT_SETTINGS.model,
    chatSource: stored.chatSource ?? DEFAULT_SETTINGS.chatSource,
    apiKey: stored.apiKey ?? DEFAULT_SETTINGS.apiKey,
    dailyLimit: stored.dailyLimit ?? DEFAULT_SETTINGS.dailyLimit,
  };
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  write(KEYS.settings, next);
  return next;
}

// -------------------------------------------------------------- שימוש

interface DayUsage {
  requests: number;
  models: Record<string, TokenCounts>;
}

type UsageLog = Record<string, DayUsage>;

const EMPTY: TokenCounts = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

export function recordUsage(model: string, tokens: Partial<TokenCounts>): void {
  const log = read<UsageLog>(KEYS.usage, {});
  const day = today();
  const entry = (log[day] ??= { requests: 0, models: {} });
  const counts = (entry.models[model] ??= { ...EMPTY });

  entry.requests += 1;
  counts.input += tokens.input ?? 0;
  counts.output += tokens.output ?? 0;
  counts.cacheRead += tokens.cacheRead ?? 0;
  counts.cacheWrite += tokens.cacheWrite ?? 0;

  write(KEYS.usage, log);
}

export function usageLog(): UsageLog {
  return read<UsageLog>(KEYS.usage, {});
}

// ------------------------------------------------------- ייצוא וייבוא

export interface Backup {
  format: "agali-backup";
  version: 1;
  exportedAt: string;
  profiles: Profile[];
  usage: UsageLog;
  /** ההגדרות מיוצאות בלי המפתח — אותו לא מעבירים בקובץ */
  settings: Omit<Settings, "apiKey">;
}

export function exportBackup(): Backup {
  const { apiKey: _omitted, ...settings } = getSettings();
  return {
    format: "agali-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles: listProfiles(),
    usage: usageLog(),
    settings,
  };
}

export interface ImportResult {
  added: number;
  skipped: number;
}

/**
 * מוסיף פרופילים מקובץ גיבוי. פרופיל שכבר קיים באותו מזהה מדולג,
 * כדי שייבוא כפול לא ישכפל את העגלה של הילד.
 */
export function importBackup(backup: unknown): ImportResult {
  const data = backup as Partial<Backup>;
  if (!data || data.format !== "agali-backup" || !Array.isArray(data.profiles)) {
    throw new Error("זה לא קובץ גיבוי של עגלי");
  }

  const existing = listProfiles();
  const known = new Set(existing.map((profile) => profile.id));
  const incoming = data.profiles.filter((profile) => !known.has(profile.id));

  saveProfiles([...existing, ...incoming]);
  if (data.settings) updateSettings({ model: data.settings.model });

  return { added: incoming.length, skipped: data.profiles.length - incoming.length };
}
