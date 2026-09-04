import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarArt } from "../art/avatars";
import { Product } from "../art/Product";
import { Shelf } from "../art/Shelf";
import { Chat } from "./Chat";
import {
  nextHint,
  revealAnswer,
  startRiddle,
  submitAnswer,
  type PublicProfile,
  type PublicRiddle,
} from "../game/engine";
import * as store from "../store/local";
import type { Art } from "../../../shared/types";
import { canSpeak, speak, stopSpeaking, watchVoices } from "../lib/speech";

interface Solved {
  answer: string;
  reveal: string;
  aisle: string;
  art: Art;
  levelUp: boolean;
  gaveUp: boolean;
}

export function Game({
  profile,
  setProfile,
  onSwitchProfile,
  onParentPanel,
}: {
  profile: PublicProfile;
  setProfile: (profile: PublicProfile) => void;
  onSwitchProfile: () => void;
  onParentPanel: () => void;
}) {
  const [riddle, setRiddle] = useState<PublicRiddle | null>(null);
  const [greeting, setGreeting] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; tone: "close" | "wrong" } | null>(null);
  const [solved, setSolved] = useState<Solved | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLeft, setChatLeft] = useState(profile.chat.left);
  const [finished, setFinished] = useState<string | null>(null);
  const [voiceReady, setVoiceReady] = useState(canSpeak());
  const [nikud, setNikud] = useState(() => readNikudPreference(profile));
  const inputRef = useRef<HTMLInputElement>(null);

  const readsAloud = profile.level === 1;
  const chatEnabled = store.getSettings().chatSource !== "off";

  useEffect(() => watchVoices(() => setVoiceReady(canSpeak())), []);

  // הניקוד נשמר לכל שחקן בנפרד — אח בן 5 ואחות בת 10 רוצים דברים שונים
  useEffect(() => setNikud(readNikudPreference(profile)), [profile.id, profile.level]);

  function toggleNikud() {
    setNikud((on) => {
      const next = !on;
      try {
        localStorage.setItem(`${NIKUD_KEY}:${profile.id}`, next ? "1" : "0");
      } catch {
        // מצב פרטי בדפדפן — פשוט לא זוכרים
      }
      return next;
    });
  }

  const loadRiddle = useCallback(() => {
    stopSpeaking();
    const data = startRiddle(profile.id);
    if (data.done) {
      setFinished(data.message ?? "פתרת הכול!");
      return;
    }
    setRiddle(data.riddle ?? null);
    setGreeting(data.greeting ?? "");
    if (data.profile) setProfile(data.profile);
    setSolved(null);
    setFeedback(null);
    setGuess("");
    setChatOpen(false);
  }, [profile.id, setProfile]);

  useEffect(() => {
    loadRiddle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  // ברמה 1 הרמז נקרא בקול מיד כשהוא מופיע
  useEffect(() => {
    if (!readsAloud || !voiceReady || !riddle || solved) return;
    const latest = riddle.clues[riddle.clues.length - 1];
    if (latest) speak(latest);
  }, [riddle, readsAloud, voiceReady, solved]);

  function checkGuess() {
    const text = guess.trim();
    if (!text || solved) return;
    try {
      const result = submitAnswer(profile.id, text);
      if (result.status === "correct") {
        setProfile(result.profile);
        setSolved({ ...result, gaveUp: false });
        setFeedback(null);
        stopSpeaking();
        if (voiceReady) speak(`נכון! ${result.answer}`);
      } else {
        setFeedback({ text: result.message, tone: result.status });
        setGuess("");
        inputRef.current?.focus();
      }
    } catch (error) {
      setFeedback({ text: (error as Error).message, tone: "wrong" });
    }
  }

  function askHint() {
    if (!riddle?.hasMoreClues) return;
    setRiddle(nextHint(profile.id));
    setFeedback(null);
  }

  function giveUp() {
    if (solved) return;
    const data = revealAnswer(profile.id);
    setProfile(data.profile);
    setSolved({ ...data, levelUp: false, gaveUp: true });
    stopSpeaking();
  }

  if (finished) {
    return (
      <div className="finished">
        <h1>🎉 {finished}</h1>
        <button className="btn primary big" onClick={onSwitchProfile}>
          חזרה לבחירת שחקן
        </button>
      </div>
    );
  }

  return (
    <div className="game">
      <header className="topbar">
        <button className="who" onClick={onSwitchProfile}>
          <AvatarArt id={profile.avatar} size={44} />
          <span className="who-text">
            <strong>{profile.name}</strong>
            <small>{profile.levelName}</small>
          </span>
        </button>

        <div className="progress" aria-label={`התקדמות ברמה ${profile.level}`}>
          <div className="progress-fill" style={{ width: `${Math.round(profile.progress * 100)}%` }} />
        </div>

        <div className="score" title="פריטים בעגלה">
          🛒 <strong>{profile.solvedCount}</strong>
        </div>
      </header>

      <main className="board">
        <Shelf
          aisleName={solved ? solved.aisle : "מדף החידה"}
          solvedArt={solved?.art ?? null}
          celebrating={Boolean(solved && !solved.gaveUp)}
        />

        <section className="riddle-card">
          {!solved && riddle && (
            <>
              <h1 className="riddle-title">מי אני?</h1>

              <ol className="clues">
                {riddle.clues.map((clue, index) => (
                  <li key={index}>
                    <span className="clue-num">רמז {index + 1}</span>
                    <p className={nikud ? "nikud" : ""}>
                      {nikud ? (riddle.cluesNikud[index] ?? clue) : clue}
                    </p>
                    {voiceReady && (
                      <button
                        className="speak-btn"
                        onClick={() => speak(clue)}
                        aria-label="הקראת הרמז"
                      >
                        🔊
                      </button>
                    )}
                  </li>
                ))}
                {riddle.hasMoreClues && (
                  <li className="clue-locked">
                    <span className="clue-num">רמז {riddle.cluesRevealed + 1}</span>
                    <p>עדיין סגור</p>
                  </li>
                )}
              </ol>

              <form
                className="guess-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  checkGuess();
                }}
              >
                <input
                  ref={inputRef}
                  value={guess}
                  onChange={(event) => setGuess(event.target.value)}
                  placeholder="מה אני? כתבו כאן…"
                  maxLength={40}
                  autoComplete="off"
                />
                <button className="btn primary big" type="submit" disabled={!guess.trim()}>
                  בדקו!
                </button>
              </form>

              {feedback && (
                <p className={`feedback ${feedback.tone}`} role="status">
                  {feedback.text}
                </p>
              )}

              <div className="actions">
                <button className="btn" onClick={askHint} disabled={!riddle.hasMoreClues}>
                  {riddle.hasMoreClues ? "עוד רמז" : "אין עוד רמזים"}
                </button>
                <button className="btn" onClick={() => setChatOpen((open) => !open)}>
                  {chatOpen ? "סגירת עגלי" : "שאלו את עגלי"}
                </button>
                <button
                  className={`btn toggle ${nikud ? "on" : ""}`}
                  onClick={toggleNikud}
                  aria-pressed={nikud}
                >
                  נִיקּוּד {nikud ? "פועל" : "כבוי"}
                </button>
                <button className="btn ghost" onClick={giveUp}>
                  גלה לי
                </button>
              </div>
            </>
          )}

          {solved && (
            <div className="solved">
              <div className="solved-art">
                <Product shape={solved.art.shape} color={solved.art.color} size={120} />
              </div>
              <h1 className={solved.gaveUp ? "muted-title" : ""}>
                {solved.gaveUp ? "התשובה היא" : "כל הכבוד!"}
              </h1>
              <p className="answer">{solved.answer}</p>
              <p className="reveal">{solved.reveal}</p>
              {solved.levelUp && <p className="levelup">🎉 עלית רמה! עכשיו {profile.levelName}</p>}
              <button className="btn primary big" onClick={loadRiddle}>
                החידה הבאה
              </button>
            </div>
          )}
        </section>
      </main>

      {chatOpen && riddle && !solved && (
        <Chat
          key={riddle.id}
          profileId={profile.id}
          greeting={greeting}
          enabled={chatEnabled}
          chatLeft={chatLeft}
          onQuotaChange={setChatLeft}
          onClose={() => setChatOpen(false)}
          onParentPanel={onParentPanel}
        />
      )}

      {profile.cart.length > 0 && (
        <footer className="cart" aria-label="העגלה שלי">
          <span className="cart-label">העגלה שלי</span>
          <div className="cart-items">
            {profile.cart.slice(-24).map((item) => (
              <div className="cart-item" key={item.id} title={item.name}>
                <Product shape={item.art.shape} color={item.art.color} size={40} />
                <small>{item.name}</small>
              </div>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

const NIKUD_KEY = "agali:nikud";

/** ברירת המחדל: ניקוד דלוק לקוראים המתחילים, כבוי מרמה 3 */
function readNikudPreference(profile: PublicProfile): boolean {
  try {
    const stored = localStorage.getItem(`${NIKUD_KEY}:${profile.id}`);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // מצב פרטי בדפדפן
  }
  return profile.level <= 2;
}
