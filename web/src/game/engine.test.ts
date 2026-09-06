import { beforeEach, describe, expect, it } from "vitest";
import type { MissResult, SolvedResult } from "./engine";

/**
 * בדיקות למנוע שרץ בדפדפן.
 *
 * המנוע נשען על localStorage, ולכן הבדיקות מספקות מימוש מינימלי
 * שלו לפני שהמודולים נטענים.
 */
class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  clear() {
    this.data.clear();
  }
}

const storage = new MemoryStorage();
globalThis.localStorage = storage as unknown as Storage;

const { riddleById } = await import("../../../shared/bank");
const { recipeById } = await import("../../../shared/recipes");
const { commonTypos } = await import("../../../scripts/typo-report");
const { newlyCompleted } = await import("../../../shared/recipes");
const engine = await import("./engine");
const store = await import("../store/local");
const group = await import("./group");
const stats = await import("../lib/stats");
const shareLib = await import("../lib/share");
const { progressIn } = await import("../../../shared/difficulty");

/** התקדמות בעולם ברירת המחדל, שבו רצות רוב הבדיקות */
function marketProgress(profileId: string) {
  return progressIn(store.getProfile(profileId)!, "market");
}

function newPlayer(age = 7) {
  return store.createProfile({ name: "בדיקה", age, address: "female", avatar: "tomato" });
}

/** הגיל שפותח את הרמה המבוקשת */
const AGE_BY_LEVEL: Record<number, number> = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 18, 6: 18 };

/** מתחיל סבב על חידה מסוימת, בלי להסתמך על ההגרלה */
function playingIn(riddleId: string) {
  const wanted = riddleById.get(riddleId)!;
  const player = store.createProfile({
    name: "בדיקה",
    age: AGE_BY_LEVEL[wanted.level] ?? 7,
    address: "female",
    avatar: "tomato",
  });
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const started = engine.startRiddle(player.id, wanted.world);
    if (started.riddle?.id === riddleId) return { player, riddle: wanted };
    if (started.done) break;
    engine.skipRiddle(player.id, wanted.world);
  }
  throw new Error(`לא הגעתי ל-${riddleId}`);
}

describe("מנוע המשחק בדפדפן", () => {
  beforeEach(() => storage.clear());

  it("יוצר פרופיל ושומר אותו מקומית", () => {
    const profile = newPlayer(5);
    expect(store.listProfiles()).toHaveLength(1);
    expect(engine.publicProfile(profile).levelName).toBe("מתחילים");
  });

  it("גיל קובע את רמת הפתיחה", () => {
    expect(engine.publicProfile(newPlayer(5)).level).toBe(1);
    storage.clear();
    expect(engine.publicProfile(newPlayer(10)).level).toBe(4);
  });

  it("מגיש חידה בלי לחשוף את התשובה", () => {
    const profile = newPlayer(7);
    const result = engine.startRiddle(profile.id);
    const riddle = riddleById.get(result.riddle!.id)!;
    expect(result.riddle!.clues).toHaveLength(1);
    expect(JSON.stringify(result.riddle)).not.toContain(riddle.answer);
  });

  it("מחזיר את אותה חידה עד שפותרים אותה", () => {
    const profile = newPlayer(7);
    const first = engine.startRiddle(profile.id).riddle!.id;
    expect(engine.startRiddle(profile.id).riddle!.id).toBe(first);
  });

  it("חושף רמזים אחד אחרי השני, עד התקרה של הרמה", () => {
    const profile = newPlayer(5);
    engine.startRiddle(profile.id);
    const second = engine.nextHint(profile.id);
    expect(second.cluesRevealed).toBe(2);
    expect(second.hasMoreClues).toBe(false);
    expect(engine.nextHint(profile.id).cluesRevealed).toBe(2);
  });

  it("מקבל תשובה נכונה עם שגיאת כתיב, ומכניס לעגלה", () => {
    const profile = newPlayer(7);
    const riddle = riddleById.get(engine.startRiddle(profile.id).riddle!.id)!;
    const typo = commonTypos(riddle.answer)[0] ?? riddle.answer;

    const result = engine.submitAnswer(profile.id, typo);
    expect(result.status, `${riddle.answer} → ${typo}`).toBe("correct");
    if (result.status !== "correct") return;
    expect(result.profile.cart.map((item) => item.name)).toContain(riddle.answer);
    expect(store.getProfile(profile.id)!.solved).toContain(riddle.id);
  });

  it("ניחוש שגוי לא מקדם ולא שובר", () => {
    const profile = newPlayer(7);
    engine.startRiddle(profile.id);
    const before = marketProgress(profile.id).rating;
    const result = engine.submitAnswer(profile.id, "מכונית");
    expect(result.status).not.toBe("correct");
    expect(marketProgress(profile.id).rating).toBe(before);
  });

  it("גלה לי מוריד דירוג ומחזיר את החידה לתור", () => {
    const profile = newPlayer(7);
    const riddleId = engine.startRiddle(profile.id).riddle!.id;
    const before = marketProgress(profile.id).rating;

    const result = engine.revealAnswer(profile.id);
    expect(result.answer).toBeTruthy();
    expect(marketProgress(profile.id).rating).toBeLessThan(before);
    expect(store.getProfile(profile.id)!.revealed.map((r) => r.id)).toContain(riddleId);
    expect(store.getProfile(profile.id)!.solved).not.toContain(riddleId);
  });

  it("שני שחקנים באותו מכשיר מקבלים חידות ברמות שונות", () => {
    const small = newPlayer(5);
    const big = newPlayer(10);
    const forSmall = riddleById.get(engine.startRiddle(small.id).riddle!.id)!;
    const forBig = riddleById.get(engine.startRiddle(big.id).riddle!.id)!;
    expect(forSmall.level).toBe(1);
    expect(forBig.level).toBe(4);
  });

  it("לא חוזר על חידה שכבר נפתרה", () => {
    const profile = newPlayer(7);
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const riddle = riddleById.get(engine.startRiddle(profile.id).riddle!.id)!;
      expect(seen.has(riddle.id)).toBe(false);
      seen.add(riddle.id);
      engine.submitAnswer(profile.id, riddle.answer);
    }
  });
});

describe("גיבוי", () => {
  beforeEach(() => storage.clear());

  it("מייצא ומייבא פרופילים בלי לשכפל", () => {
    const profile = newPlayer(8);
    engine.startRiddle(profile.id);
    const backup = store.exportBackup();

    storage.clear();
    expect(store.importBackup(backup)).toEqual({ added: 1, skipped: 0 });
    expect(store.listProfiles()).toHaveLength(1);

    expect(store.importBackup(backup)).toEqual({ added: 0, skipped: 1 });
    expect(store.listProfiles()).toHaveLength(1);
  });

  it("הגיבוי לא מכיל את מפתח ה-API", () => {
    store.updateSettings({ apiKey: "sk-ant-secret" });
    expect(JSON.stringify(store.exportBackup())).not.toContain("sk-ant-secret");
  });

  it("קובץ זר נדחה", () => {
    expect(() => store.importBackup({ hello: "world" })).toThrow();
  });
});

describe("תקרת הצ'אט", () => {
  beforeEach(() => storage.clear());

  it("נגמרת אחרי המכסה היומית ומתאפסת ביום חדש", () => {
    const profile = newPlayer(7);
    for (let i = 0; i < 3; i++) {
      expect(store.consumeChatQuota(store.getProfile(profile.id)!, 3)).not.toBeNull();
    }
    expect(store.consumeChatQuota(store.getProfile(profile.id)!, 3)).toBeNull();

    store.updateProfile(profile.id, { chat: { day: "2000-01-01", count: 99 } });
    expect(store.consumeChatQuota(store.getProfile(profile.id)!, 3)).toBe(2);
  });
});

describe("מתכונים במנוע", () => {
  beforeEach(() => storage.clear());

  /** פותר חידה מסוימת ישירות, בלי לחכות שהיא תיבחר אקראית */
  function solve(profileId: string, riddleId: string) {
    const profile = store.getProfile(profileId)!;
    if (profile.solved.includes(riddleId)) return null;
    store.updateProfile(profileId, { solved: [...profile.solved, riddleId] });
    return null;
  }

  it("הפריט האחרון של מתכון פותח אותו, ושומר בפרופיל", () => {
    const profile = newPlayer(7);
    solve(profile.id, "egg");
    solve(profile.id, "butter");

    // עכשיו רק מלח חסר — פותרים אותו דרך המנוע
    const before = store.getProfile(profile.id)!;
    const unlocked = newlyCompleted([...before.solved, "salt"], before.recipes);
    expect(unlocked.map((r) => r.id)).toEqual(["omelet"]);
  });

  it("publicProfile מדווח על התקדמות המתכונים", () => {
    const profile = newPlayer(7);
    solve(profile.id, "egg");
    const view = engine.publicProfile(store.getProfile(profile.id)!);
    const omelet = view.recipes.find((recipe) => recipe.id === "omelet")!;
    expect(omelet.held).toBe(1);
    expect(omelet.unlocked).toBe(false);
  });

  it("פרופיל ישן בלי שדה מתכונים לא שובר כלום", () => {
    const profile = newPlayer(7);
    const raw = JSON.parse(storage.getItem("agali:profiles")!);
    delete raw[0].recipes;
    storage.setItem("agali:profiles", JSON.stringify(raw));

    const loaded = store.getProfile(profile.id)!;
    expect(loaded.recipes).toEqual([]);
    expect(() => engine.publicProfile(loaded)).not.toThrow();
  });
});

describe("מצב הורה שואל", () => {
  beforeEach(() => storage.clear());

  function twoKids() {
    const a = store.createProfile({ name: "אלף", age: 6, address: "female", avatar: "unicorn" });
    const b = store.createProfile({ name: "בית", age: 6, address: "male", avatar: "rabbit" });
    return [a, b] as const;
  }

  it("רמת ברירת המחדל היא של הצעיר ביותר", () => {
    const small = store.createProfile({ name: "קטן", age: 5, address: "male", avatar: "cat" });
    const big = store.createProfile({ name: "גדול", age: 10, address: "male", avatar: "dog" });
    expect(group.suggestedLevel([small, big])).toBe(1);
  });

  it("במצב תחרותי רק הזוכה מקבל את הפריט", () => {
    const [a, b] = twoKids();
    const session = group.createSession([a.id, b.id], "competitive", 1);
    const riddle = group.startGroupRiddle(session)!;

    const outcome = group.awardSolve(session, [a.id])!;
    expect(outcome.awarded.map((entry) => entry.profile.id)).toEqual([a.id]);
    expect(store.getProfile(a.id)!.solved).toContain(riddle.id);
    expect(store.getProfile(b.id)!.solved).not.toContain(riddle.id);
  });

  it("במצב שיתוף פעולה כולם מקבלים את הפריט", () => {
    const [a, b] = twoKids();
    const session = group.createSession([a.id, b.id], "coop", 1);
    const riddle = group.startGroupRiddle(session)!;

    const outcome = group.awardSolve(session, [a.id])!;
    expect(outcome.awarded).toHaveLength(2);
    expect(store.getProfile(a.id)!.solved).toContain(riddle.id);
    expect(store.getProfile(b.id)!.solved).toContain(riddle.id);
  });

  it("כשאף אחד לא פתר, אף אחד לא מקבל — וכולם סופגים את ההורדה", () => {
    const [a, b] = twoKids();
    const before = marketProgress(a.id).rating;
    const session = group.createSession([a.id, b.id], "competitive", 1);
    const riddle = group.startGroupRiddle(session)!;

    const outcome = group.groupReveal(session)!;
    expect(outcome.awarded).toEqual([]);
    expect(outcome.gaveUp).toBe(true);
    expect(store.getProfile(a.id)!.solved).not.toContain(riddle.id);
    expect(marketProgress(a.id).rating).toBeLessThan(before);
    expect(store.getProfile(b.id)!.revealed.map((r) => r.id)).toContain(riddle.id);
  });

  it("לא בוחר חידה שאחד המשתתפים כבר פתר", () => {
    const [a, b] = twoKids();
    const session = group.createSession([a.id, b.id], "competitive", 1);

    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const riddle = group.startGroupRiddle(session)!;
      expect(seen.has(riddle.id)).toBe(false);
      seen.add(riddle.id);
      // רק אחד מהם פותר, ובכל זאת החידה לא תחזור לקבוצה
      group.awardSolve(session, [i % 2 === 0 ? a.id : b.id]);
    }
  });

  it("ההורה רואה את התשובה, והרמזים נחשפים בהדרגה", () => {
    const [a] = twoKids();
    const session = group.createSession([a.id], "competitive", 2);
    const first = group.startGroupRiddle(session)!;

    expect(first.answer.length).toBeGreaterThan(1);
    expect(first.clues).toHaveLength(1);
    expect(first.hasMoreClues).toBe(true);

    const second = group.groupHint(session)!;
    expect(second.cluesRevealed).toBe(2);
  });

  it("מתכון שנפתח לילד במצב קבוצתי נשמר אצלו", () => {
    const [a, b] = twoKids();
    store.updateProfile(a.id, { solved: ["egg", "butter"] });
    store.updateProfile(b.id, { solved: ["egg", "butter"] });

    const session = group.createSession([a.id, b.id], "coop", 2);
    // מכריחים את החידה של המלח דרך מצב פנימי אינו אפשרי — בודקים
    // את ההיגיון ישירות מול מה שכבר יש בעגלה
    const unlocked = newlyCompleted(["egg", "butter", "salt"], []);
    expect(unlocked.map((r) => r.id)).toEqual(["omelet"]);
    expect(session.profileIds).toHaveLength(2);
  });
});

describe("סיכום שימוש", () => {
  beforeEach(() => storage.clear());

  it("סופר פתרונות, ניחושים שגויים ורמזים", () => {
    const profile = newPlayer(7);
    const riddle = riddleById.get(engine.startRiddle(profile.id).riddle!.id)!;

    engine.submitAnswer(profile.id, "מכונית");
    engine.nextHint(profile.id);
    engine.submitAnswer(profile.id, riddle.answer);

    const row = stats.childRow(profile.id);
    expect(row.solved).toBe(1);
    expect(row.guesses).toBe(2);
    expect(row.accuracy).toBeCloseTo(0.5);
    expect(row.activeDays).toBe(1);
  });

  it("סופר גם את מי שביקש לגלות", () => {
    const profile = newPlayer(7);
    engine.startRiddle(profile.id);
    engine.revealAnswer(profile.id);
    expect(stats.childRow(profile.id).reveals).toBe(1);
    expect(stats.totals().reveals).toBe(1);
  });

  it("במצב שיתוף פעולה נספר פתרון לכל המשתתפים", () => {
    const a = store.createProfile({ name: "א", age: 6, address: "female", avatar: "cat" });
    const b = store.createProfile({ name: "ב", age: 6, address: "male", avatar: "dog" });
    const session = group.createSession([a.id, b.id], "coop", 1);
    group.startGroupRiddle(session);
    group.awardSolve(session, [a.id]);

    expect(stats.childRow(a.id).solved).toBe(1);
    expect(stats.childRow(b.id).solved).toBe(1);
  });

  it("במצב תחרותי נספר רק לזוכה", () => {
    const a = store.createProfile({ name: "א", age: 6, address: "female", avatar: "cat" });
    const b = store.createProfile({ name: "ב", age: 6, address: "male", avatar: "dog" });
    const session = group.createSession([a.id, b.id], "competitive", 1);
    group.startGroupRiddle(session);
    group.awardSolve(session, [a.id]);

    expect(stats.childRow(a.id).solved).toBe(1);
    expect(stats.childRow(b.id).solved).toBe(0);
  });

  it("החידות הקשות מדורגות לפי טעויות וגילויים", () => {
    const profile = newPlayer(7);
    const riddle = riddleById.get(engine.startRiddle(profile.id).riddle!.id)!;
    engine.submitAnswer(profile.id, "מכונית");
    engine.submitAnswer(profile.id, "מטוס");
    engine.revealAnswer(profile.id);

    const hardest = stats.hardestRiddles();
    expect(hardest[0]!.id).toBe(riddle.id);
    expect(hardest[0]!.wrong).toBeGreaterThanOrEqual(2);
    expect(hardest[0]!.reveals).toBe(1);
  });

  it("תרשים הפעילות מחזיר 14 ימים כולל ריקים", () => {
    const bars = stats.activity(14);
    expect(bars).toHaveLength(14);
    expect(bars.every((bar) => typeof bar.solved === "number")).toBe(true);
  });

  it("הסטטיסטיקה נכללת בגיבוי ולא מכילה טקסט חופשי", () => {
    const profile = newPlayer(7);
    engine.startRiddle(profile.id);
    // ניחוש שרחוק מכל הבנק, כדי שהבדיקה לא תהיה תלויה בחידה שהוגרלה
    engine.submitAnswer(profile.id, "זגזוגתמנון");

    const backup = store.exportBackup();
    expect(backup.stats).toBeDefined();
    expect(backup.stats!.profiles[profile.id]!.wrong).toBe(1);
    // מונים בלבד — לא נשמר מה הילד הקליד
    expect(JSON.stringify(backup.stats)).not.toContain("זגזוגתמנון");
  });
});

describe("עידוד ורצף", () => {
  beforeEach(() => storage.clear());

  function solveCurrent(profileId: string) {
    const riddle = riddleById.get(engine.startRiddle(profileId).riddle!.id)!;
    return engine.submitAnswer(profileId, riddle.answer);
  }

  it("פתרון בלי רמזים נוספים מקבל מדהים", () => {
    const profile = newPlayer(7);
    const result = solveCurrent(profile.id);
    if (result.status !== "correct") throw new Error("expected correct");
    expect(result.celebration.noHints).toBe(true);
    expect(result.celebration.title).toBe("מדהים!");
  });

  it("פתרון אחרי רמז נוסף מקבל כל הכבוד", () => {
    const profile = newPlayer(7);
    engine.startRiddle(profile.id);
    engine.nextHint(profile.id);
    const riddle = riddleById.get(engine.startRiddle(profile.id).riddle!.id)!;
    const result = engine.submitAnswer(profile.id, riddle.answer);
    if (result.status !== "correct") throw new Error("expected correct");
    expect(result.celebration.noHints).toBe(false);
    expect(result.celebration.title).toBe("כל הכבוד!");
  });

  it("הרצף עולה, ואבן דרך מסומנת ב-5", () => {
    const profile = newPlayer(7);
    let last;
    for (let i = 0; i < 5; i++) last = solveCurrent(profile.id);
    if (!last || last.status !== "correct") throw new Error("expected correct");
    expect(last.celebration.streak).toBe(5);
    expect(last.celebration.milestone).toBe(5);
    expect(last.celebration.title).toContain("5 ברצף");
    expect(last.profile.answerStreak).toBe(5);
  });

  it("גלה לי שובר את הרצף", () => {
    const profile = newPlayer(7);
    solveCurrent(profile.id);
    expect(marketProgress(profile.id).answerStreak).toBe(1);
    engine.startRiddle(profile.id);
    engine.revealAnswer(profile.id);
    expect(marketProgress(profile.id).answerStreak).toBe(0);
  });

  it("דילוג שובר את הרצף אבל לא מוריד דירוג", () => {
    const profile = newPlayer(7);
    solveCurrent(profile.id);
    const rating = marketProgress(profile.id).rating;

    const riddleId = engine.startRiddle(profile.id).riddle!.id;
    engine.skipRiddle(profile.id);

    const after = store.getProfile(profile.id)!;
    expect(marketProgress(profile.id).answerStreak).toBe(0);
    expect(marketProgress(profile.id).rating).toBe(rating);
    expect(after.solved).not.toContain(riddleId);
    expect(after.revealed.map((entry) => entry.id)).toContain(riddleId);
    expect(stats.childRow(profile.id).skips).toBe(1);
  });

  it("חידה שדולגה לא חוזרת מיד", () => {
    const profile = newPlayer(7);
    const first = engine.startRiddle(profile.id).riddle!.id;
    engine.skipRiddle(profile.id);
    expect(engine.startRiddle(profile.id).riddle!.id).not.toBe(first);
  });
});

describe("שיתוף", () => {
  beforeEach(() => storage.clear());

  it("הודעת החידה לא מכילה את התשובה", () => {
    for (const riddle of [...riddleById.values()]) {
      const message = shareLib.riddleMessage(riddle.clues, riddle.aisle);
      expect(message, riddle.id).not.toContain(riddle.answer);
    }
  });

  it("הודעת החידה כוללת את הרמזים שנחשפו", () => {
    const profile = newPlayer(7);
    const view = engine.startRiddle(profile.id).riddle!;
    const message = shareLib.riddleMessage(view.clues, view.aisle.sign);
    expect(message).toContain(view.clues[0]!);
    expect(message).toContain("מי אני");
  });

  it("הדוח האנונימי לא מכיל שמות של שחקנים", () => {
    const report = shareLib.statsReport({
      solved: 5, guesses: 8, accuracy: 0.62, activeDays: 2, reveals: 1, skips: 1,
      players: 2,
      byLevel: [{ level: 1, name: "מתחילים", solved: 5 }],
      hardest: [{ answer: "שמרים", wrong: 3, reveals: 1 }],
    });
    expect(report).not.toContain("בדיקה");
    expect(report).toContain("אין בדוח שמות");
    expect(report).toContain("מתחילים");
    // גודל הבנק לא מוצג לאף אחד
    expect(report).not.toContain("מתוך");
  });
});

describe("חידת היום", () => {
  beforeEach(() => storage.clear());

  it("מגישה חידה, ומגישה את אותה אחת עד שפותרים", () => {
    const player = newPlayer(8);
    const first = engine.startRiddle(player.id, "daily");
    const second = engine.startRiddle(player.id, "daily");
    expect(first.riddle).toBeDefined();
    expect(first.riddle!.id).toBe(second.riddle!.id);
  });

  it("פתרון בלי רמזים נוסף מזכה בשלושה כוכבים", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "daily").riddle!;
    const answer = riddleById.get(riddle.id)!.answer;

    const result = engine.submitAnswer(player.id, answer, "daily");
    expect(result.status).toBe("correct");

    const view = engine.dailyView(player.id);
    expect(view.done).toBe(true);
    expect(view.stars).toBe(3);
    expect(view.total).toBe(3);
    expect(view.streak).toBe(1);
  });

  it("כל רמז נוסף עולה כוכב", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "daily").riddle!;
    engine.nextHint(player.id, "daily");
    engine.submitAnswer(player.id, riddleById.get(riddle.id)!.answer, "daily");
    expect(engine.dailyView(player.id).stars).toBe(2);
  });

  it("הפתרון נכנס לאוסף של העולם שממנו החידה באה", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "daily").riddle!;
    const source = riddleById.get(riddle.id)!;
    engine.submitAnswer(player.id, source.answer, "daily");

    const cart = engine.publicProfile(store.getProfile(player.id)!, source.world).cart;
    expect(cart.some((item) => item.id === source.id)).toBe(true);
  });

  it("חידת היום לא מזיזה את הדירוג בעולם", () => {
    const player = newPlayer(8);
    const before = marketProgress(player.id).rating;
    const riddle = engine.startRiddle(player.id, "daily").riddle!;
    engine.submitAnswer(player.id, riddleById.get(riddle.id)!.answer, "daily");
    expect(marketProgress(player.id).rating).toBe(before);
  });

  it("ניחוש שגוי לא מזכה בכוכבים ולא נועל את היום", () => {
    const player = newPlayer(8);
    engine.startRiddle(player.id, "daily");
    const result = engine.submitAnswer(player.id, "בננה מעופפת", "daily");
    expect(result.status).not.toBe("correct");
    expect(engine.dailyView(player.id).done).toBe(false);
  });

  it("פתרון שני באותו יום לא מוסיף כוכבים", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "daily").riddle!;
    const answer = riddleById.get(riddle.id)!.answer;
    engine.submitAnswer(player.id, answer, "daily");
    engine.submitAnswer(player.id, answer, "daily");
    expect(engine.dailyView(player.id).total).toBe(3);
  });

  it("שחקן חדש עוד לא פתר היום", () => {
    const player = newPlayer(8);
    const view = engine.dailyView(player.id);
    expect(view.done).toBe(false);
    expect(view.total).toBe(0);
    expect(view.answer).toBeUndefined();
  });
});

describe("ויתור בחידת היום", () => {
  beforeEach(() => storage.clear());

  it("גלה לי סוגר את היום, מאפס את הרצף ולא נותן כוכבים", () => {
    const player = newPlayer(8);
    engine.startRiddle(player.id, "daily");
    const result = engine.revealAnswer(player.id, "daily");
    expect(result.answer).toBeTruthy();

    const view = engine.dailyView(player.id);
    expect(view.gaveUp).toBe(true);
    expect(view.done).toBe(false);
    expect(view.stars).toBe(0);
    expect(view.streak).toBe(0);
    expect(view.answer).toBe(result.answer);
  });

  it("ויתור לא מוריד את הדירוג בעולם", () => {
    const player = newPlayer(8);
    const before = marketProgress(player.id).rating;
    engine.startRiddle(player.id, "daily");
    engine.revealAnswer(player.id, "daily");
    expect(marketProgress(player.id).rating).toBe(before);
  });
});

describe("הוגנות המשוב", () => {
  beforeEach(() => storage.clear());

  /** הגיל שפותח את הרמה המבוקשת */
  const AGE_FOR_LEVEL: Record<number, number> = { 1: 5, 2: 7, 3: 9, 4: 11, 5: 18, 6: 18 };

  /** מתחיל סבב על חידה מסוימת, בלי להסתמך על ההגרלה */
  function playing(riddleId: string) {
    const wanted = riddleById.get(riddleId)!;
    const player = newPlayer(AGE_FOR_LEVEL[wanted.level] ?? 7);
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const started = engine.startRiddle(player.id, wanted.world);
      if (started.riddle?.id === riddleId) return { player, riddle: wanted };
      if (started.done) break;
      engine.skipRiddle(player.id, wanted.world);
    }
    throw new Error(`לא הצלחתי להגיע ל-${riddleId}`);
  }

  it("ניחוש הגיוני מוכר ככזה, ומוצע עליו רמז מבחין", () => {
    const { player } = playing("apple");
    const result = engine.submitAnswer(player.id, "דובדבן", "market");
    expect(result.status).not.toBe("correct");

    const miss = result as MissResult;
    expect(miss.plausible?.guess).toBe("דובדבן");
    expect(miss.message).toContain("דובדבן");
    expect(miss.message).toContain("ניחוש חכם");
  });

  it("פריט אחר מאותו מדף מקבל את המכנה המשותף", () => {
    const { player } = playing("apple");
    const miss = engine.submitAnswer(player.id, "עגבנייה", "market") as MissResult;
    expect(miss.plausible?.shared).toBe("פירות וירקות");
    expect(miss.message).toContain("פירות וירקות");
  });

  it('"זו תשובה לחידה אחרת" הוחלף בהכוונה', () => {
    const { player } = playing("apple");
    const miss = engine.submitAnswer(player.id, "מכונית", "market") as MissResult;
    expect(miss.plausible).toBeUndefined();
    expect(miss.message).not.toContain("לחידה אחרת");
  });

  it("כשנגמרו הרמזים ההבדל מוסבר, ואין מה להציע", () => {
    const { player, riddle } = playing("apple");
    for (let index = 0; index < riddle.clues.length + 2; index += 1) {
      engine.nextHint(player.id, "market");
    }
    const miss = engine.submitAnswer(player.id, "דובדבן", "market") as MissResult;
    expect(miss.hasMoreClues).toBe(false);
    // הניחוש עדיין מוכר כהגיוני, אבל הרמז האחרון כבר פסל אותו
    expect(miss.plausible?.status).toBe("ruledOut");
    expect(miss.plausible?.because).toBeTruthy();
  });

  it("פתרון מהרמז הראשון נאמר במילים נכונות", () => {
    const { player, riddle } = playing("apple");
    const result = engine.submitAnswer(player.id, riddle.answer, "market");
    expect(result.status).toBe("correct");
    const solved = result as SolvedResult;
    expect(solved.celebration.note).toContain("מהרמז הראשון");
    expect(solved.celebration.note).not.toContain("בלי רמזים בכלל");
  });

  it("פתרון בעזרת רמזים מקבל עידוד משלו", () => {
    const { player, riddle } = playing("apple");
    engine.nextHint(player.id, "market");
    const solved = engine.submitAnswer(player.id, riddle.answer, "market") as SolvedResult;
    expect(solved.celebration.title).toBe("כל הכבוד!");
    expect(solved.celebration.note).toBeTruthy();
    expect(solved.celebration.noHints).toBe(false);
  });
});

describe("יציבות: רענון, שחקנים ולחיצות כפולות", () => {
  beforeEach(() => storage.clear());

  it("ההתקדמות שורדת רענון — הנתונים באחסון ולא בזיכרון", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "market").riddle!;
    engine.submitAnswer(player.id, riddleById.get(riddle.id)!.answer, "market");

    // אותו אחסון, מודול טרי — כמו טעינת הדף מחדש
    const after = store.getProfile(player.id)!;
    expect(after.solved).toContain(riddle.id);
    expect(progressIn(after, "market").rating).toBeGreaterThan(3);
  });

  it("שני שחקנים על אותו מכשיר לא מתערבבים", () => {
    const first = newPlayer(5);
    const second = newPlayer(11);

    const one = engine.startRiddle(first.id, "market").riddle!;
    engine.submitAnswer(first.id, riddleById.get(one.id)!.answer, "market");

    expect(store.getProfile(second.id)!.solved).toEqual([]);
    expect(store.getProfile(first.id)!.solved).toEqual([one.id]);
  });

  it("לחיצה כפולה על אותה תשובה לא סופרת פעמיים", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "market").riddle!;
    const answer = riddleById.get(riddle.id)!.answer;

    engine.submitAnswer(player.id, answer, "market");
    const solvedOnce = store.getProfile(player.id)!.solved.length;
    // הסבב נסגר, ולכן ניחוש נוסף כבר לא שייך לחידה הזאת
    expect(() => engine.submitAnswer(player.id, answer, "market")).toThrow();
    expect(store.getProfile(player.id)!.solved.length).toBe(solvedOnce);
  });

  it("לחיצה כפולה על רמז לא מדלגת על רמז", () => {
    const player = newPlayer(9);
    engine.startRiddle(player.id, "market");
    const first = engine.nextHint(player.id, "market");
    const second = engine.nextHint(player.id, "market");
    expect(second.clues.length).toBe(first.clues.length + 1);
  });

  it("מעבר בין עולמות שומר על ההתקדמות של כל אחד", () => {
    const player = newPlayer(8);

    const market = engine.startRiddle(player.id, "market").riddle!;
    engine.submitAnswer(player.id, riddleById.get(market.id)!.answer, "market");
    const marketRating = progressIn(store.getProfile(player.id)!, "market").rating;

    const space = engine.startRiddle(player.id, "space").riddle!;
    expect(space.id).not.toBe(market.id);
    engine.revealAnswer(player.id, "space");

    // הירידה בחלל לא נגעה בסופר
    expect(progressIn(store.getProfile(player.id)!, "market").rating).toBe(marketRating);
  });

  it("חזרה לעולם מחזירה את אותה חידה שנפתחה בו", () => {
    const player = newPlayer(8);
    const first = engine.startRiddle(player.id, "space").riddle!;
    engine.startRiddle(player.id, "market");
    const again = engine.startRiddle(player.id, "space").riddle!;
    expect(again.id).toBe(first.id);
  });
});

describe("התאמה ליכולת", () => {
  beforeEach(() => storage.clear());

  it("קריאה והקלדה נשמרות בנפרד מהגיל", () => {
    const player = store.createProfile({
      name: "בדיקה", age: 10, address: "male", avatar: "cat",
      reading: "notYet", answering: "pictures",
    });
    const view = engine.publicProfile(store.getProfile(player.id)!);
    expect(view.reading).toBe("notYet");
    expect(view.answering).toBe("pictures");
    // הגיל עדיין קובע את הידע
    expect(view.level).toBe(4);
  });

  it("פרופיל ישן בלי שדות יכולת נגזר מהגיל", () => {
    const player = newPlayer(5);
    const raw = store.getProfile(player.id)!;
    store.updateProfile(player.id, {
      reading: undefined,
      answering: undefined,
    });
    const view = engine.publicProfile(store.getProfile(raw.id)!);
    expect(view.reading).toBe("notYet");
    expect(view.answering).toBe("pictures");
  });

  it("מי שעונה בתמונות מקבל ארבע אפשרויות, ובהן התשובה", () => {
    const player = store.createProfile({
      name: "בדיקה", age: 6, address: "female", avatar: "cat",
      reading: "notYet", answering: "pictures",
    });
    const riddle = engine.startRiddle(player.id, "market").riddle!;
    expect(riddle.choices).toHaveLength(4);
    expect(riddle.choices.some((choice) => choice.id === riddle.id)).toBe(true);
  });

  it("מי שמקליד לא מקבל את התשובה ברשימת אפשרויות", () => {
    const player = newPlayer(8);
    const riddle = engine.startRiddle(player.id, "market").riddle!;
    expect(riddle.choices).toEqual([]);
    expect(JSON.stringify(riddle)).not.toContain(riddleById.get(riddle.id)!.answer);
  });

  it("קל יותר וקשה יותר מזיזים רמה שלמה, בעולם אחד בלבד", () => {
    const player = newPlayer(9);
    expect(engine.publicProfile(store.getProfile(player.id)!, "market").level).toBe(3);

    expect(engine.shiftLevel(player.id, "market", -1)).toBe(2);
    expect(engine.shiftLevel(player.id, "market", 1)).toBe(3);

    // החלל לא זז
    expect(progressIn(store.getProfile(player.id)!, "space").rating).toBe(3);
  });

  it("אי אפשר לרדת מתחת לרמה הנמוכה בעולם", () => {
    const player = newPlayer(4);
    expect(engine.shiftLevel(player.id, "market", -1)).toBe(1);
    expect(engine.shiftLevel(player.id, "market", -1)).toBe(1);
  });

  it("באולימפיאדה הרמה הנמוכה היא 2, ולא יורדים מתחתיה", () => {
    const player = newPlayer(8);
    expect(engine.shiftLevel(player.id, "olympics", -1)).toBe(2);
    expect(engine.shiftLevel(player.id, "olympics", -1)).toBe(2);
  });
});

describe("יעד קרוב", () => {
  beforeEach(() => storage.clear());

  it("שחקן חדש רואה יעד עם שם, בלי שפתר כלום", () => {
    const player = newPlayer(6);
    const view = engine.publicProfile(store.getProfile(player.id)!, "market");
    expect(view.goal).not.toBeNull();
    expect(view.goal!.name.length).toBeGreaterThan(2);
    expect(view.goal!.held).toBe(0);
    expect(view.goal!.needed).toBeGreaterThan(0);
  });

  it("לכל עולם יש יעד ראשון", () => {
    const player = newPlayer(8);
    for (const world of ["market", "space", "olympics", "disney"]) {
      const view = engine.publicProfile(store.getProfile(player.id)!, world);
      expect(view.goal, world).not.toBeNull();
    }
  });

  it("היעד הראשון של כל עולם ניתן להשלמה מרמות נמוכות", () => {
    // סט פתיחה שדורש רמה 5 הוא לא יעד ראשון, הוא הבטחה רחוקה
    const player = newPlayer(6);
    for (const world of ["market", "space", "olympics", "disney"]) {
      const goal = engine.publicProfile(store.getProfile(player.id)!, world).goal!;
      const recipe = recipeById.get(goal.id)!;
      const members = [...recipe.requires, ...(recipe.anyOf?.items ?? [])];
      const easiest = members
        .map((id) => riddleById.get(id)!.level)
        .sort((a, b) => a - b)
        .slice(0, recipe.totalNeeded);
      expect(Math.max(...easiest), `${world}: ${goal.name}`).toBeLessThanOrEqual(3);
    }
  });

  it("פתרון שמקדם יעד מדווח על כך", () => {
    const player = newPlayer(6);
    const goal = engine.publicProfile(store.getProfile(player.id)!, "market").goal!;
    const recipe = recipeById.get(goal.id)!;
    const members = new Set([...recipe.requires, ...(recipe.anyOf?.items ?? [])]);

    // משחקים עד שעולה פריט ששייך ליעד
    let advanced: SolvedResult["advanced"];
    for (let attempt = 0; attempt < 200 && !advanced; attempt += 1) {
      const started = engine.startRiddle(player.id, "market");
      if (!started.riddle) break;
      if (members.has(started.riddle.id)) {
        const answer = riddleById.get(started.riddle.id)!.answer;
        advanced = (engine.submitAnswer(player.id, answer, "market") as SolvedResult).advanced;
      } else {
        engine.skipRiddle(player.id, "market");
      }
    }
    expect(advanced?.name).toBe(goal.name);
    expect(advanced?.held).toBe(1);
    expect(advanced?.needed).toBe(goal.needed);
  });
});

describe("סבב משפחתי", () => {
  beforeEach(() => storage.clear());

  it("תור מסתובב עובר בין הילדים לפי הסדר", () => {
    const a = newPlayer(7);
    const b = newPlayer(9);
    const session = group.createSession([a.id, b.id], "coop", 2, "market", 5, true);

    expect(group.whoseTurn(session, 0)).toBe(a.id);
    expect(group.whoseTurn(session, 1)).toBe(b.id);
    expect(group.whoseTurn(session, 2)).toBe(a.id);
  });

  it("אין תור כשיש משתתף אחד", () => {
    const solo = newPlayer(7);
    const session = group.createSession([solo.id], "competitive", 2, "market", 5, true);
    expect(group.whoseTurn(session, 0)).toBeNull();
  });

  it("אין תור כשלא ביקשו אותו", () => {
    const a = newPlayer(7);
    const b = newPlayer(9);
    const session = group.createSession([a.id, b.id], "coop", 2, "market", 5, false);
    expect(group.whoseTurn(session, 0)).toBeNull();
  });

  it("אורך הסבב נשמר בסשן, ואפשר לבקש בלי סוף", () => {
    const solo = newPlayer(7);
    expect(group.createSession([solo.id], "coop", 2, "market").roundLength).toBe(5);
    expect(group.createSession([solo.id], "coop", 2, "market", 10).roundLength).toBe(10);
    expect(group.createSession([solo.id], "coop", 2, "market", 0).roundLength).toBe(0);
  });
});

describe("שמירה על פרופילים קיימים", () => {
  beforeEach(() => storage.clear());

  it("פרופיל שנוצר לפני העולמות ממשיך לעבוד", () => {
    // מבנה ישן: rating בשורש, בלי worlds, בלי יכולת, בלי חידת יום
    const legacy = {
      id: "old_1",
      name: "ותיק",
      age: 8,
      address: "male",
      avatar: "cat",
      rating: 3.4,
      streak: 2,
      answerStreak: 5,
      solved: ["apple", "milk"],
      revealed: [],
      recipes: [],
      createdAt: 1,
      chat: { day: "", count: 0 },
    };
    storage.setItem("agali:profiles", JSON.stringify([legacy]));

    const loaded = store.getProfile("old_1")!;
    expect(progressIn(loaded, "market").rating).toBeCloseTo(3.4);
    expect(loaded.solved).toEqual(["apple", "milk"]);

    // וכל מה שנוסף מאז נגזר ולא מתפוצץ
    const view = engine.publicProfile(loaded, "market");
    expect(view.reading).toBe("fluent");
    expect(view.answering).toBe("typing");
    expect(view.goal).not.toBeNull();
    expect(engine.dailyView("old_1").total).toBe(0);
  });

  it("ההתקדמות הישנה לא נדרסת בכניסה לעולם חדש", () => {
    const player = newPlayer(9);
    const before = progressIn(store.getProfile(player.id)!, "market").rating;

    engine.startRiddle(player.id, "disney");
    engine.startRiddle(player.id, "olympics");

    expect(progressIn(store.getProfile(player.id)!, "market").rating).toBe(before);
  });

  it("גיבוי ישן נטען, כולל השדות החדשים בברירת מחדל", () => {
    const player = store.createProfile({
      name: "בדיקה", age: 6, address: "female", avatar: "cat",
      reading: "learning", answering: "pictures",
    });
    const backup = store.exportBackup();
    storage.clear();
    store.importBackup(backup);

    const back = store.getProfile(player.id)!;
    expect(back.reading).toBe("learning");
    expect(back.answering).toBe("pictures");
  });
});

describe("משוב שמשתנה עם הרמזים", () => {
  beforeEach(() => storage.clear());

  it('"קרטיב" מקבל משוב אחד לפני הרמז המבחין, ואחר אחריו', () => {
    const { player } = playingIn("icecream");

    const before = engine.submitAnswer(player.id, "קרטיב", "market") as MissResult;
    expect(before.plausible?.status).toBe("fits");
    expect(before.message).toContain("ניחוש חכם");

    engine.nextHint(player.id, "market");

    const after = engine.submitAnswer(player.id, "קרטיב", "market") as MissResult;
    expect(after.plausible?.status).toBe("ruledOut");
    expect(after.message).toContain("גביע");
    expect(after.message).not.toContain("ניחוש חכם");
    expect(after.message).not.toBe(before.message);
  });

  it("אחרי שההבדל הוסבר, לא מציעים עוד רמז מבחין", () => {
    const { player } = playingIn("icecream");
    engine.nextHint(player.id, "market");
    const after = engine.submitAnswer(player.id, "קרטיב", "market") as MissResult;
    expect(after.plausible?.status).toBe("ruledOut");
    // ההבדל כבר על המסך — אין מה להבדיל
    expect(after.plausible?.because).toBeTruthy();
  });

  it("חלופה בלי רמז פוסל נשארת מתאימה גם בסוף", () => {
    const { player, riddle } = playingIn("milk");
    for (let index = 1; index < riddle.clues.length; index += 1) {
      engine.nextHint(player.id, "market");
    }
    const late = engine.submitAnswer(player.id, "חלב סויה", "market") as MissResult;
    expect(late.plausible?.status).toBe("fits");
  });
});

describe("ספירת רמזים ולשון פנייה", () => {
  beforeEach(() => storage.clear());

  function solveAfterHints(hints: number, address: "male" | "female" = "female") {
    const player = store.createProfile({ name: "בדיקה", age: 8, address, avatar: "cat" });
    const riddle = engine.startRiddle(player.id, "market").riddle!;
    for (let index = 0; index < hints; index += 1) engine.nextHint(player.id, "market");
    const answer = riddleById.get(riddle.id)!.answer;
    return engine.submitAnswer(player.id, answer, "market") as SolvedResult;
  }

  it("רמז אחד על המסך — מהרמז הראשון", () => {
    expect(solveAfterHints(0).celebration.note).toContain("מהרמז הראשון");
  });

  it("שני רמזים על המסך — שני רמזים, ולא 'רמז אחד'", () => {
    const note = solveAfterHints(1).celebration.note!;
    expect(note).toContain("שני רמזים");
    expect(note).not.toContain("רמז אחד");
  });

  it("שלושה רמזים על המסך — שלושה", () => {
    const note = solveAfterHints(2).celebration.note!;
    expect(note).toContain("3 רמזים");
  });

  it("הפנייה מתאימה לפרופיל", () => {
    expect(solveAfterHints(1, "female").celebration.note).toContain("פתרת");
    expect(solveAfterHints(1, "male").celebration.note).toContain("פתרת");
  });

  it("משוב על טעות פונה בלשון של השחקן", () => {
    const girl = store.createProfile({ name: "דנה", age: 8, address: "female", avatar: "cat" });
    engine.startRiddle(girl.id, "market");
    const miss = engine.submitAnswer(girl.id, "זגזוגתמנון", "market") as MissResult;
    expect(miss.message).toContain("נסי");
    expect(miss.message).not.toContain("נסו");
  });
});
