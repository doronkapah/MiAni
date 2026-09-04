/**
 * השרת המקומי — אופציונלי לגמרי.
 *
 * המשחק עצמו רץ כולו בדפדפן, וכל הנתונים נשארים ב-localStorage.
 * השרת הזה עושה רק שני דברים:
 *   1. מגיש את האתר הבנוי, כדי שאפשר יהיה לשחק מכל מכשיר בבית.
 *   2. מחזיק את מפתח ה-API ב-.env ומעביר את הזרם לעגלי, כדי שלא
 *      צריך להדביק מפתח בדפדפן.
 *
 * בלי השרת המשחק עדיין עובד: מארחים את dist-web על כל CDN סטטי,
 * וכל משתמש מכניס את המפתח שלו בלוח ההורים.
 */

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ANTHROPIC_API_KEY, HAS_API_KEY, IS_PRODUCTION, PORT } from "./lib/config";
import { findModel } from "../shared/models";
import { riddles } from "../shared/bank";

const here = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.join(here, "..", "dist-web");

const app = Fastify({
  logger: { level: IS_PRODUCTION ? "warn" : "info" },
  bodyLimit: 256 * 1024,
});

const client = HAS_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

/** הדפדפן שואל בטעינה אם יש כאן שרת עם מפתח */
app.get("/api/config", async () => ({
  serverKey: HAS_API_KEY,
  riddleCount: riddles.length,
}));

const proxySchema = z.object({
  model: z.string().min(1),
  supportsEffort: z.boolean(),
  system: z.array(z.object({ type: z.literal("text"), text: z.string() }).passthrough()),
  messages: z.array(
    z.object({ role: z.enum(["user", "assistant"]), content: z.string() }),
  ),
});

/**
 * פרוקסי חסר מצב. הוא לא יודע דבר על החידה, על הפרופיל או על
 * ההתקדמות — הוא רק מוסיף את המפתח ומעביר את הזרם הלאה.
 * מסנן התשובה רץ בדפדפן, כמו במסלול הישיר.
 */
app.post("/api/chat", async (request, reply) => {
  if (!client) {
    return reply.status(503).send({
      error: "אין ANTHROPIC_API_KEY בקובץ .env של השרת.",
    });
  }

  const parsed = proxySchema.safeParse(request.body);
  if (!parsed.success) return reply.status(400).send({ error: "בקשה לא תקינה" });

  const model = findModel(parsed.data.model);
  if (!model) return reply.status(400).send({ error: "מודל לא מוכר" });

  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const send = (payload: Record<string, unknown>) =>
    reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);

  try {
    const stream = client.messages.stream({
      model: model.id,
      max_tokens: 400,
      ...(model.supportsEffort ? { output_config: { effort: "low" as const } } : {}),
      system: parsed.data.system as never,
      messages: parsed.data.messages,
    });

    for await (const event of stream) {
      if (event.type === "message_start") {
        const usage = event.message.usage;
        send({
          usage: {
            input: usage.input_tokens ?? 0,
            cacheRead: usage.cache_read_input_tokens ?? 0,
            cacheWrite: usage.cache_creation_input_tokens ?? 0,
          },
        });
      }
      if (event.type === "message_delta") {
        send({ usage: { output: event.usage.output_tokens ?? 0 } });
      }
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send({ text: event.delta.text });
      }
    }
  } catch (error) {
    app.log.error({ error }, "chat proxy failed");
    send({ error: "השרת לא הצליח להשלים את התשובה." });
  } finally {
    reply.raw.end();
  }
});

// בייצור השרת מגיש גם את האתר הבנוי; בפיתוח Vite עושה את זה
const hasBuild = fs.existsSync(WEB_DIST);
if (hasBuild) {
  await app.register(fastifyStatic, { root: WEB_DIST });
  app.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.status(404).send({ error: "לא נמצא" });
    }
    return reply.sendFile("index.html");
  });
}

const address = await app.listen({ port: PORT, host: "0.0.0.0" });

console.log(
  [
    "",
    "  🛒  חידות הסופר של עגלי — שרת מקומי",
    `      ${riddles.length} חידות בבנק`,
    `      מפתח API בשרת: ${HAS_API_KEY ? "יש" : "אין (המשתמש יכניס משלו בלוח ההורים)"}`,
    hasBuild ? `      המשחק: ${address}` : "      המשחק: http://localhost:5173  (vite רץ בנפרד)",
    "",
    "      כל הנתונים של השחקנים נשמרים בדפדפן, לא כאן.",
    "",
  ].join("\n"),
);
