/**
 * מצב "הורה שואל".
 *
 * נועד לרגעים שבהם הילד לא יכול להקליד — נסיעה, ארוחה, תור לרופא.
 * ההורה מחזיק את המסך, מקריא את הרמזים בקול, והילדים עונים בפה.
 * ההורה רואה את התשובה, ומקיש מי פתר.
 *
 * שני מצבים:
 *   תחרותי     — רק מי שפתר ראשון מקבל את הפריט לעגלה.
 *   שיתוף פעולה — כל המשתתפים מקבלים אותו, גם אם אחד אמר בקול.
 */

import { riddleById, riddles } from "../../../shared/bank";
import { DEFAULT_WORLD } from "../../../shared/worlds";
import {
  applyReveal,
  applySolve,
  cluesAtLevel,
  levelOf,
  progressIn,
} from "../../../shared/difficulty";
import { newlyCompleted, type Recipe } from "../../../shared/recipes";
import { aisleView, solvedAisleView, type AisleView } from "../../../shared/aisles";
import type { Profile, Riddle } from "../../../shared/types";
import * as store from "../store/local";
import * as stats from "../lib/stats";
import { publicProfile, type PublicProfile } from "./engine";

export type GroupMode = "competitive" | "coop";

export interface GroupSession {
  id: string;
  mode: GroupMode;
  profileIds: string[];
  level: number;
  world: string;
  /**
   * אורך הסבב. 0 = בלי סוף.
   *
   * סבב שנגמר הוא סבב שאפשר לסיים בהרגשה טובה, ולא רק לנטוש
   * באמצע כשמישהו מתעייף.
   */
  roundLength: number;
  /** תור מסתובב בין הילדים, במקום מרוץ */
  turns: boolean;
}

interface GroupRound {
  riddleId: string;
  cluesRevealed: number;
}

const groupRounds = new Map<string, GroupRound>();

export function createSession(
  profileIds: string[],
  mode: GroupMode,
  level: number,
  world: string = DEFAULT_WORLD,
  roundLength = 5,
  turns = false,
): GroupSession {
  const id = `g_${Date.now().toString(36)}`;
  return { id, mode, profileIds, level, world, roundLength, turns };
}

/** של מי התור בחידה מספר `index` */
export function whoseTurn(session: GroupSession, index: number): string | null {
  if (!session.turns || session.profileIds.length < 2) return null;
  return session.profileIds[index % session.profileIds.length] ?? null;
}

/** רמת ברירת המחדל לקבוצה: של הצעיר ביותר, כדי שכולם יוכלו להשתתף */
export function suggestedLevel(profiles: Profile[], world: string = DEFAULT_WORLD): number {
  if (!profiles.length) return 1;
  return Math.min(...profiles.map((profile) => levelOf(progressIn(profile, world).rating)));
}

/** חידה שאף אחד מהמשתתפים עוד לא פתר */
function pickForGroup(session: GroupSession): Riddle | null {
  const seen = new Set<string>();
  for (const id of session.profileIds) {
    const profile = store.getProfile(id);
    for (const solvedId of profile?.solved ?? []) seen.add(solvedId);
  }

  const inWorld = riddles.filter((riddle) => riddle.world === session.world);
  const pool = inWorld.filter((riddle) => riddle.level === session.level && !seen.has(riddle.id));
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)]!;

  // נגמרה הרמה — מנסים את הרמות הקרובות, מהקרובה לרחוקה
  const others = [...new Set(inWorld.map((riddle) => riddle.level))]
    .filter((level) => level !== session.level)
    .sort((a, b) => Math.abs(a - session.level) - Math.abs(b - session.level));
  for (const level of others) {
    const fallback = inWorld.filter((riddle) => riddle.level === level && !seen.has(riddle.id));
    if (fallback.length) return fallback[Math.floor(Math.random() * fallback.length)]!;
  }
  return null;
}

export interface ParentRiddle {
  id: string;
  clues: string[];
  cluesNikud: string[];
  cluesRevealed: number;
  hasMoreClues: boolean;
  aisle: AisleView;
  /** ההורה רואה את התשובה — הוא מנהל את המשחק */
  answer: string;
  answerNikud: string;
  reveal: string;
  aisleName: string;
}

function view(session: GroupSession, riddle: Riddle, round: GroupRound): ParentRiddle {
  const max = Math.min(riddle.clues.length, cluesAtLevel(session.level));
  return {
    id: riddle.id,
    clues: riddle.clues.slice(0, round.cluesRevealed),
    cluesNikud: (riddle.cluesNikud ?? riddle.clues).slice(0, round.cluesRevealed),
    cluesRevealed: round.cluesRevealed,
    hasMoreClues: round.cluesRevealed < max,
    aisle: aisleView(riddle.world, riddle.aisle, session.level),
    answer: riddle.answer,
    answerNikud: riddle.answerNikud,
    reveal: riddle.reveal,
    aisleName: riddle.aisle,
  };
}

export function startGroupRiddle(session: GroupSession): ParentRiddle | null {
  let round = groupRounds.get(session.id);
  let riddle = round ? riddleById.get(round.riddleId) : undefined;

  if (!round || !riddle) {
    const next = pickForGroup(session);
    if (!next) return null;
    round = { riddleId: next.id, cluesRevealed: 1 };
    groupRounds.set(session.id, round);
    riddle = next;
    // כל המשתתפים נחשבים כמי ששיחקו, גם מי שלא יזכה בסבב הזה
    stats.recordSession(session.profileIds);
  }
  return view(session, riddle, round);
}

export function groupHint(session: GroupSession): ParentRiddle | null {
  const round = groupRounds.get(session.id);
  const riddle = round && riddleById.get(round.riddleId);
  if (!round || !riddle) return null;

  const max = Math.min(riddle.clues.length, cluesAtLevel(session.level));
  if (round.cluesRevealed < max) {
    round.cluesRevealed += 1;
    for (const id of session.profileIds) stats.recordHint(id);
  }
  return view(session, riddle, round);
}

export interface AwardedTo {
  profile: PublicProfile;
  levelUp: boolean;
  unlockedRecipes: Recipe[];
}

export interface GroupOutcome {
  answer: string;
  reveal: string;
  art: Riddle["art"];
  aisleView: AisleView;
  /** למי נכנס הפריט לעגלה. ריק כשאף אחד לא פתר. */
  awarded: AwardedTo[];
  gaveUp: boolean;
}

/**
 * מעניק את הפריט. במצב תחרותי רק לזוכה, בשיתוף פעולה לכולם.
 * מספר הרמזים שנחשפו נספר לכולם באותה מידה — כולם שמעו אותם.
 */
export function awardSolve(session: GroupSession, winnerIds: string[]): GroupOutcome | null {
  const round = groupRounds.get(session.id);
  const riddle = round && riddleById.get(round.riddleId);
  if (!round || !riddle) return null;

  const receivers = session.mode === "coop" ? session.profileIds : winnerIds;
  const awarded: AwardedTo[] = [];

  for (const id of receivers) {
    const profile = store.getProfile(id);
    if (!profile || profile.solved.includes(riddle.id)) continue;

    const progress = progressIn(profile, session.world);
    const change = applySolve(progress, { hintsUsed: round.cluesRevealed }, session.world);
    const solved = [...profile.solved, riddle.id];
    const unlocked = newlyCompleted(solved, profile.recipes);
    stats.recordSolve(id, riddle.id, round.cluesRevealed);
    const updated = store.updateProfile(id, {
      worlds: {
        ...profile.worlds,
        [session.world]: {
          rating: change.rating,
          streak: change.streak,
          answerStreak: progress.answerStreak + 1,
        },
      },
      solved,
      recipes: [...profile.recipes, ...unlocked.map((recipe) => recipe.id)],
    })!;

    awarded.push({
      profile: publicProfile(updated, session.world),
      levelUp: change.levelAfter > change.levelBefore,
      unlockedRecipes: unlocked,
    });
  }

  groupRounds.delete(session.id);

  return {
    answer: riddle.answerNikud,
    reveal: riddle.reveal,
    art: riddle.art,
    aisleView: solvedAisleView(riddle.world, riddle.aisle),
    awarded,
    gaveUp: false,
  };
}

/** אף אחד לא פתר — מגלים, ואף אחד לא מקבל את הפריט */
export function groupReveal(session: GroupSession): GroupOutcome | null {
  const round = groupRounds.get(session.id);
  const riddle = round && riddleById.get(round.riddleId);
  if (!round || !riddle) return null;

  for (const id of session.profileIds) {
    const profile = store.getProfile(id);
    if (!profile) continue;
    const change = applyReveal(progressIn(profile, session.world), session.world);
    stats.recordReveal(id, riddle.id);
    store.updateProfile(id, {
      worlds: {
        ...profile.worlds,
        [session.world]: { rating: change.rating, streak: change.streak, answerStreak: 0 },
      },
      revealed: [
        ...profile.revealed.filter((entry) => entry.id !== riddle.id),
        { id: riddle.id, at: Date.now() },
      ],
    });
  }

  groupRounds.delete(session.id);

  return {
    answer: riddle.answerNikud,
    reveal: riddle.reveal,
    art: riddle.art,
    aisleView: solvedAisleView(riddle.world, riddle.aisle),
    awarded: [],
    gaveUp: true,
  };
}
