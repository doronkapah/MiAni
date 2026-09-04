import { useEffect, useRef, useState } from "react";
import { Agali } from "../art/Agali";
import { askAgali } from "../game/chat";

interface Message {
  role: "user" | "agali";
  text: string;
}

const SUGGESTIONS = ["זה מתוק?", "זה במקרר?", "אפשר לאכול את זה?", "עוד רמז קטן?"];

export function Chat({
  profileId,
  greeting,
  enabled,
  chatLeft,
  onQuotaChange,
  onClose,
  onParentPanel,
}: {
  profileId: string;
  greeting: string;
  enabled: boolean;
  chatLeft: number;
  onQuotaChange: (left: number) => void;
  onClose: () => void;
  onParentPanel: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([{ role: "agali", text: greeting }]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || streaming || !enabled) return;

    setDraft("");
    setMessages((current) => [...current, { role: "user", text: message }, { role: "agali", text: "" }]);
    setStreaming(true);

    try {
      await askAgali(profileId, message, (event) => {
        if (event.text) {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1]!;
            next[next.length - 1] = { ...last, text: last.text + event.text };
            return next;
          });
        }
        if (event.replace) {
          setMessages((current) => {
            const next = [...current];
            next[next.length - 1] = { role: "agali", text: event.replace! };
            return next;
          });
        }
        if (event.error) {
          setMessages((current) => {
            const next = [...current];
            next[next.length - 1] = { role: "agali", text: event.error! };
            return next;
          });
        }
        if (typeof event.chatLeft === "number") onQuotaChange(event.chatLeft);
      });
    } finally {
      setStreaming(false);
      setMessages((current) => {
        const last = current[current.length - 1];
        if (last && last.role === "agali" && !last.text) {
          return [...current.slice(0, -1), { role: "agali", text: "לא הצלחתי לענות. ננסה שוב?" }];
        }
        return current;
      });
    }
  }

  return (
    <section className="chat" aria-label="שיחה עם עגלי">
      <header className="chat-head">
        <Agali size={56} mood={streaming ? "thinking" : "happy"} />
        <div>
          <strong>עגלי</strong>
          <span className="chat-quota">
            {enabled ? `נשארו ${chatLeft} שאלות היום` : "לא זמין כרגע"}
          </span>
        </div>
        <button className="btn ghost small" onClick={onClose}>
          סגירה
        </button>
      </header>

      <div className="chat-log" ref={scrollRef}>
        {messages.map((message, index) => (
          <div key={index} className={`bubble ${message.role}`}>
            {message.text || <span className="dots" aria-label="עגלי חושב" />}
          </div>
        ))}
      </div>

      {enabled && (
        <>
          <div className="chat-suggest">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="chip small"
                onClick={() => send(suggestion)}
                disabled={streaming}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="שאלו את עגלי…"
              maxLength={200}
              disabled={streaming}
            />
            <button className="btn primary" type="submit" disabled={streaming || !draft.trim()}>
              שליחה
            </button>
          </form>
        </>
      )}

      {!enabled && (
        <div className="chat-disabled">
          <p>
            עגלי כבוי. כדי להפעיל אותו צריך מפתח API של Anthropic — המשחק עצמו עובד
            מצוין גם בלעדיו.
          </p>
          <button className="btn small" onClick={onParentPanel}>
            פתיחת לוח ההורים
          </button>
        </div>
      )}
    </section>
  );
}
