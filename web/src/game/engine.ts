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
  nextGoal,
  recipeProgress,
  type Goal,
  type Recipe,
  type RecipeProgress,
} from "../../../shared/recipes";
import { aisleView, solvedAisleView, type AisleView } from "../../../shared/aisles";
import { plausibleGuess, type Plausible } from "../../../shared/plausible";
import { choicesFor, type Choice } from "../../../shared/choices";
import {
  DAILY,
  dailyRiddle,
  dayKey,
  emptyDaily,
  nextStreak,
  starsFor,
} from "../../../shared/daily";
import { DEFAULT_WORLD, LEVEL_NAMES, getWorld } from "../../../shared/worlds";
import { levelsInWorld } from "../../../shared/bank";
import { answeringOf, readingOf } from "../../../shared/ability";
import type {
  ActiveRound,
  Answering,
  Reading,
  DailyState,
  Profile,
  Riddle,
  WorldProgress,
} from "../../../shared/types";
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
  /** איך קוראים ואיך עונים — נפרד מהגיל */
  reading: Reading;
  answering: Answering;
  cart: CartItem[];
  chat: { used: number; left: number };
  recipes: RecipeProgress[];
  /** היעד הקרוב ביותר בעולם הזה — מה אוספים עכשיו, ולמה */
  goal: Goal | null;
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
    reading: readingOf(profile),
    answering: answeringOf(profile),
    cart: inWorld.map((riddle) => ({
      id: riddle.id,
      name: riddle.answer,
      art: riddle.art,
    })),
    chat: store.chatUsage(profile, store.getSettings().dailyLimit),
    recipes: recipeProgress(profile.solved, profile.recipes, world),
    goal: nextGoal(profile.solved, profile.recipes, world, riddles),
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
  /**
   * ארבע אפשרויות, למי שעונה בבחירה ולא בהקלדה.
   *
   * ריק לכל השאר — הרשימה מכילה את התשובה מעצם הגדרתה, ואין סיבה
   * לשלוח אותה למי שלא צריך אותה.
   */
  choices: Choice[];
}

/** האם השחקן עונה בבחירה מתוך תמונות */
function byPictures(profile: Profile): boolean {
  return answeringOf(profile) === "pictures";
}

function publicRound(
  riddle: Riddle,
  cluesRevealed: number,
  level: number,
  withChoices = false,
): PublicRiddle {
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
    choices: withChoices ? choicesFor(riddle) : [],
  };
}

/**
 * שינוי קושי מפורש, ביוזמת השחקן.
 *
 * הדירוג האוטומטי מטפס לאט ומדויק, אבל הוא לא יודע שהילד משועמם
 * או מתוסכל *עכשיו*. הכפתור מזיז רמה שלמה, ומיישר את הדירוג לתחתית
 * הרמה החדשה כדי שההתקדמות תימשך משם בצורה טבעית.
 */
export function shiftLevel(profileId: string, world: string, direction: 1 | -1): number {
  const profile = store.getProfile(profileId);
  if (!profile) throw new Error("פרופיל לא נמצא");

  const levels = levelsInWorld(world);
  const current = levelOf(progressIn(profile, world).rating);
  const index = levels.indexOf(current);
  const next = levels[Math.min(levels.length - 1, Math.max(0, index + direction))] ?? current;

  saveProgress(profile, world, { rating: next, streak: 0 });
  return next;
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
/**
 * מצב חידת היום.
 *
 * הוא לא עולם — אין לו בנק, אין לו דירוג, ואי אפשר להתקדם בו רמה.
 * הוא שכבה דקה מעל הבנק כולו, ולכן הוא יושב כאן ולא ב-worlds.
 */
export interface DailyView {
  /** האם כבר נפתרה היום */
  done: boolean;
  /** האם היום נגמר בגילוי התשובה */
  gaveUp: boolean;
  /** כוכבים שנצברו היום */
  stars: number;
  /** סך הכוכבים */
  total: number;
  streak: number;
  best: number;
  /** התשובה, רק אחרי שהיום נגמר */
  answer?: string;
}

/** מצב חידת היום, לכרטיס במסך בחירת העולם */
export function dailyView(profileId: string, now: Date = new Date()): DailyView {
  const profile = store.getProfile(profileId);
  if (!profile) throw new Error("פרופיל לא נמצא");

  const today = dayKey(now);
  const state = profile.daily?.day === today ? profile.daily : undefined;
  const finished = Boolean(state?.solved || state?.gaveUp);

  return {
    done: Boolean(state?.solved),
    gaveUp: Boolean(state?.gaveUp),
    stars: state?.stars ?? 0,
    total: profile.stars ?? 0,
    streak: profile.dailyStreak ?? 0,
    best: profile.bestDailyStreak ?? 0,
    answer: finished ? riddleById.get(state!.riddleId)?.answerNikud : undefined,
  };
}

/** טוען — ובפעם הראשונה ביום גם קובע — את חידת היום */
function todaysRiddle(profile: Profile, now: Date = new Date()) {
  const today = dayKey(now);
  let state = profile.daily?.day === today ? profile.daily : undefined;

  if (!state) {
    const picked = dailyRiddle(profile, today);
    if (!picked) return null;
    state = emptyDaily(today, picked.id);
    store.updateProfile(profile.id, { daily: state });
  }

  const riddle = riddleById.get(state.riddleId);
  return riddle ? { state, riddle } : null;
}

function saveDaily(profileId: string, state: DailyState) {
  store.updateProfile(profileId, { daily: state });
}

export function startRiddle(profileId: string, world: string = DEFAULT_WORLD): RiddleResult {
  const profile = store.getProfile(profileId);
  if (!profile) throw new Error("פרופיל לא נמצא");

  if (world === DAILY) {
    const today = todaysRiddle(profile);
    if (!today) return { done: true, message: "אין היום חידה. נסו שוב מחר 🌙" };
    return {
      riddle: publicRound(
        today.riddle,
        today.state.cluesRevealed,
        today.riddle.level,
        byPictures(profile),
      ),
      greeting: greeting(profile),
      profile: publicProfile(profile, today.riddle.world),
    };
  }

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
    riddle: publicRound(riddle, round.cluesRevealed, level, byPictures(profile)),
    greeting: greeting(profile),
    profile: publicProfile(profile, world),
  };
}

/** חושף את הרמז הבא */
export function nextHint(profileId: string, world: string = DEFAULT_WORLD): PublicRiddle {
  const profile = store.getProfile(profileId);

  if (world === DAILY) {
    const today = profile && todaysRiddle(profile);
    if (!profile || !today) throw new Error("אין חידה פעילה");

    if (today.state.cluesRevealed < today.riddle.clues.length) {
      today.state.cluesRevealed += 1;
      saveDaily(profileId, today.state);
      stats.recordHint(profileId);
    }
    return publicRound(
      today.riddle,
      today.state.cluesRevealed,
      today.riddle.level,
      byPictures(profile),
    );
  }

  const round = rounds.get(key(profileId, world));
  const riddle = round && riddleById.get(round.riddleId);
  if (!profile || !round || !riddle) throw new Error("אין חידה פעילה");

  const level = levelOf(progressIn(profile, world).rating);
  const max = Math.min(riddle.clues.length, cluesAtLevel(level));
  if (round.cluesRevealed < max) {
    round.cluesRevealed += 1;
    stats.recordHint(profileId);
  }
  return publicRound(riddle, round.cluesRevealed, level, byPictures(profile));
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

/**
 * החגיגה על הפתרון.
 *
 * `cluesUsed` הוא כמה רמזים היו על המסך, וזה תמיד לפחות אחד —
 * ולכן "בלי רמזים בכלל" היה פשוט לא נכון. פתרון בעזרת רמזים הוא
 * גם הצלחה, ומגיע לו משפט משלו ולא שתיקה.
 */
function celebrate(streak: number, cluesUsed: number): Celebration {
  const firstClue = cluesUsed <= 1;
  const milestone = STREAK_MILESTONES.includes(streak) ? streak : undefined;

  if (milestone) {
    return {
      title: `🔥 ${milestone} ברצף!`,
      note: firstClue ? "והפעם כבר מהרמז הראשון" : "אתם בכיוון",
      streak,
      milestone,
      noHints: firstClue,
    };
  }
  if (firstClue) {
    return { title: "מדהים!", note: "פתרתם מהרמז הראשון 🤯", streak, noHints: true };
  }
  if (cluesUsed === 2) {
    return { title: "כל הכבוד!", note: "רמז אחד הספיק לכם", streak, noHints: false };
  }
  return {
    title: "כל הכבוד!",
    note: "אספתם את הרמזים והגעתם לתשובה — בדיוק ככה זה עובד",
    streak,
    noHints: false,
  };
}

export interface SolvedResult {
  status: "correct";
  /** היעד שהפתרון הזה קידם, אם קידם */
  advanced?: { name: string; held: number; needed: number };
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
  /**
   * הניחוש היה הגיוני — פריט אמיתי, ולא ניחוש מהאוויר.
   *
   * מוחזר תמיד כשזה המצב, כולל אחרי שרמז כבר פסל אותו. *הכפתור*
   * "רמז שיבדיל" הוא זה שתלוי גם ב-`hasMoreClues` וגם בכך שהניחוש
   * עדיין מתאים — אין מה להבדיל כשההבדל כבר הוסבר.
   */
  plausible?: Plausible;
  /** האם יש עוד רמז לתת. בלעדיו אין מה להציע */
  hasMoreClues: boolean;
}

export type AnswerResult = SolvedResult | MissResult;

/** בודק ניחוש */
export function submitAnswer(
  profileId: string,
  guess: string,
  world: string = DEFAULT_WORLD,
): AnswerResult {
  if (world === DAILY) return submitDaily(profileId, guess);

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

    /*
     * האם הפתרון קידם יעד? משווים לפני ואחרי, כי סט שנפתח *עכשיו*
     * כבר לא מופיע ברשימת היעדים הפתוחים.
     */
    const goalBefore = nextGoal(profile.solved, profile.recipes, world, riddles);
    const goalAfter = nextGoal(solved, updated.recipes, world, riddles);
    const advanced =
      goalBefore &&
      goalAfter &&
      goalBefore.id === goalAfter.id &&
      goalAfter.held > goalBefore.held
        ? { name: goalAfter.name, held: goalAfter.held, needed: goalAfter.needed }
        : undefined;

    return {
      status: "correct",
      advanced,
      answer: riddle.answerNikud,
      reveal: riddle.reveal,
      aisle: riddle.aisle,
      art: riddle.art,
      levelUp: change.levelAfter > change.levelBefore,
      profile: publicProfile(updated, world),
      unlockedRecipes: unlocked,
      aisleView: solvedAisleView(riddle.world, riddle.aisle),
      celebration: celebrate(answerStreak, round.cluesRevealed),
    };
  }

  round.wrongGuesses += 1;
  stats.recordMiss(profile.id, riddle.id, result.status);

  const plausible = plausibleGuess(guess, riddle, round.cluesRevealed) ?? undefined;
  const level = levelOf(progressIn(profile, world).rating);
  const hasMoreClues =
    round.cluesRevealed < Math.min(riddle.clues.length, cluesAtLevel(level));

  return {
    status: result.status,
    message: feedback(result.status, result.reason, round.wrongGuesses, plausible),
    offerHint: round.wrongGuesses >= 2 || Boolean(plausible),
    plausible,
    hasMoreClues,
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

  if (world === DAILY) {
    const today = profile && todaysRiddle(profile);
    if (!profile || !today) throw new Error("אין חידה פעילה");

    // ויתור עולה את היום ואת הרצף, אבל לא את הדירוג בעולם
    const updated = store.updateProfile(profile.id, {
      daily: { ...today.state, gaveUp: true, stars: 0 },
      dailyStreak: 0,
    })!;
    stats.recordReveal(profile.id, today.riddle.id);

    return {
      answer: today.riddle.answerNikud,
      reveal: today.riddle.reveal,
      aisle: today.riddle.aisle,
      art: today.riddle.art,
      profile: publicProfile(updated, today.riddle.world),
      aisleView: solvedAisleView(today.riddle.world, today.riddle.aisle),
    };
  }

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
/**
 * מה אומרים לילד שלא קלע.
 *
 * הכלל: אם הניחוש הגיוני — מודים בזה קודם. "לא הפעם" על תשובה
 * שמתאימה לרמזים מלמד שהחשיבה לא נחשבת, וזו בדיוק ההפך ממה
 * שהמשחק מנסה לעשות.
 */
function feedback(
  status: "close" | "wrong",
  reason: string,
  wrongGuesses: number,
  plausible?: Plausible,
): string {
  if (status === "close") {
    if (reason === "partial-word") return "כמעט! זה חלק מהתשובה — חסרה עוד מילה 🙂";
    return "ממש ממש קרוב! נסו שוב.";
  }
  if (reason === "too-short") return "כתבו לי מילה שלמה ואבדוק אותה.";

  if (plausible) {
    /*
     * שני מצבים שונים לגמרי.
     *
     * לפני הרמז המבחין הניחוש באמת מסתדר עם כל מה שנחשף, ואומרים
     * את זה. אחריו הוא כבר לא — ואז מסבירים מה בדיוק לא מסתדר,
     * כי "הניחוש מתאים לרמזים" יהיה פשוט לא נכון.
     */
    if (plausible.status === "ruledOut") {
      return `${plausible.guess} התאים יפה קודם! אבל לפי הרמז החדש — ${plausible.because}`;
    }
    const opening = `${plausible.guess} זה ניחוש חכם`;
    if (plausible.shared) {
      return `${opening} — גם הוא ב${plausible.shared}, והוא מתאים לרמזים. אבל אני משהו אחר.`;
    }
    return `${opening}, והוא באמת מתאים לרמזים. אבל אני משהו אחר.`;
  }

  if (reason === "ambiguous") {
    return "הניחוש הזה מתאים גם לפריט אחר. תוסיפו מילה, או בקשו עוד רמז.";
  }
  if (wrongGuesses >= 3) return "עוד לא. הרמז הבא יצמצם את האפשרויות.";
  return "לא הפעם. נסו עוד ניחוש!";
}


/**
 * תשובה לחידת היום.
 *
 * הפתרון נכנס לאוסף של העולם שממנו החידה באה — כך שיום של חידה
 * מהחלל מקדם גם את יומן החלל — אבל הדירוג לא זז. חידת היום לא
 * אמורה לדחוף אף אחד לרמה שהוא לא שם.
 */
function submitDaily(profileId: string, guess: string): AnswerResult {
  const profile = store.getProfile(profileId);
  const today = profile && todaysRiddle(profile);
  if (!profile || !today) throw new Error("אין חידה פעילה");

  const { state, riddle } = today;
  const target = targetById.get(riddle.id)!;
  const result = checkAnswer({ guess, target, others: allTargets });

  if (result.status !== "correct") {
    stats.recordMiss(profile.id, riddle.id, result.status);
    const plausible = plausibleGuess(guess, riddle, state.cluesRevealed) ?? undefined;
    const hasMoreClues = state.cluesRevealed < riddle.clues.length;
    return {
      status: result.status,
      message: feedback(result.status, result.reason, 1, plausible),
      offerHint: hasMoreClues,
      plausible,
      hasMoreClues,
    };
  }

  const stars = state.solved ? 0 : starsFor(state.cluesRevealed);
  const streak = nextStreak(
    profile.dailyStreak ?? 0,
    profile.lastDailyDay ?? null,
    state.day,
  );
  const solved = profile.solved.includes(riddle.id)
    ? profile.solved
    : [...profile.solved, riddle.id];
  const unlocked = newlyCompleted(solved, profile.recipes);

  stats.recordSolve(profile.id, riddle.id, state.cluesRevealed);

  const updated = store.updateProfile(profile.id, {
    daily: { ...state, solved: true, stars },
    stars: (profile.stars ?? 0) + stars,
    dailyStreak: streak,
    bestDailyStreak: Math.max(profile.bestDailyStreak ?? 0, streak),
    lastDailyDay: state.day,
    solved,
    recipes: [...profile.recipes, ...unlocked.map((recipe) => recipe.id)],
  })!;

  return {
    status: "correct",
    answer: riddle.answerNikud,
    reveal: riddle.reveal,
    aisle: riddle.aisle,
    art: riddle.art,
    levelUp: false,
    profile: publicProfile(updated, riddle.world),
    unlockedRecipes: unlocked,
    aisleView: solvedAisleView(riddle.world, riddle.aisle),
    celebration: {
      title: "⭐".repeat(Math.max(1, stars)) + (stars === 3 ? " מושלם!" : " כל הכבוד!"),
      note:
        streak > 1
          ? `חידת היום — ${streak} ימים ברצף`
          : "חידת היום נפתרה",
      streak,
      noHints: state.cluesRevealed === 1,
    },
  };
}
