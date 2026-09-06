import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * ההקראה תלויה במערכת ההפעלה, ולכן היא נבדקת מול מנוע מזויף.
 *
 * מה שנבדק כאן הוא ההתנהגות *סביב* הקול — מתי אומרים שהוא מוכן,
 * מתי מודים שאין קול עברי, ומה קורה כשאין מנוע בכלל. את הצליל
 * עצמו אי אפשר לבדוק כאן; הוא יוצא מהרמקול של המכשיר.
 */

type Voice = { lang: string; name: string };

let engine: ReturnType<typeof mockSynth>;

function mockSynth(voices: Voice[]) {
  return {
    getVoices: () => voices,
    speak: vi.fn(),
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

async function load(voices: Voice[] | null) {
  vi.resetModules();
  if (voices === null) {
    (globalThis as { window?: unknown }).window = {};
  } else {
    engine = mockSynth(voices);
    (globalThis as { window?: unknown }).window = { speechSynthesis: engine };
  }
  (globalThis as { SpeechSynthesisUtterance?: unknown }).SpeechSynthesisUtterance =
    class {
      constructor(public text: string) {}
      voice: unknown;
      lang = "";
      rate = 1;
      pitch = 1;
    };
  return import("./speech");
}

describe("מצב ההקראה", () => {
  beforeEach(() => vi.resetModules());

  it("קול עברי מותקן — מוכן", async () => {
    const speech = await load([{ lang: "he-IL", name: "Carmit" }]);
    expect(speech.voiceStatus()).toBe("ready");
    expect(speech.canSpeak()).toBe(true);
  });

  it("יש קולות, אבל אף אחד לא עברי — אומרים את זה", async () => {
    const speech = await load([{ lang: "en-US", name: "Samantha" }]);
    expect(speech.voiceStatus()).toBe("noHebrew");
    expect(speech.canSpeak()).toBe(false);
  });

  it("רשימה ריקה — עדיין נטענת, לא מתלוננים מוקדם", async () => {
    const speech = await load([]);
    expect(speech.voiceStatus()).toBe("loading");
  });

  it("דפדפן בלי מנוע דיבור בכלל", async () => {
    const speech = await load(null);
    expect(speech.voiceStatus()).toBe("unsupported");
    expect(speech.canSpeak()).toBe(false);
  });

  it("בלי קול עברי — speak לא זורק, פשוט שותק", async () => {
    const speech = await load([{ lang: "en-US", name: "Samantha" }]);
    expect(() => speech.speak("שלום")).not.toThrow();
    expect(engine.speak.mock.calls).toHaveLength(0);
  });

  it("עם קול עברי — speak מדבר, ומבטל מה שרץ קודם", async () => {
    const speech = await load([{ lang: "he-IL", name: "Carmit" }]);
    speech.speak("שלום");
    expect(engine.speak.mock.calls).toHaveLength(1);
    expect(engine.cancel.mock.calls).toHaveLength(1);
  });

  it("stopSpeaking בטוח גם בלי מנוע", async () => {
    const speech = await load(null);
    expect(() => speech.stopSpeaking()).not.toThrow();
  });
});
