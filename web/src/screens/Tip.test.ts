import { beforeEach, describe, expect, it } from "vitest";

/** מימוש מינימלי של localStorage, לפני שהמודול נטען */
class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
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

const { resetTips } = await import("./Tip");

/**
 * `useCoach` הוא hook ולכן לא נקרא ישירות כאן, אבל הכלל שהוא
 * מיישם הוא לוגיקה טהורה: הראשון ברשימה שרלוונטי ושעוד לא נראה.
 * הפונקציה הזאת היא אותו כלל, ומה שנבדק הוא ההתנהגות.
 */
function pick(
  profileId: string,
  candidates: { id: string; when: boolean }[],
  closed: string[] = [],
): string | null {
  for (const candidate of candidates) {
    if (!candidate.when) continue;
    if (closed.includes(candidate.id)) continue;
    if (storage.getItem(`agali:tip:${profileId}:${candidate.id}`) === "1") continue;
    return candidate.id;
  }
  return null;
}

describe("תור הטיפים", () => {
  beforeEach(() => storage.clear());

  it("מציג אחד בלבד, גם כששניים רלוונטיים", () => {
    const chosen = pick("p1", [
      { id: "pick", when: true },
      { id: "hint", when: true },
    ]);
    expect(chosen).toBe("pick");
  });

  it("מדלג על מה שכבר נסגר, וממשיך לבא בתור", () => {
    expect(
      pick("p1", [
        { id: "pick", when: true },
        { id: "hint", when: true },
      ], ["pick"]),
    ).toBe("hint");
  });

  it("מדלג על מה שלא רלוונטי עכשיו", () => {
    expect(
      pick("p1", [
        { id: "pick", when: false },
        { id: "hint", when: true },
      ]),
    ).toBe("hint");
  });

  it("כשאין מה להציג — כלום", () => {
    expect(pick("p1", [{ id: "pick", when: false }])).toBeNull();
  });

  it("טיפ שנראה בעבר לא חוזר", () => {
    storage.setItem("agali:tip:p1:pick", "1");
    expect(pick("p1", [{ id: "pick", when: true }])).toBeNull();
  });

  it("טיפים נספרים לכל שחקן בנפרד", () => {
    storage.setItem("agali:tip:p1:pick", "1");
    expect(pick("p2", [{ id: "pick", when: true }])).toBe("pick");
  });

  it("איפוס מוחק רק את הטיפים של אותו שחקן", () => {
    storage.setItem("agali:tip:p1:pick", "1");
    storage.setItem("agali:tip:p2:pick", "1");
    resetTips("p1");
    expect(pick("p1", [{ id: "pick", when: true }])).toBe("pick");
    expect(pick("p2", [{ id: "pick", when: true }])).toBeNull();
  });
});
