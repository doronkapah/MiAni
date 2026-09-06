import { useEffect, useRef } from "react";
import { RecipeArt } from "../art/RecipeArt";
import type { Recipe } from "../../../shared/recipes";
import { canSpeak, speak, stopSpeaking } from "../lib/speech";
import { getWorld } from "../../../shared/worlds";
import { fresh, opened } from "../../../shared/hebrew";

/**
 * המתכון שנפתח, קופץ על המסך.
 *
 * זה רגע החגיגה של המשחק: הילד אסף מצרכים בלי לדעת לאן זה הולך,
 * ופתאום יש לו מנה שלמה. הכפתור היחיד הוא "יופי!", כי אין כאן
 * שום החלטה לקבל.
 */
export function RecipeModal({
  recipe,
  nikud,
  remaining,
  owner,
  world,
  onClose,
}: {
  recipe: Recipe;
  nikud: boolean;
  world?: string;
  /** כמה מתכונים נוספים נפתחו באותו רגע */
  remaining: number;
  /** במצב "הורה שואל" — של מי המתכון */
  owner?: string;
  onClose: () => void;
}) {
  const info = getWorld(world ?? recipe.world);
  const closeRef = useRef<HTMLButtonElement>(null);
  const voice = canSpeak();

  useEffect(() => {
    closeRef.current?.focus();
    return () => stopSpeaking();
  }, [recipe.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const name = nikud ? recipe.nameNikud : recipe.name;
  const teaser = nikud ? recipe.teaserNikud : recipe.teaser;
  const steps = nikud ? recipe.stepsNikud : recipe.steps;
  const fact = nikud ? recipe.factNikud : recipe.fact;

  function readAloud() {
    speak(`${recipe.name}. ${recipe.steps.join(" ")}`);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="recipe-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${info.sets.singular} חדש: ${recipe.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="recipe-banner">
          {owner
            ? `🎉 ל${owner} ${opened(info.sets.singular)} ${info.sets.singular} ${fresh(
                info.sets.singular,
              )}!`
            : `🎉 ${opened(info.sets.singular)} ${info.sets.singular} ${fresh(
                info.sets.singular,
              )}!`}
        </p>

        <div className="recipe-head">
          <RecipeArt art={recipe.art} size={110} title={recipe.name} />
          <div>
            <h1 className={nikud ? "nikud" : ""}>{name}</h1>
            <p className={`recipe-teaser ${nikud ? "nikud" : ""}`}>{teaser}</p>
          </div>
        </div>

        <ol className={`recipe-steps ${nikud ? "nikud" : ""}`}>
          {steps.map((step, index) => (
            <li key={index}>
              <span className="step-num">{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>

        <p className={`recipe-fact ${nikud ? "nikud" : ""}`}>💡 {fact}</p>

        {recipe.world === "market" && (
          <p className="recipe-warning">
            חלק מהשלבים דורשים אש או סכין — את אלה עושה מבוגר.
          </p>
        )}

        <div className="recipe-actions">
          <button className="btn primary big" onClick={onClose} ref={closeRef}>
            {remaining > 0
              ? `יופי! ועוד ${remaining} ב${info.sets.name}`
              : "יופי!"}
          </button>
          {voice && (
            <button className="btn" onClick={readAloud}>
              🔊 הקראה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
