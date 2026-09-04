/**
 * השיחה עם עגלי.
 *
 * שני מסלולים, אותה לוגיקה:
 *   direct — הדפדפן פונה ישירות ל-api.anthropic.com עם המפתח של
 *            המשתמש. זה מה שמאפשר לארח את המשחק כאתר סטטי בלי שרת.
 *   server — השרת המקומי מחזיק את המפתח ב-.env והדפדפן פונה אליו,
 *            כדי שלא צריך להדביק מפתח בדפדפן בכלל.
 *
 * מסנן התשובה רץ בדפדפן בשני המסלולים, לפני שמשהו מוצג על המסך.
 */

import { riddleById } from "../../../shared/bank";
import { AGALI_RULES, turnContext } from "../../../shared/prompt";
import { AnswerRedactor, REDACTED_REPLY } from "../../../shared/redactor";
import { findModel, type TokenCounts } from "../../../shared/models";
import * as store from "../store/local";
import { getRound, pushHistory } from "./engine";

export interface ChatEvent {
  text?: string;
  /** מחליף את כל מה שנשלח עד כה — כשהמסנן עצר את התשובה */
  replace?: string;
  done?: boolean;
  error?: string;
  chatLeft?: number;
}

interface Delta {
  text?: string;
  usage?: Partial<TokenCounts>;
}

interface Request {
  model: string;
  supportsEffort: boolean;
  system: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[];
  messages: { role: "user" | "assistant"; content: string }[];
  apiKey: string;
}

/**
 * הדפדפן מדבר ישירות מול Anthropic.
 * ה-SDK נטען בעצלתיים, כדי שמי שלא משתמש בצ'אט לא ישלם עליו בטעינה.
 */
async function streamDirect(request: Request, onDelta: (delta: Delta) => void) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({
    apiKey: request.apiKey,
    // הכרחי לקריאה מהדפדפן. ה-SDK מוסיף בעצמו את הכותרת
    // anthropic-dangerous-direct-browser-access.
    dangerouslyAllowBrowser: true,
  });

  const stream = client.messages.stream({
    model: request.model,
    max_tokens: 400,
    // Haiku 4.5 מחזיר שגיאה על הפרמטר הזה, ולכן הוא מותנה
    ...(request.supportsEffort ? { output_config: { effort: "low" as const } } : {}),
    system: request.system,
    messages: request.messages,
  });

  for await (const event of stream) {
    if (event.type === "message_start") {
      const usage = event.message.usage;
      onDelta({
        usage: {
          input: usage.input_tokens ?? 0,
          cacheRead: usage.cache_read_input_tokens ?? 0,
          cacheWrite: usage.cache_creation_input_tokens ?? 0,
        },
      });
    }
    if (event.type === "message_delta") {
      onDelta({ usage: { output: event.usage.output_tokens ?? 0 } });
    }
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      onDelta({ text: event.delta.text });
    }
  }
}

/** השרת המקומי מחזיק את המפתח ומעביר את הזרם הלאה */
async function streamViaServer(request: Request, onDelta: (delta: Delta) => void) {
  const response = await fetch(`${import.meta.env.BASE_URL}api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: request.model,
      supportsEffort: request.supportsEffort,
      system: request.system,
      messages: request.messages,
    }),
  });

  if (!response.ok || !response.body) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "השרת המקומי לא הצליח לענות");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim()) as Delta & { error?: string };
        if (payload.error) throw new Error(payload.error);
        onDelta(payload);
      } catch (error) {
        if (error instanceof Error && error.message) throw error;
      }
    }
  }
}

/**
 * שולח שאלה לעגלי ומזרים את התשובה.
 * מנהל בעצמו את התקרה היומית, את היסטוריית השיחה ואת מסנן התשובה.
 */
export async function askAgali(
  profileId: string,
  message: string,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  const profile = store.getProfile(profileId);
  const round = getRound(profileId);
  const riddle = round && riddleById.get(round.riddleId);
  const settings = store.getSettings();

  if (!profile || !round || !riddle) {
    onEvent({ error: "אין חידה פעילה", done: true });
    return;
  }

  if (settings.chatSource === "off") {
    onEvent({ error: "עגלי כבוי. אפשר להדליק אותו בלוח ההורים.", done: true });
    return;
  }

  if (settings.chatSource === "direct" && !settings.apiKey) {
    onEvent({
      error: "כדי לדבר עם עגלי צריך להוסיף מפתח API בלוח ההורים.",
      done: true,
    });
    return;
  }

  const left = store.consumeChatQuota(profile, settings.dailyLimit);
  if (left === null) {
    onEvent({
      error: "אני צריך לסדר מדפים 🛒 נדבר מחר! בינתיים אפשר לבקש עוד רמז.",
      done: true,
    });
    return;
  }

  pushHistory(round, "user", message);

  const model = findModel(settings.model)!;
  const request: Request = {
    model: model.id,
    supportsEffort: model.supportsEffort,
    apiKey: settings.apiKey,
    system: [
      // החלק הקבוע נשמר במטמון בין קריאות
      { type: "text", text: AGALI_RULES, cache_control: { type: "ephemeral" } },
      { type: "text", text: turnContext(profile, riddle, round.cluesRevealed) },
    ],
    messages: round.history.map((turn) => ({ role: turn.role, content: turn.content })),
  };

  const redactor = new AnswerRedactor([
    riddle.answer,
    riddle.answerNikud,
    ...riddle.aliases,
  ]);

  const tokens: TokenCounts = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let full = "";

  const onDelta = (delta: Delta) => {
    if (delta.usage) {
      tokens.input += delta.usage.input ?? 0;
      tokens.output += delta.usage.output ?? 0;
      tokens.cacheRead += delta.usage.cacheRead ?? 0;
      tokens.cacheWrite += delta.usage.cacheWrite ?? 0;
    }
    if (delta.text) {
      // אחרי שהמסנן נסגר ממשיכים לקרוא את הזרם אבל לא מציגים כלום,
      // כדי לקבל את נתוני הצריכה האמיתיים בסוף.
      const safe = redactor.push(delta.text);
      if (safe) {
        full += safe;
        onEvent({ text: safe });
      }
    }
  };

  try {
    if (settings.chatSource === "direct") await streamDirect(request, onDelta);
    else await streamViaServer(request, onDelta);

    store.recordUsage(model.id, tokens);

    if (redactor.tripped) {
      onEvent({ replace: REDACTED_REPLY });
      full = REDACTED_REPLY;
    } else {
      const rest = redactor.flush();
      if (rest) {
        full += rest;
        onEvent({ text: rest });
      }
    }

    pushHistory(round, "assistant", full || REDACTED_REPLY);
    onEvent({ done: true, chatLeft: left });
  } catch (error) {
    onEvent({ error: friendlyError(error), done: true });
  }
}

/** שגיאות API מתורגמות למשהו שהורה יכול לפעול לפיו */
function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|authentication|invalid.*api.*key/i.test(message)) {
    return "מפתח ה-API לא תקין. אפשר לבדוק אותו בלוח ההורים.";
  }
  if (/429|rate.?limit/i.test(message)) {
    return "יותר מדי בקשות כרגע. כדאי לחכות רגע ולנסות שוב.";
  }
  if (/credit|billing|quota/i.test(message)) {
    return "נראה שנגמר התקציב בחשבון ה-API. אפשר לבדוק ב-Anthropic Console.";
  }
  if (/fetch|network|failed to fetch/i.test(message)) {
    return "אין חיבור לאינטרנט, או שהחיבור נקטע.";
  }
  return "משהו השתבש אצלי בסופר. אפשר לנסות שוב עוד רגע.";
}
