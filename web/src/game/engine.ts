/**
 * מנוע המשחק, בדפדפן.
 *
 * כל הלוגיקה רצה על המכשיר, וכל הנתונים נשארים ב-localStorage.
 * לכל עולם התקדמות נפרדת: מיומנות בזיהוי מצרכים היא לא מיומנות
 * בזיהוי כוכבי לכת.
 */

import { allTargets, riddleById, riddles, targetById } from "../../../shared/bank";
import { checkAnswer } from "../../../shared/matcher";
import {
  applyReveal,
  applySolve,
  cluesAtLevel,
  levelOf,
  pickRiddle,
  progressIn,
  progressInLevel,
} from "../../../shared/difficulty";
import { greeting } from "../../../shared/prompt";
import {
  newlyCompleted,
  recipeProgress,
  type Recipe,
  type RecipeProgress,
} from "../../../shared/recipes";
import { aisleView, solvedAisleView, type AisleView } from "../../../shared/aisles";
import { DEFAULT_WORLD, LEVEL_NAMES, getWorld } from "../../../shared/worlds";
import type { ActiveRound, Profile, Riddle, WorldProgress } from "../../../shared/types";
import * as store from "../store/local";
import * as stats from "../lib/stats";

// ------------------------------------------------------- מצב החידה הפעילה

/**
 * החידה הפעילה חיה בזיכרון בלבד, ומתאפסת ברענון הדף.
 * המפתח כולל את העולם, כדי שמעבר בין עולמות לא יגרור חידה איתו.
 */
const rounds = new Map<string, ActiveRound>();

const key = (profileId: string, world: string) => `${profileId}:${world}`;

const MAX_HISTORY_TURNS = 12;

export function getRound(profileId: string, world: string = DEFAULT_WORLD): ActiveRound | undefined {
  return rounds.get(key(profileId, world));
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
  /** העולם שהתצוגה הזאת מתייחסת אליו */
  world: string;
  level: number;
  levelName: string;
  progress: number;
  streak: number;
  answerStreak: number;
  /** כמה נפתר בעולם הזה */
  solvedCount: number;
  /** כמה נפתר בסך הכול, בכל העולמות */
  totalSolved: number;
  cart: CartItem[];
  chat: { used: number; left: number };
  recipes: RecipeProgress[];
}

export function publicProfile(profile: Profile, world: string = DEFAULT_WORLD): PublicProfile {
  const progress = progressIn(profile, world);
  const level = levelOf(progress.rating);
  const solvedRiddles = profile.solved
    .map((id) => riddleById.get(id))
    .filter((riddle) => riddle !== undefined);
  const inWorld = solvedRiddles.filter((riddle) => riddle.world === world);

  return {
    id: profile.id,
    name: profile.name,
    age: profile.age,
    address: profile.address,
    avatar: profile.avatar,
    world,
    level,
    levelName: LEVEL_NAMES[level]!,
    progress: progressInLevel(progress.rating),
    streak: progress.streak,
    answerStreak: progress.answerStreak,
    solvedCount: inWorld.length,
    totalSolved: profile.solved.length,
    cart: inWorld.map((riddle) => ({
      id: riddle.id,
      name: riddle.answer,
      art: riddle.art,
    })),
    chat: store.chatUsage(profile, store.getSettings().dailyLimit),
    recipes: recipeProgress(profile.solved, profile.recipes, world),
  };
}

export interface PublicRiddle {
  id: string;
  world: string;
  clues: string[];
  cluesNikud: string[];
  cluesRevealed: number;
  cluesTotal: number;
  hasMoreClues: boolean;
  aisle: AisleView;
}

function publicRound(riddle: Riddle, cluesRevealed: number, level: number): PublicRiddle {
  const max = Math.min(riddle.clues.length, cluesAtLevel(level));
  return {
    id: riddle.id,
    world: riddle.world,
    clues: riddle.clues.slice(0, cluesRevealed),
    cluesNikud: (riddle.cluesNikud ?? riddle.clues).slice(0, cluesRevealed),
    cluesRevealed,
    cluesTotal: max,
    hasMoreClues: cluesRevealed < max,
    aisle: aisleView(riddle.world, riddle.aisle, level),
  };
}

/** שומר התקדמות של עולם אחד, בלי לגעת בשאר */
function saveProgress(profile: Profile, world: string, next: Partial<WorldProgress>): Profile {
  const current = progressIn(profile, world);
  return store.updateProfile(profile.id, {
    worlds: { ...profile.worlds, [world]: { ...current, ...next } },
  })!;
}

// -------------------------------------------------------------- פעולות

export interface RiddleResult {
  riddle?: PublicRiddle;
  greeting?: string;
  profile?: PublicProfile;
  done?: boolean;
  message?: string;
}

/** מתחיל חידה חדשה בעולם, או מחזיר את זו שכבר פתוחה */
export function startRiddle(profileId: string, world: string = DEFAULT_WORLD): RiddleResult {
  const profile = store.getProfile(profileId);
  if (!profile) throw new Error("פרופיל לא נמצא");

  let round = rounds.get(key(profileId, world));
  let riddle = round ? riddleById.get(round.riddleId) : undefined;

  if (!round || !riddle) {
    const next = pickRiddle(profile, world, riddles);
    if (!next) {
      return {
        done: true,
        message: `פתרתם את כל החידות ב${getWorld(world).name}! כל הכבוד 🎉`,
      };
    }
    round = {
      riddleId: next.id,
      cluesRevealed: 1,
      wrongGuesses: 0,
      startedAt: Date.now(),
      history: [],
    };
    rounds.set(key(profileId, world), round);
    riddle = next;
  }

  const level = levelOf(progressIn(profile, world).rating);
  return {
    riddle: publicRound(riddle, round.cluesRevealed, level),
    greeting: greeting(profile),
    profile: publicProfile(profile, world),
  };
}

/** חושף את הרמז הבא */
export function nextHint(profileId: string, world: string = DEFAULT_WORLD): PublicRiddle {
  const profile = store.getProfile(profileId);
  const round = rounds.get(key(profileId, world));
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const level = levelOf(progressIn(profile, world).rating);
  const max = Math.min(riddle.clues.length, cluesAtLevel(level));
  if (round.cluesRevealed < max) {
    round.cluesRevealed += 1;
    stats.recordHint(profileId);
  }
  return publicRound(riddle, round.cluesRevealed, level);
}

/** מה חוגגים על הפתרון הזה */
export interface Celebration {
  title: string;
  note?: string;
  streak: number;
  milestone?: number;
  noHints: boolean;
}

/** אבני הדרך של הרצף — מספיק דלילות כדי שיישארו מיוחדות */
export const STREAK_MILESTONES = [3, 5, 10, 15, 20, 30, 50];

function celebrate(streak: number, noHints: boolean): Celebration {
  const milestone = STREAK_MILESTONES.includes(streak) ? streak : undefined;
  if (milestone) {
    return {
      title: `🔥 ${milestone} ברצף!`,
      note: noHints ? "והפעם גם בלי רמזים" : "אתם בכיוון",
      streak,
      milestone,
      noHints,
    };
  }
  if (noHints) {
    return { title: "מדהים!", note: "פתרתם בלי רמזים בכלל 🤯", streak, noHints };
  }
  return { title: "כל הכבוד!", streak, noHints };
}

export interface SolvedResult {
  status: "correct";
  answer: string;
  reveal: string;
  aisle: string;
  art: Riddle["art"];
  levelUp: boolean;
  profile: PublicProfile;
  unlockedRecipes: Recipe[];
  aisleView: AisleView;
  celebration: Celebration;
}

export interface MissResult {
  status: "close" | "wrong";
  message: string;
  offerHint: boolean;
}

export type AnswerResult = SolvedResult | MissResult;

/** בודק ניחוש */
export function submitAnswer(
  profileId: string,
  guess: string,
  world: string = DEFAULT_WORLD,
): AnswerResult {
  const profile = store.getProfile(profileId);
  const round = rounds.get(key(profileId, world));
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const target = targetById.get(riddle.id)!;
  const result = checkAnswer({ guess, target, others: allTargets });

  if (result.status === "correct") {
    const progress = progressIn(profile, world);
    const change = applySolve(progress, { hintsUsed: round.cluesRevealed }, world);
    const solved = [...profile.solved, riddle.id];
    const noHints = round.cluesRevealed === 1;
    const answerStreak = progress.answerStreak + 1;

    // הפריט החדש עשוי להשלים סט. בודקים לפני השמירה, כדי לדעת
    // מה נפתח *עכשיו* ולא מה כבר היה פתוח.
    const unlocked = newlyCompleted(solved, profile.recipes);
    stats.recordSolve(profile.id, riddle.id, round.cluesRevealed);

    saveProgress(profile, world, {
      rating: change.rating,
      streak: change.streak,
      answerStreak,
    });
    const updated = store.updateProfile(profile.id, {
      solved,
      recipes: [...profile.recipes, ...unlocked.map((recipe) => recipe.id)],
    })!;
    rounds.delete(key(profileId, world));

    return {
      status: "correct",
      answer: riddle.answerNikud,
      reveal: riddle.reveal,
      aisle: riddle.aisle,
      art: riddle.art,
      levelUp: change.levelAfter > change.levelBefore,
      profile: publicProfile(updated, world),
      unlockedRecipes: unlocked,
      aisleView: solvedAisleView(riddle.world, riddle.aisle),
      celebration: celebrate(answerStreak, noHints),
    };
  }

  round.wrongGuesses += 1;
  stats.recordMiss(profile.id, riddle.id, result.status);

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
  aisleView: AisleView;
}

/** "גלה לי" — מסיים את החידה ומראה את התשובה */
export function revealAnswer(profileId: string, world: string = DEFAULT_WORLD): RevealResult {
  const profile = store.getProfile(profileId);
  const round = rounds.get(key(profileId, world));
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const change = applyReveal(progressIn(profile, world), world);
  stats.recordReveal(profile.id, riddle.id);

  saveProgress(profile, world, { rating: change.rating, streak: 0, answerStreak: 0 });
  const updated = store.updateProfile(profile.id, {
    revealed: [
      ...profile.revealed.filter((entry) => entry.id !== riddle.id),
      { id: riddle.id, at: Date.now() },
    ],
  })!;
  rounds.delete(key(profileId, world));

  return {
    answer: riddle.answerNikud,
    reveal: riddle.reveal,
    aisle: riddle.aisle,
    art: riddle.art,
    profile: publicProfile(updated, world),
    aisleView: solvedAisleView(riddle.world, riddle.aisle),
  };
}

export interface SkipResult {
  profile: PublicProfile;
}

/**
 * דילוג על חידה.
 *
 * שונה מ"גלה לי": התשובה לא מוצגת, ולכן גם אין ירידה בדירוג —
 * השחקן פשוט לא רצה את החידה הזאת. היא חוזרת לתור בעוד כמה ימים.
 * הרצף כן נשבר, כי החידה לא נפתרה.
 */
export function skipRiddle(profileId: string, world: string = DEFAULT_WORLD): SkipResult {
  const profile = store.getProfile(profileId);
  const round = rounds.get(key(profileId, world));
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  stats.recordSkip(profile.id);
  saveProgress(profile, world, { answerStreak: 0 });
  const updated = store.updateProfile(profile.id, {
    revealed: [
      ...profile.revealed.filter((entry) => entry.id !== riddle.id),
      { id: riddle.id, at: Date.now() },
    ],
  })!;
  rounds.delete(key(profileId, world));

  return { profile: publicProfile(updated, world) };
}

/** משוב לשחקן — עידוד, אף פעם לא נזיפה, ואף פעם לא רמז לתשובה */
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
  if (reason === "ambiguous") return "זו תשובה לחידה אחרת. תחשבו שוב על הרמזים.";
  if (wrongGuesses >= 3) return "לא זה. אולי כדאי לבקש עוד רמז?";
  return "לא הפעם. נסו עוד ניחוש!";
}
