import { useMemo, useRef, useState } from "react";
import { Shelf } from "../art/Shelf";
import { Product } from "../art/Product";
import { riddles } from "../../../shared/bank";
import { checkAnswer, toTarget } from "../../../shared/matcher";
import { aisleView, solvedAisleView } from "../../../shared/aisles";
import { plausibleGuess } from "../../../shared/plausible";
import { canSpeak, speak, stopSpeaking } from "../lib/speech";

/**
 * חידת ההתנסות.
 *
 * חידה אחת, לפני שיש פרופיל — כדי שאפשר יהיה להבין מה המשחק הזה
 * בלי למסור שם וגיל. היא לא נוגעת באחסון בכלל: אין כאן התקדמות
 * לשמור, וזו בדיוק הנקודה.
 */

/** חידה קלה ומוכרת, שמתחלפת בכל כניסה */
function pickTrial() {
  const easy = riddles.filter(
    (riddle) => riddle.world === "market" && riddle.level === 1 && riddle.clues.length >= 2,
  );
  return easy[Math.floor(Math.random() * easy.length)]!;
}

export function TryRiddle({
  onCreate,
  onBack,
}: {
  onCreate: () => void;
  onBack: () => void;
}) {
  const riddle = useMemo(pickTrial, []);
  const target = useMemo(
    () => toTarget(riddle.id, riddle.answer, riddle.aliases ?? []),
    [riddle],
  );

  const [shown, setShown] = useState(1);
  const [guess, setGuess] = useState("");
  const [note, setNote] = useState<{ text: string; tone: "close" | "wrong" } | null>(null);
  const [solved, setSolved] = useState<"yes" | "shown" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clues = (riddle.cluesNikud ?? riddle.clues).slice(0, shown);
  const hasMore = shown < riddle.clues.length;
  const view = solved ? solvedAisleView(riddle.world, riddle.aisle) : aisleView(riddle.world, riddle.aisle, 1);

  function submit() {
    const text = guess.trim();
    if (!text || solved) return;

    const result = checkAnswer({ guess: text, target });
    if (result.status === "correct") {
      setSolved("yes");
      setNote(null);
      stopSpeaking();
      if (canSpeak()) speak(`כל הכבוד! ${riddle.answer}`);
      return;
    }

    const plausible = plausibleGuess(text, riddle);
    setNote({
      text: plausible
        ? `${plausible.guess} זה ניחוש חכם, והוא באמת מתאים לרמז. אבל אני משהו אחר.`
        : result.status === "close"
          ? "ממש ממש קרוב! נסו שוב."
          : "לא הפעם. אפשר לבקש עוד רמז.",
      tone: result.status,
    });
    inputRef.current?.focus();
    inputRef.current?.setSelectionRange(text.length, text.length);
  }

  return (
    <div className="game trial">
      <header className="topbar">
        <button className="who" onClick={onBack}>
          <span className="who-text">
            <strong>חידה לנסות</strong>
            <small>בלי שם ובלי הרשמה</small>
          </span>
        </button>
      </header>

      <main className="board">
        <div className="stage">
          <Shelf
            aisle={view}
            solvedArt={solved ? riddle.art : null}
            celebrating={solved === "yes"}
          />

          <section className="riddle-card">
            {!solved && (
              <>
                <h1 className="riddle-title">מי אני?</h1>

                <ol className="clues">
                  {clues.map((clue, index) => (
                    <li key={index} className="nikud">
                      {clue}
                    </li>
                  ))}
                </ol>

                <form
                  className="guess-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                >
                  <span className="guess-field">
                    <input
                      ref={inputRef}
                      value={guess}
                      onChange={(event) => setGuess(event.target.value)}
                      placeholder="מה אני? כתבו כאן…"
                      aria-label="הניחוש שלי"
                      maxLength={40}
                      autoComplete="off"
                      enterKeyHint="send"
                      autoFocus
                    />
                  </span>
                  <button className="btn primary big" type="submit" disabled={!guess.trim()}>
                    בדקו!
                  </button>
                </form>

                {note && (
                  <div className={`feedback ${note.tone}`} role="status">
                    <p>{note.text}</p>
                  </div>
                )}

                <div className="actions">
                  <button
                    className="btn"
                    onClick={() => setShown((count) => count + 1)}
                    disabled={!hasMore}
                  >
                    {hasMore ? "עוד רמז" : "אין עוד רמזים"}
                  </button>
                  <button className="btn ghost" onClick={() => setSolved("shown")}>
                    גלו לי
                  </button>
                </div>
              </>
            )}

            {solved && (
              <div className="solved">
                <div className="solved-art">
                  <Product shape={riddle.art.shape} color={riddle.art.color} size={104} />
                </div>
                <h1 className={solved === "shown" ? "muted-title" : ""}>
                  {solved === "shown" ? "התשובה היא" : "כל הכבוד!"}
                </h1>
                <p className="answer">{riddle.answerNikud}</p>
                <p className="reveal">{riddle.reveal}</p>

                <p className="trial-note">
                  זו הייתה טעימה. במשחק המלא יש ארבעה עולמות, רמות שמתאימות את
                  עצמן, ואוסף שנבנה מכל מה שפותרים.
                </p>

                <button className="btn primary big" onClick={onCreate}>
                  אני רוצה להמשיך
                </button>
                <button className="link-btn" onClick={onBack}>
                  חזרה
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
