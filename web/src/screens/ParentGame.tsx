import { useCallback, useEffect, useState } from "react";
import { AvatarArt } from "../art/avatars";
import { Product } from "../art/Product";
import { Shelf } from "../art/Shelf";
import { RecipeModal } from "./RecipeModal";
import {
  awardSolve,
  groupHint,
  groupReveal,
  startGroupRiddle,
  type GroupOutcome,
  type GroupSession,
  type ParentRiddle,
} from "../game/group";
import { publicProfile, type PublicProfile } from "../game/engine";
import type { Recipe } from "../../../shared/recipes";
import * as store from "../store/local";
import { canSpeak, speak, stopSpeaking, watchVoices } from "../lib/speech";
import { log } from "../lib/log";
import { getWorld } from "../../../shared/worlds";

/**
 * המסך של ההורה.
 *
 * ההורה מקריא, הילדים עונים בפה, וההורה מקיש מי פתר. התשובה מוצגת
 * לו בפס נפרד ובולט — הוא מנהל את המשחק, אז הוא צריך לדעת אותה.
 */
export function ParentGame({
  session,
  onExit,
}: {
  session: GroupSession;
  onExit: () => void;
}) {
  const [riddle, setRiddle] = useState<ParentRiddle | null>(null);
  const [outcome, setOutcome] = useState<GroupOutcome | null>(null);
  const [players, setPlayers] = useState<PublicProfile[]>([]);
  const [wins, setWins] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [showAnswer, setShowAnswer] = useState(true);
  const [voiceReady, setVoiceReady] = useState(canSpeak());
  const [recipeQueue, setRecipeQueue] = useState<{ who: string; recipe: Recipe }[]>([]);
  const info = getWorld(session.world);

  useEffect(() => watchVoices(() => setVoiceReady(canSpeak())), []);

  const refreshPlayers = useCallback(() => {
    setPlayers(
      session.profileIds
        .map((id) => store.getProfile(id))
        .filter((profile) => profile !== undefined)
        .map((profile) => publicProfile(profile, session.world)),
    );
  }, [session.profileIds]);

  const nextRiddle = useCallback(() => {
    stopSpeaking();
    const next = startGroupRiddle(session);
    if (!next) {
      setFinished(true);
      return;
    }
    setRiddle(next);
    setOutcome(null);
    refreshPlayers();
    log("parent", `חידה חדשה: ${next.answer}`, {
      data: { mode: session.mode, level: session.level, players: session.profileIds.length },
    });
  }, [session, refreshPlayers]);

  useEffect(() => {
    nextRiddle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function collectRecipes(result: GroupOutcome) {
    const queue = result.awarded.flatMap((entry) =>
      entry.unlockedRecipes.map((recipe) => ({ who: entry.profile.name, recipe })),
    );
    setRecipeQueue(queue);
  }

  function award(winnerIds: string[]) {
    const result = awardSolve(session, winnerIds);
    if (!result) return;
    setOutcome(result);
    refreshPlayers();
    collectRecipes(result);
    log("parent", `פתרו: ${result.answer}`, {
      who: result.awarded.map((entry) => entry.profile.name).join(", "),
    });
    setWins((current) => {
      const next = { ...current };
      for (const entry of result.awarded) {
        next[entry.profile.id] = (next[entry.profile.id] ?? 0) + 1;
      }
      return next;
    });
    stopSpeaking();
  }

  function nobody() {
    const result = groupReveal(session);
    if (!result) return;
    log("parent", `אף אחד לא פתר: ${result.answer}`);
    setOutcome(result);
    refreshPlayers();
    stopSpeaking();
  }

  function readClues() {
    if (!riddle) return;
    speak(riddle.clues.join(" "));
  }

  if (finished) {
    return (
      <div className="finished">
        <h1>🎉 נגמרו החידות ברמה הזאת</h1>
        <button className="btn primary big" onClick={onExit}>
          חזרה למסך הפתיחה
        </button>
      </div>
    );
  }

  return (
    <div className="game parent-game">
      <header className="topbar">
        <button className="who" onClick={onExit}>
          <span className="who-text">
            <strong>הורה שואל</strong>
            <small>{session.mode === "coop" ? "שיתוף פעולה" : "תחרותי"}</small>
          </span>
        </button>

        <div className="scoreboard">
          {players.map((player) => (
            <span className="score-chip" key={player.id}>
              <AvatarArt id={player.avatar} size={28} />
              {player.name}
              <strong>{wins[player.id] ?? 0}</strong>
            </span>
          ))}
        </div>
      </header>

      <main className="board">
        <div className="stage" key={riddle?.id ?? "none"}>
          {(riddle || outcome) && (
            <Shelf
              aisle={outcome ? outcome.aisleView : riddle!.aisle}
              solvedArt={outcome?.art ?? null}
              celebrating={Boolean(outcome && !outcome.gaveUp)}
            />
          )}

          <section className="riddle-card">
          {!outcome && riddle && (
            <>
              <div className="parent-answer">
                <span className="parent-answer-label">התשובה, לעיניכם בלבד</span>
                <button
                  className="parent-answer-value"
                  onClick={() => setShowAnswer((on) => !on)}
                >
                  {showAnswer ? riddle.answerNikud : "הקישו כדי לראות"}
                </button>
                <small>{riddle.aisleName}</small>
              </div>

              <h1 className="riddle-title">מי אני?</h1>

              <ol className="clues">
                {riddle.cluesNikud.map((clue, index) => (
                  <li key={index}>
                    <span className="clue-num">רמז {index + 1}</span>
                    <p className="nikud">{clue}</p>
                  </li>
                ))}
              </ol>

              <div className="actions">
                <button className="btn" onClick={() => setRiddle(groupHint(session))} disabled={!riddle.hasMoreClues}>
                  {riddle.hasMoreClues ? "עוד רמז" : "אין עוד רמזים"}
                </button>
                {voiceReady && (
                  <button className="btn" onClick={readClues}>
                    🔊 הקראה
                  </button>
                )}
              </div>

              <div className="who-solved">
                <p className="who-solved-title">
                  {session.mode === "coop" ? "פתרתם?" : "מי פתר ראשון?"}
                </p>
                <div className="who-solved-row">
                  {session.mode === "coop" ? (
                    <button className="btn primary big" onClick={() => award(session.profileIds)}>
                      🤝 פתרנו!
                    </button>
                  ) : (
                    players.map((player) => (
                      <button
                        className="winner-btn"
                        key={player.id}
                        onClick={() => award([player.id])}
                      >
                        <AvatarArt id={player.avatar} size={48} />
                        <span>{player.name}</span>
                      </button>
                    ))
                  )}
                  <button className="btn ghost" onClick={nobody}>
                    אף אחד — גלו את התשובה
                  </button>
                </div>
              </div>
            </>
          )}

          {outcome && (
            <div className="solved">
              <div className="solved-art">
                <Product shape={outcome.art.shape} color={outcome.art.color} size={110} />
              </div>
              <h1 className={outcome.gaveUp ? "muted-title" : ""}>
                {outcome.gaveUp ? "התשובה היא" : "כל הכבוד!"}
              </h1>
              <p className="answer">{outcome.answer}</p>
              <p className="reveal">{outcome.reveal}</p>

              {outcome.awarded.length > 0 && (
                <p className="awarded">
                  נכנס {info.collection.into} של{" "}
                  {outcome.awarded.map((entry) => entry.profile.name).join(" ו")}
                  {outcome.awarded.some((entry) => entry.levelUp) && " · 🎉 עליית רמה!"}
                </p>
              )}

              <button className="btn primary big" onClick={nextRiddle}>
                החידה הבאה
              </button>
            </div>
            )}
          </section>
        </div>
      </main>

      {recipeQueue.length > 0 && (
        <RecipeModal
          recipe={recipeQueue[0]!.recipe}
          nikud
          remaining={recipeQueue.length - 1}
          owner={recipeQueue[0]!.who}
          onClose={() => setRecipeQueue((queue) => queue.slice(1))}
        />
      )}
    </div>
  );
}
