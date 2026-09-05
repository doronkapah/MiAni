import { useEffect, useRef, useState } from "react";
import { MODELS } from "../../../shared/models";
import * as store from "../store/local";
import { usageSummaries } from "../game/usage";
import { probeServer, type ServerInfo } from "../game/server";
import { clearLog, formatTime, readLog, type LogEntry } from "../lib/log";
import { FEATURES } from "../config";
import { Terms } from "./Terms";

/**
 * לוח ההורים: יומן המשחק, גיבוי, ותנאי שימוש.
 *
 * החלק של עוזר הסופר — מפתח API, בחירת מודל ומעקב עלות — מוצג רק
 * כשהתכונה פעילה (web/src/config.ts). כרגע היא כבויה.
 *
 * לפני הכניסה יש שאלת חשבון קטנה — לא אבטחה, רק מספיק כדי
 * שילד בן שש לא ישנה בטעות את ההגדרות.
 */

function randomGate() {
  const a = 6 + Math.floor(Math.random() * 6);
  const b = 6 + Math.floor(Math.random() * 6);
  return { a, b, answer: a * b };
}

const money = (value: number) =>
  value === 0 ? "$0.00" : value < 0.01 ? "< $0.01" : `$${value.toFixed(2)}`;

const thousands = (value: number) => value.toLocaleString("he-IL");

export function ParentPanel({ onClose }: { onClose: () => void }) {
  const [gate] = useState(randomGate);
  const [guess, setGuess] = useState("");
  const [open, setOpen] = useState(false);

  const [settings, setSettings] = useState(store.getSettings);
  const [server, setServer] = useState<ServerInfo | null>(null);
  const [usage, setUsage] = useState(usageSummaries);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setEntries(readLog());
    if (FEATURES.agaliChat) {
      probeServer().then(setServer);
      setUsage(usageSummaries());
    }
  }, [open]);

  function patch(change: Partial<store.Settings>) {
    setSettings(store.updateSettings(change));
  }

  function saveKey() {
    const key = keyDraft.trim();
    if (!key) return;
    patch({ apiKey: key, chatSource: "direct" });
    setKeyDraft("");
    setNote("המפתח נשמר במכשיר הזה בלבד.");
  }

  function clearKey() {
    patch({ apiKey: "", chatSource: server?.serverKey ? "server" : "off" });
    setNote("המפתח נמחק מהמכשיר.");
  }

  function download(name: string, content: unknown) {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadBackup() {
    download(`agali-${new Date().toISOString().slice(0, 10)}.json`, store.exportBackup());
    setNote("הגיבוי ירד. הוא לא כולל את מפתח ה-API.");
  }

  async function uploadBackup(file: File) {
    try {
      const result = store.importBackup(JSON.parse(await file.text()));
      setSettings(store.getSettings());
      setNote(
        result.skipped
          ? `נוספו ${result.added} שחקנים, ${result.skipped} כבר היו כאן.`
          : `נוספו ${result.added} שחקנים.`,
      );
    } catch (error) {
      setNote((error as Error).message);
    }
  }

  if (terms) return <Terms onClose={() => setTerms(false)} />;

  if (!open) {
    return (
      <div className="parent">
        <h1>לוח הורים</h1>
        <p className="muted">כדי להיכנס, פתרו את התרגיל.</p>
        <form
          className="gate"
          onSubmit={(event) => {
            event.preventDefault();
            if (Number(guess) === gate.answer) setOpen(true);
            else setGuess("");
          }}
        >
          <label>
            כמה זה {gate.a} × {gate.b}?
            <input
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              inputMode="numeric"
              autoFocus
            />
          </label>
          <button className="btn primary" type="submit">
            כניסה
          </button>
        </form>
        <button className="link-btn" onClick={onClose}>
          חזרה למשחק
        </button>
      </div>
    );
  }

  const hasKey = settings.apiKey.length > 0;
  const masked = hasKey ? `${settings.apiKey.slice(0, 12)}…${settings.apiKey.slice(-4)}` : "";
  const selected = MODELS.find((model) => model.id === settings.model);
  const perTurn = selected
    ? (1200 * selected.inputPerMTok + 120 * selected.outputPerMTok) / 1_000_000
    : 0;

  return (
    <div className="parent">
      <header className="parent-head">
        <h1>לוח הורים</h1>
        <button className="btn" onClick={onClose}>
          חזרה למשחק
        </button>
      </header>

      {note && <p className="notice">{note}</p>}

      <section className="panel-section">
        <h2>יומן המשחק</h2>
        <p className="muted">
          המשחק רץ כולו בדפדפן, ולכן אין שרת עם לוגים. במקום זה נשמר כאן יומן מקומי של
          מה שקרה — {entries.length} רשומות אחרונות. הוא נשאר על המכשיר, כמו כל שאר
          הנתונים. אותן שורות מודפסות גם לקונסולת הדפדפן.
        </p>

        {entries.length === 0 ? (
          <p className="muted small">עוד לא קרה כלום מאז שהיומן נוקה.</p>
        ) : (
          <div className="log-view">
            {entries.slice(0, 60).map((entry, index) => (
              <div className={`log-row ${entry.level}`} key={`${entry.at}-${index}`}>
                <span className="log-time">{formatTime(entry.at)}</span>
                <span className="log-scope">{entry.scope}</span>
                <span className="log-msg">
                  {entry.who ? `${entry.who}: ` : ""}
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="row">
          <button className="btn" onClick={() => setEntries(readLog())}>
            רענון
          </button>
          <button
            className="btn"
            onClick={() =>
              download(`agali-log-${new Date().toISOString().slice(0, 10)}.json`, readLog())
            }
            disabled={entries.length === 0}
          >
            הורדת היומן
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              clearLog();
              setEntries([]);
            }}
            disabled={entries.length === 0}
          >
            ניקוי
          </button>
        </div>
      </section>

      {FEATURES.agaliChat && (
        <>
          <section className="panel-section">
            <h2>עגלי — עוזר הסופר</h2>
            <p className="muted">
              הצ׳אט הוא החלק היחיד שדורש אינטרנט וכסף. כל שאר המשחק רץ במלואו על
              המכשיר.
            </p>

            <div className="chips">
              <button
                className={`chip wide ${settings.chatSource === "off" ? "on" : ""}`}
                onClick={() => patch({ chatSource: "off" })}
              >
                כבוי
              </button>
              <button
                className={`chip wide ${settings.chatSource === "direct" ? "on" : ""}`}
                onClick={() => patch({ chatSource: "direct" })}
                disabled={!hasKey}
              >
                מפתח משלי
              </button>
              {server?.serverKey && (
                <button
                  className={`chip wide ${settings.chatSource === "server" ? "on" : ""}`}
                  onClick={() => patch({ chatSource: "server" })}
                >
                  המפתח שבשרת המקומי
                </button>
              )}
            </div>
          </section>

          <section className="panel-section">
            <h2>מפתח ה-API</h2>
            {hasKey ? (
              <div className="key-row">
                <code className="key-mask">{keyVisible ? settings.apiKey : masked}</code>
                <button className="btn small" onClick={() => setKeyVisible((v) => !v)}>
                  {keyVisible ? "הסתרה" : "הצגה"}
                </button>
                <button className="btn small" onClick={clearKey}>
                  מחיקה
                </button>
              </div>
            ) : (
              <form
                className="key-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveKey();
                }}
              >
                <input
                  type="password"
                  value={keyDraft}
                  onChange={(event) => setKeyDraft(event.target.value)}
                  placeholder="sk-ant-..."
                  autoComplete="off"
                  spellCheck={false}
                />
                <button className="btn primary" type="submit" disabled={!keyDraft.trim()}>
                  שמירה
                </button>
              </form>
            )}

            <div className="warn-box">
              <strong>לפני שמדביקים מפתח:</strong>
              <ul>
                <li>
                  המפתח נשמר ב־<code>localStorage</code> של הדפדפן הזה, ונשלח אך ורק אל{" "}
                  <code>api.anthropic.com</code>.
                </li>
                <li>מי שיש לו גישה לדפדפן הזה יכול לחלץ אותו. אל תשתמשו במפתח הראשי.</li>
                <li>
                  מומלץ ליצור מפתח ייעודי ב־workspace נפרד, עם{" "}
                  <strong>תקרת הוצאה חודשית</strong>.
                </li>
              </ul>
            </div>
          </section>

          <section className="panel-section">
            <h2>המודל של עגלי</h2>
            <div className="model-list">
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  className={`model-card ${model.id === settings.model ? "on" : ""}`}
                  onClick={() => patch({ model: model.id })}
                  aria-pressed={model.id === settings.model}
                >
                  <span className="model-top">
                    <strong>{model.label}</strong>
                    <span className="model-rel">{model.relativeCost}</span>
                  </span>
                  <span className="model-blurb">{model.blurb}</span>
                </button>
              ))}
            </div>
            {selected && (
              <p className="muted small">
                תור שיחה אחד עולה בערך {money(perTurn)} עם {selected.label}.
              </p>
            )}
          </section>

          <section className="panel-section">
            <h2>מה נצרך בפועל</h2>
            <div className="usage-grid">
              <div>
                <dt>היום</dt>
                <dd>{usage.today.requests} הודעות</dd>
                <dd className="cost">{money(usage.today.cost)}</dd>
              </div>
              <div>
                <dt>החודש</dt>
                <dd>{usage.month.requests} הודעות</dd>
                <dd className="cost">{money(usage.month.cost)}</dd>
              </div>
              <div>
                <dt>מאז ומתמיד</dt>
                <dd>{usage.total.requests} הודעות</dd>
                <dd className="cost">{money(usage.total.cost)}</dd>
              </div>
            </div>
            <p className="muted small">
              {thousands(usage.month.tokens.input)} טוקני קלט ו־
              {thousands(usage.month.tokens.output)} פלט החודש. ההמרה לדולרים היא הערכה.
            </p>
          </section>
        </>
      )}

      <section className="panel-section">
        <h2>גיבוי והעברה</h2>
        <p className="muted">
          הנתונים נשמרים בדפדפן הזה בלבד, ולכן הם לא עוברים למכשיר אחר מעצמם. הקובץ כאן
          מעביר אותם.
        </p>
        <div className="row">
          <button className="btn" onClick={downloadBackup}>
            הורדת גיבוי
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            טעינת גיבוי
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadBackup(file);
              event.target.value = "";
            }}
          />
        </div>
      </section>

      <section className="panel-section">
        <h2>מידע משפטי</h2>
        <p className="muted">
          המשחק לא אוסף מידע ולא שולח דבר לשום שרת. כל הפרטים בתנאי השימוש.
        </p>
        <div className="row">
          <button className="btn" onClick={() => setTerms(true)}>
            תנאי שימוש
          </button>
        </div>
      </section>
    </div>
  );
}
