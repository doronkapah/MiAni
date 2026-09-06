import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarArt } from "../art/avatars";
import { Product } from "../art/Product";
import { Shelf } from "../art/Shelf";
import { Chat } from "./Chat";
import { Cart } from "./Cart";
import { RecipeModal } from "./RecipeModal";
import { RecipeBook } from "./RecipeBook";
import { HowToPlay, hasSeenHowTo, markHowToSeen } from "./HowToPlay";
import {
  nextHint,
  revealAnswer,
  skipRiddle,
  startRiddle,
  submitAnswer,
  type Celebration,
  type PublicProfile,
  type PublicRiddle,
} from "../game/engine";
import * as store from "../store/local";
import { FEATURES } from "../config";
import { log } from "../lib/log";
import { riddleMessage, share } from "../lib/share";
import type { Art } from "../../../shared/types";
import type { Recipe } from "../../../shared/recipes";
import type { AisleView } from "../../../shared/aisles";
import { getWorld } from "../../../shared/worlds";
import { canSpeak, speak, stopSpeaking, watchVoices } from "../lib/speech";

interface Solved {
  answer: string;
  reveal: string;
  aisle: string;
  art: Art;
  levelUp: boolean;
  gaveUp: boolean;
  aisleView: AisleView;
  celebration?: Celebration;
}

export function Game({
  profile,
  world,
  daily = false,
  setProfile,
  onSwitchWorld,
  onParentPanel,
}: {
  profile: PublicProfile;
  world: string;
  /** מצב חידת היום: חידה אחת, כוכבים, ובלי דילוג */
  daily?: boolean;
  setProfile: (profile: PublicProfile) => void;
  onSwitchWorld: () => void;
  onParentPanel: () => void;
}) {
  const info = getWorld(world);
  const [riddle, setRiddle] = useState<PublicRiddle | null>(null);
  const [greeting, setGreeting] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<{
    text: string;
    tone: "close" | "wrong";
    /** ניחוש שהיה הגיוני — מציעים עליו רמז שיבדיל */
    offerDistinguish?: boolean;
  } | null>(null);
  const [solved, setSolved] = useState<Solved | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLeft, setChatLeft] = useState(profile.chat.left);
  const [finished, setFinished] = useState<string | null>(null);
  const [voiceReady, setVoiceReady] = useState(canSpeak());
  const [nikud, setNikud] = useState(() => readNikudPreference(profile));
  const [unlockedQueue, setUnlockedQueue] = useState<Recipe[]>([]);
  const [overlay, setOverlay] = useState<"none" | "cart" | "book" | "howto">("none");
  const [muted, setMuted] = useState(() => readFlag(MUTE_KEY, profile.id, false));
  const inputRef = useRef<HTMLInputElement>(null);

  const canHear = voiceReady && !muted;
  const readsAloud = profile.level === 1 && canHear;
  const chatEnabled = FEATURES.agaliChat && store.getSettings().chatSource !== "off";

  useEffect(() => watchVoices(() => setVoiceReady(canSpeak())), []);

  // ההסבר מוצג פעם אחת לכל שחקן, ואחר כך רק לפי בקשה
  useEffect(() => {
    if (!hasSeenHowTo(profile.id)) setOverlay("howto");
    setNikud(readNikudPreference(profile));
    setMuted(readFlag(MUTE_KEY, profile.id, false));
  }, [profile.id, profile.level]);

  function toggleMute() {
    setMuted((on) => {
      const next = !on;
      if (next) stopSpeaking();
      writeFlag(MUTE_KEY, profile.id, next);
      return next;
    });
  }

  async function shareRiddle() {
    if (!riddle) return;
    await share(riddleMessage(riddle.clues, riddle.aisle.sign));
    log("share", "shared riddle", { who: profile.name, data: { riddle: riddle.id } });
  }

  function closeHowTo() {
    markHowToSeen(profile.id);
    setOverlay("none");
  }

  function toggleNikud() {
    setNikud((on) => {
      const next = !on;
      writeFlag(NIKUD_KEY, profile.id, next);
      return next;
    });
  }

  const loadRiddle = useCallback(() => {
    stopSpeaking();
    const data = startRiddle(profile.id, world);
    if (data.done) {
      setFinished(data.message ?? "פתרת הכול!");
      log("riddle", "נגמרו החידות", { who: profile.name });
      return;
    }
    setRiddle(data.riddle ?? null);
    setGreeting(data.greeting ?? "");
    if (data.profile) setProfile(data.profile);
    setSolved(null);
    setFeedback(null);
    setGuess("");
    setChatOpen(false);
    setUnlockedQueue([]);
    log("riddle", "חידה חדשה", {
      who: profile.name,
      data: { world, id: data.riddle?.id, level: profile.level, aisle: data.riddle?.aisle.sign },
    });
  }, [profile.id, profile.name, profile.level, world, setProfile]);

  useEffect(() => {
    loadRiddle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id, world]);

  // ברמה 1 הרמז נקרא בקול מיד כשהוא מופיע
  useEffect(() => {
    if (!readsAloud || !riddle || solved) return;
    const latest = riddle.clues[riddle.clues.length - 1];
    if (latest) speak(latest);
  }, [riddle, readsAloud, solved]);

  function checkGuess() {
    const text = guess.trim();
    if (!text || solved) return;
    try {
      const result = submitAnswer(profile.id, text, world);
      log("answer", `ניחוש: ${text}`, {
        who: profile.name,
        data: { riddle: riddle?.id, status: result.status },
      });

      if (result.status === "correct") {
        setProfile(result.profile);
        setSolved({ ...result, gaveUp: false });
        setFeedback(null);
        setUnlockedQueue(result.unlockedRecipes);
        stopSpeaking();
        if (canHear) speak(`${result.celebration.title} ${result.answer}`);
        for (const recipe of result.unlockedRecipes) {
          log("recipe", `נפתח מתכון: ${recipe.name}`, { who: profile.name });
        }
      } else {
        setFeedback({
          text: result.message,
          tone: result.status,
          offerDistinguish: Boolean(result.plausible),
        });
        /*
         * הניחוש נשאר בתיבה. ילד שכתב "פסטה" בשגיאה אחת צריך לתקן
         * אות, לא להקליד הכול מחדש — וילד שניחש הגיונית צריך לראות
         * מה הוא כתב בזמן שקוראים לו למה זה לא זה.
         */
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(text.length, text.length);
      }
    } catch (error) {
      log("answer", (error as Error).message, { who: profile.name, level: "error" });
      setFeedback({ text: (error as Error).message, tone: "wrong" });
    }
  }

  function askHint() {
    if (!riddle?.hasMoreClues) return;
    setRiddle(nextHint(profile.id, world));
    setFeedback(null);
    log("riddle", "רמז נוסף", { who: profile.name, data: { riddle: riddle.id } });
  }

  function skip() {
    if (solved) return;
    const skipped = riddle?.id;
    const data = skipRiddle(profile.id, world);
    setProfile(data.profile);
    log("riddle", "דילוג", { who: profile.name, data: { riddle: skipped } });
    loadRiddle();
  }

  function giveUp() {
    if (solved) return;
    const data = revealAnswer(profile.id, world);
    setProfile(data.profile);
    setSolved({ ...data, levelUp: false, gaveUp: true });
    stopSpeaking();
    log("riddle", `גלה לי: ${data.answer}`, { who: profile.name });
  }

  if (finished) {
    return (
      <div className="finished">
        <h1>🎉 {finished}</h1>
        <button className="btn primary big" onClick={onSwitchWorld}>
          לעולם אחר
        </button>
      </div>
    );
  }

  const recipesOpen = profile.recipes.filter((recipe) => recipe.unlocked).length;

  return (
    <div className="game">
      <header className="topbar">
        <button className="who" onClick={onSwitchWorld}>
          <AvatarArt id={profile.avatar} size={38} />
          <span className="who-text">
            <strong>{profile.name}</strong>
            <small>
              {daily ? "⭐ חידת היום" : `${info.icon} ${info.name} · ${profile.levelName}`}
            </small>
          </span>
        </button>

        {profile.answerStreak >= 2 && (
          <span className="streak-chip" title={`${profile.answerStreak} תשובות נכונות ברצף`}>
            🔥 {profile.answerStreak}
          </span>
        )}

        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setOverlay("howto")} aria-label="איך משחקים">
            ?
          </button>
          {voiceReady && (
            <button
              className="icon-btn"
              onClick={toggleMute}
              aria-pressed={muted}
              aria-label={muted ? "הפעלת הקראה" : "השתקת הקראה"}
            >
              {muted ? "🔇" : "🔊"}
            </button>
          )}
          {!daily && (
            <>
              <button
                className="icon-btn"
                onClick={() => setOverlay("book")}
                aria-label={`${info.sets.name}, ${recipesOpen} פתוחים`}
              >
                {info.sets.icon}
                <b>{recipesOpen}</b>
              </button>
              <button
                className="icon-btn"
                onClick={() => setOverlay("cart")}
                aria-label={`${info.collection.name}, ${profile.solvedCount} פריטים`}
              >
                {info.collection.icon}
                <b>{profile.solvedCount}</b>
              </button>
            </>
          )}
        </div>
      </header>

      {!daily && (
        <div className="progress" aria-label={`התקדמות ברמה ${profile.level}`}>
          <div
            className="progress-fill"
            style={{ width: `${Math.round(profile.progress * 100)}%` }}
          />
        </div>
      )}

      <main className="board">
        {/* המפתח מכריח ריצה מחדש של האנימציה בכל חידה */}
        <div className="stage" key={riddle?.id ?? "none"}>
          {(solved || riddle) && (
            <Shelf
              aisle={solved ? solved.aisleView : riddle!.aisle}
              solvedArt={solved?.art ?? null}
              celebrating={Boolean(solved && !solved.gaveUp)}
            />
          )}

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
                      {canHear && (
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
                    />
                    {guess && (
                      <button
                        type="button"
                        className="clear-guess"
                        onClick={() => {
                          setGuess("");
                          setFeedback(null);
                          inputRef.current?.focus();
                        }}
                        aria-label="מחיקת מה שכתבתי"
                      >
                        ×
                      </button>
                    )}
                  </span>
                  <button className="btn primary big" type="submit" disabled={!guess.trim()}>
                    בדקו!
                  </button>
                </form>

                {feedback && (
                  <div className={`feedback ${feedback.tone}`} role="status">
                    <p>{feedback.text}</p>
                    {feedback.offerDistinguish && riddle.hasMoreClues && (
                      <button className="btn distinguish" onClick={askHint}>
                        💡 רמז שיבדיל ביניהם
                      </button>
                    )}
                  </div>
                )}

                <div className="actions">
                  <button className="btn" onClick={askHint} disabled={!riddle.hasMoreClues}>
                    {riddle.hasMoreClues ? "עוד רמז" : "אין עוד רמזים"}
                  </button>
                  {chatEnabled && (
                    <button className="btn" onClick={() => setChatOpen((open) => !open)}>
                      {chatOpen ? "סגירת עגלי" : "שאלו את עגלי"}
                    </button>
                  )}
                  <button
                    className={`btn toggle ${nikud ? "on" : ""}`}
                    onClick={toggleNikud}
                    aria-pressed={nikud}
                  >
                    נִיקּוּד {nikud ? "פועל" : "כבוי"}
                  </button>
                  <button className="btn" onClick={() => void shareRiddle()}>
                    📤 שיתוף
                  </button>
                  {!daily && (
                    <button className="btn ghost" onClick={skip}>
                      דלג
                    </button>
                  )}
                  <button className="btn ghost" onClick={giveUp}>
                    גלה לי
                  </button>
                </div>
              </>
            )}

            {solved && (
              <div className="solved">
                <div className="solved-art">
                  <Product shape={solved.art.shape} color={solved.art.color} size={104} />
                </div>
                <h1 className={solved.gaveUp ? "muted-title" : ""}>
                  {solved.gaveUp ? "התשובה היא" : (solved.celebration?.title ?? "כל הכבוד!")}
                </h1>
                {solved.celebration?.note && (
                  <p className="celebrate-note">{solved.celebration.note}</p>
                )}
                <p className="answer">{solved.answer}</p>
                <p className="reveal">{solved.reveal}</p>
                {solved.celebration?.milestone && (
                  <div className="streak-banner">
                    <span className="streak-flames" aria-hidden="true">
                      {"🔥".repeat(Math.min(5, Math.ceil(solved.celebration.milestone / 3)))}
                    </span>
                    <span>{solved.celebration.milestone} חידות ברצף בלי לוותר</span>
                  </div>
                )}
                {solved.levelUp && (
                  <p className="levelup">🎉 עלית רמה! עכשיו {profile.levelName}</p>
                )}
                {daily ? (
                  <>
                    <p className="daily-done">
                      זהו להיום. חידה חדשה מחכה מחר בבוקר 🌅
                    </p>
                    <button className="btn primary big" onClick={onSwitchWorld}>
                      חזרה
                    </button>
                  </>
                ) : (
                  <button className="btn primary big" onClick={loadRiddle}>
                    החידה הבאה
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {overlay === "howto" && <HowToPlay world={world} onClose={closeHowTo} />}
      {overlay === "cart" && (
        <Cart items={profile.cart} world={world} onClose={() => setOverlay("none")} />
      )}
      {overlay === "book" && (
        <RecipeBook
          recipes={profile.recipes}
          world={world}
          nikud={nikud}
          onClose={() => setOverlay("none")}
        />
      )}

      {unlockedQueue.length > 0 && (
        <RecipeModal
          recipe={unlockedQueue[0]!}
          nikud={nikud}
          world={world}
          remaining={unlockedQueue.length - 1}
          onClose={() => setUnlockedQueue((queue) => queue.slice(1))}
        />
      )}

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
    </div>
  );
}

const NIKUD_KEY = "agali:nikud";
const MUTE_KEY = "agali:mute";

/** העדפות שנשמרות לכל שחקן בנפרד */
function readFlag(key: string, profileId: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(`${key}:${profileId}`);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // מצב פרטי בדפדפן
  }
  return fallback;
}

function writeFlag(key: string, profileId: string, value: boolean): void {
  try {
    localStorage.setItem(`${key}:${profileId}`, value ? "1" : "0");
  } catch {
    // מצב פרטי בדפדפן — פשוט לא זוכרים
  }
}

/** ברירת המחדל: ניקוד דלוק לקוראים המתחילים, כבוי מרמה 3 */
function readNikudPreference(profile: PublicProfile): boolean {
  return readFlag(NIKUD_KEY, profile.id, profile.level <= 2);
}
