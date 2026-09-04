/**
 * מנוע המשחק, בדפדפן.
 *
 * זה מה שהיה קודם ה-API של השרת. אותה לוגיקה בדיוק — היא ממילא
 * הייתה טהורה ולא תלויה ב-Fastify — רק שעכשיו היא רצה על המכשיר
 * של המשתמש, וכל הנתונים נשארים ב-localStorage.
 */

import { LEVEL_NAMES, allTargets, riddleById, riddles, targetById } from "../../../shared/bank";
import { checkAnswer } from "../../../shared/matcher";
import {
  applyReveal,
  applySolve,
  cluesAtLevel,
  levelOf,
  pickRiddle,
  progressInLevel,
} from "../../../shared/difficulty";
import { greeting } from "../../../shared/prompt";
import type { ActiveRound, Profile, Riddle } from "../../../shared/types";
import * as store from "../store/local";

// ------------------------------------------------------- מצב החידה הפעילה

/**
 * החידה הפעילה חיה בזיכרון בלבד, ומתאפסת ברענון הדף.
 * זה מכוון: מי שרענן באמצע חידה מקבל חידה חדשה, ולא מצב תקוע.
 */
const rounds = new Map<string, ActiveRound>();

const MAX_HISTORY_TURNS = 12;

export function getRound(profileId: string): ActiveRound | undefined {
  return rounds.get(profileId);
}

export function pushHistory(
  round: ActiveRound,
  role: "user" | "assistant",
  content: string,
): void {
  round.history.push({ role, content });
  const max = MAX_HISTORY_TURNS * 2;
  if (round.history.length > max) round.history = round.history.slice(-max);
}

// ------------------------------------------------------------- תצוגות

export interface CartItem {
  id: string;
  name: string;
  art: Riddle["art"];
}

export interface PublicProfile {
  id: string;
  name: string;
  age: number;
  address: "male" | "female";
  avatar: string;
  level: number;
  levelName: string;
  progress: number;
  streak: number;
  solvedCount: number;
  cart: CartItem[];
  chat: { used: number; left: number };
}

export function publicProfile(profile: Profile): PublicProfile {
  const level = levelOf(profile.rating);
  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    address: profile.address,
    avatar: profile.avatar,
    level,
    levelName: LEVEL_NAMES[level]!,
    progress: progressInLevel(profile.rating),
    streak: profile.streak,
    solvedCount: profile.solved.length,
    cart: profile.solved
      .map((id) => riddleById.get(id))
      .filter((riddle) => riddle !== undefined)
      .map((riddle) => ({ id: riddle.id, name: riddle.answer, art: riddle.art })),
    chat: store.chatUsage(profile, store.getSettings().dailyLimit),
  };
}

export interface PublicRiddle {
  id: string;
  clues: string[];
  cluesNikud: string[];
  cluesRevealed: number;
  cluesTotal: number;
  hasMoreClues: boolean;
}

function publicRound(riddle: Riddle, cluesRevealed: number, level: number): PublicRiddle {
  const max = Math.min(riddle.clues.length, cluesAtLevel(level));
  return {
    id: riddle.id,
    clues: riddle.clues.slice(0, cluesRevealed),
    cluesNikud: (riddle.cluesNikud ?? riddle.clues).slice(0, cluesRevealed),
    cluesRevealed,
    cluesTotal: max,
    hasMoreClues: cluesRevealed < max,
  };
}

// -------------------------------------------------------------- פעולות

export interface RiddleResult {
  riddle?: PublicRiddle;
  greeting?: string;
  profile?: PublicProfile;
  done?: boolean;
  message?: string;
}

/** מתחיל חידה חדשה, או מחזיר את זו שכבר פתוחה */
export function startRiddle(profileId: string): RiddleResult {
  const profile = store.getProfile(profileId);
  if (!profile) throw new Error("פרופיל לא נמצא");

  let round = rounds.get(profile.id);
  let riddle = round ? riddleById.get(round.riddleId) : undefined;

  if (!round || !riddle) {
    const next = pickRiddle(profile, riddles);
    if (!next) {
      return { done: true, message: "פתרת את כל החידות בבנק! כל הכבוד 🎉" };
    }
    round = {
      riddleId: next.id,
      cluesRevealed: 1,
      wrongGuesses: 0,
      startedAt: Date.now(),
      history: [],
    };
    rounds.set(profile.id, round);
    riddle = next;
  }

  return {
    riddle: publicRound(riddle, round.cluesRevealed, levelOf(profile.rating)),
    greeting: greeting(profile),
    profile: publicProfile(profile),
  };
}

/** חושף את הרמז הבא */
export function nextHint(profileId: string): PublicRiddle {
  const profile = store.getProfile(profileId);
  const round = rounds.get(profileId);
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const max = Math.min(riddle.clues.length, cluesAtLevel(levelOf(profile.rating)));
  if (round.cluesRevealed < max) round.cluesRevealed += 1;

  return publicRound(riddle, round.cluesRevealed, levelOf(profile.rating));
}

export interface SolvedResult {
  status: "correct";
  answer: string;
  reveal: string;
  aisle: string;
  art: Riddle["art"];
  levelUp: boolean;
  profile: PublicProfile;
}

export interface MissResult {
  status: "close" | "wrong";
  message: string;
  offerHint: boolean;
}

export type AnswerResult = SolvedResult | MissResult;

/** בודק ניחוש */
export function submitAnswer(profileId: string, guess: string): AnswerResult {
  const profile = store.getProfile(profileId);
  const round = rounds.get(profileId);
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const target = targetById.get(riddle.id)!;
  const result = checkAnswer({ guess, target, others: allTargets });

  if (result.status === "correct") {
    const change = applySolve(profile, { hintsUsed: round.cluesRevealed });
    const updated = store.updateProfile(profile.id, {
      rating: change.rating,
      streak: change.streak,
      solved: [...profile.solved, riddle.id],
    })!;
    rounds.delete(profile.id);

    return {
      status: "correct",
      answer: riddle.answerNikud,
      reveal: riddle.reveal,
      aisle: riddle.aisle,
      art: riddle.art,
      levelUp: change.levelAfter > change.levelBefore,
      profile: publicProfile(updated),
    };
  }

  round.wrongGuesses += 1;

  return {
    status: result.status,
    message: feedback(result.status, result.reason, round.wrongGuesses),
    offerHint: round.wrongGuesses >= 3,
  };
}

export interface RevealResult {
  answer: string;
  reveal: string;
  aisle: string;
  art: Riddle["art"];
  profile: PublicProfile;
}

/** "גלה לי" — מסיים את החידה ומראה את התשובה */
export function revealAnswer(profileId: string): RevealResult {
  const profile = store.getProfile(profileId);
  const round = rounds.get(profileId);
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const change = applyReveal(profile);
  const updated = store.updateProfile(profile.id, {
    rating: change.rating,
    streak: change.streak,
    revealed: [
      ...profile.revealed.filter((entry) => entry.id !== riddle.id),
      { id: riddle.id, at: Date.now() },
    ],
  })!;
  rounds.delete(profile.id);

  return {
    answer: riddle.answerNikud,
    reveal: riddle.reveal,
    aisle: riddle.aisle,
    art: riddle.art,
    profile: publicProfile(updated),
  };
}

/** משוב לילד — עידוד, אף פעם לא נזיפה, ואף פעם לא רמז לתשובה */
function feedback(
  status: "close" | "wrong",
  reason: string,
  wrongGuesses: number,
): string {
  if (status === "close") {
    if (reason === "partial-word") return "כמעט! זה חלק מהתשובה — חסרה עוד מילה 🙂";
    return "ממש ממש קרוב! נסו שוב.";
  }
  if (reason === "too-short") return "כתבו לי מילה שלמה ואבדוק אותה.";
  if (reason === "ambiguous") return "זה פריט אחר בסופר. תחשבו שוב על הרמזים.";
  if (wrongGuesses >= 3) return "לא זה. אולי כדאי לבקש עוד רמז, או לשאול את עגלי?";
  return "לא הפעם. נסו עוד ניחוש!";
}
