import { useState } from "react";
import { RecipeArt } from "../art/RecipeArt";
import { recipeById } from "../../../shared/recipes";
import type { RecipeProgress } from "../../../shared/recipes";
import { RecipeModal } from "./RecipeModal";

/**
 * ספר המתכונים.
 *
 * מתכון נעול מציג רק כמה מצרכים חסרים, אף פעם לא אילו — שם של
 * מצרך חסר הוא תשובה לחידה שהילד עוד לא פתר.
 */
export function RecipeBook({
  recipes,
  nikud,
  onClose,
}: {
  recipes: RecipeProgress[];
  nikud: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const openRecipe = open ? recipeById.get(open) : undefined;

  if (openRecipe) {
    return (
      <RecipeModal
        recipe={openRecipe}
        nikud={nikud}
        remaining={0}
        onClose={() => setOpen(null)}
      />
    );
  }

  const unlocked = recipes.filter((recipe) => recipe.unlocked).length;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="recipe-book"
        role="dialog"
        aria-modal="true"
        aria-label="ספר המתכונים"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="book-head">
          <h1>📖 ספר המתכונים</h1>
          <span className="book-count">
            {unlocked} מתוך {recipes.length}
          </span>
        </header>

        <p className="muted">
          כל מתכון נפתח לבד, ברגע שכל המצרכים שלו נמצאים בעגלה.
        </p>

        <ul className="book-list">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              {recipe.unlocked ? (
                <button className="book-card open" onClick={() => setOpen(recipe.id)}>
                  <RecipeArt art={recipe.art} size={64} />
                  <span className="book-text">
                    <strong>{recipe.name}</strong>
                    <small>{recipe.teaser}</small>
                  </span>
                  <span className="book-open">פתוח ✓</span>
                </button>
              ) : (
                <div className="book-card locked">
                  <span className="book-lock" aria-hidden="true">
                    🔒
                  </span>
                  <span className="book-text">
                    <strong>???</strong>
                    <small>
                      חסרים עוד {recipe.needed - recipe.held} מצרכים מתוך {recipe.needed}
                    </small>
                  </span>
                  <span className="book-progress" aria-hidden="true">
                    <span style={{ width: `${(recipe.held / recipe.needed) * 100}%` }} />
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>

        <button className="btn primary big" onClick={onClose}>
          חזרה למשחק
        </button>
      </div>
    </div>
  );
}
