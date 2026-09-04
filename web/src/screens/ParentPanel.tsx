import { useEffect, useRef, useState } from "react";
import { MODELS } from "../../../shared/models";
import * as store from "../store/local";
import { usageSummaries } from "../game/usage";
import { probeServer, type ServerInfo } from "../game/server";

/**
 * לוח ההורים: מפתח ה-API, בחירת המודל, מעקב עלות, וגיבוי.
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
  const [keyDraft, setKeyDraft] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    probeServer().then(setServer);
    setUsage(usageSummaries());
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

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(store.exportBackup(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agali-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
        <h2>עגלי — עוזר הסופר</h2>
        <p className="muted">
          הצ׳אט הוא החלק היחיד שדורש אינטרנט וכסף. כל שאר המשחק — חידות, רמזים, בדיקת
          תשובות, פרופילים ורמות — רץ במלואו על המכשיר.
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

        {server?.serverKey && (
          <p className="muted small">
            המשחק מוגש מהשרת המקומי, ויש בו מפתח ב־<code>.env</code>. במצב הזה אין צורך
            להדביק מפתח בדפדפן בכלל.
          </p>
        )}
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
              <code>api.anthropic.com</code>. הוא לא עובר בשום שרת שלנו.
            </li>
            <li>
              מי שיש לו גישה לדפדפן הזה יכול לחלץ אותו. אל תשתמשו במפתח הראשי של החשבון.
            </li>
            <li>
              מומלץ ליצור ב־Anthropic Console מפתח ייעודי ב־workspace נפרד, עם{" "}
              <strong>תקרת הוצאה חודשית</strong>. זו ההגנה האמיתית מפני הפתעות.
            </li>
          </ul>
        </div>
      </section>

      <section className="panel-section">
        <h2>המודל של עגלי</h2>
        <p className="muted">
          המודל משפיע על איכות העברית ועל העלות. ההחלפה חלה על ההודעה הבאה.
        </p>
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
              <span className="model-price">
                ${model.inputPerMTok} קלט · ${model.outputPerMTok} פלט למיליון טוקנים
              </span>
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
          מספרי הטוקנים מגיעים מה-API עצמו: {thousands(usage.month.tokens.input)} קלט,{" "}
          {thousands(usage.month.tokens.output)} פלט,{" "}
          {thousands(usage.month.tokens.cacheRead)} מהמטמון החודש. המרת הטוקנים לדולרים היא
          הערכה, כי מחיר הקריאה מהמטמון תלוי בתנאי החשבון. החיוב האמיתי נמצא ב-Anthropic
          Console.
        </p>
      </section>

      <section className="panel-section">
        <h2>תקרה יומית</h2>
        <p className="muted">כמה הודעות כל שחקן יכול לשלוח לעגלי ביום.</p>
        <div className="chips">
          {[10, 20, 40, 80].map((limit) => (
            <button
              key={limit}
              className={`chip ${settings.dailyLimit === limit ? "on" : ""}`}
              onClick={() => patch({ dailyLimit: limit })}
            >
              {limit}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <h2>גיבוי והעברה</h2>
        <p className="muted">
          הנתונים נשמרים בדפדפן הזה בלבד, ולכן הם לא עוברים למכשיר אחר מעצמם. הקובץ כאן
          מעביר אותם — והוא לא כולל את מפתח ה-API.
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
    </div>
  );
}
