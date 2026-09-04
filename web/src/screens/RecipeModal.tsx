import { useEffect, useRef } from "react";
import { RecipeArt } from "../art/RecipeArt";
import type { Recipe } from "../../../shared/recipes";
import { canSpeak, speak, stopSpeaking } from "../lib/speech";

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
  onClose,
}: {
  recipe: Recipe;
  nikud: boolean;
  /** כמה מתכונים נוספים נפתחו באותו רגע */
  remaining: number;
  onClose: () => void;
}) {
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
        aria-label={`מתכון חדש: ${recipe.name}`}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="recipe-banner">🎉 פתחת מתכון חדש!</p>

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

        <p className="recipe-warning">
          חלק מהשלבים דורשים אש או סכין — את אלה עושה מבוגר.
        </p>

        <div className="recipe-actions">
          <button className="btn primary big" onClick={onClose} ref={closeRef}>
            {remaining > 0 ? `יופי! ועוד ${remaining} מתכונים` : "יופי!"}
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
