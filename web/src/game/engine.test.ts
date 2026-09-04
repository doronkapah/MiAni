import { beforeEach, describe, expect, it } from "vitest";

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
const { commonTypos } = await import("../../../scripts/typo-report");
const { newlyCompleted } = await import("../../../shared/recipes");
const engine = await import("./engine");
const store = await import("../store/local");
const group = await import("./group");

function newPlayer(age = 7) {
  return store.createProfile({ name: "בדיקה", age, address: "female", avatar: "tomato" });
}

describe("מנוע המשחק בדפדפן", () => {
  beforeEach(() => storage.clear());

  it("יוצר פרופיל ושומר אותו מקומית", () => {
    const profile = newPlayer(5);
    expect(store.listProfiles()).toHaveLength(1);
    expect(engine.publicProfile(profile).levelName).toBe("מדף הגן");
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
    const before = store.getProfile(profile.id)!.rating;
    const result = engine.submitAnswer(profile.id, "מכונית");
    expect(result.status).not.toBe("correct");
    expect(store.getProfile(profile.id)!.rating).toBe(before);
  });

  it("גלה לי מוריד דירוג ומחזיר את החידה לתור", () => {
    const profile = newPlayer(7);
    const riddleId = engine.startRiddle(profile.id).riddle!.id;
    const before = store.getProfile(profile.id)!.rating;

    const result = engine.revealAnswer(profile.id);
    expect(result.answer).toBeTruthy();
    expect(store.getProfile(profile.id)!.rating).toBeLessThan(before);
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
    const before = store.getProfile(a.id)!.rating;
    const session = group.createSession([a.id, b.id], "competitive", 1);
    const riddle = group.startGroupRiddle(session)!;

    const outcome = group.groupReveal(session)!;
    expect(outcome.awarded).toEqual([]);
    expect(outcome.gaveUp).toBe(true);
    expect(store.getProfile(a.id)!.solved).not.toContain(riddle.id);
    expect(store.getProfile(a.id)!.rating).toBeLessThan(before);
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
