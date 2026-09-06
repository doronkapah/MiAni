import { useState } from "react";
import { RecipeArt } from "../art/RecipeArt";
import { Product } from "../art/Product";
import { recipeById } from "../../../shared/recipes";
import type { RecipeProgress } from "../../../shared/recipes";
import { RecipeModal } from "./RecipeModal";
import { getWorld } from "../../../shared/worlds";
import { WORDS, count } from "../../../shared/hebrew";

/**
 * ספר המתכונים.
 *
 * מתכון נעול מציג רק כמה מצרכים חסרים, אף פעם לא אילו — שם של
 * מצרך חסר הוא תשובה לחידה שהילד עוד לא פתר.
 */
export function RecipeBook({
  recipes,
  world,
  nikud,
  onClose,
}: {
  recipes: RecipeProgress[];
  world: string;
  nikud: boolean;
  onClose: () => void;
}) {
  const info = getWorld(world);
  const [open, setOpen] = useState<string | null>(null);
  const openRecipe = open ? recipeById.get(open) : undefined;

  if (openRecipe) {
    return (
      <RecipeModal
        recipe={openRecipe}
        nikud={nikud}
        world={world}
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
        aria-label={info.sets.name}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="book-head">
          <h1>
            {info.sets.icon} {info.sets.name}
          </h1>
          <span className="book-count">
            {unlocked} מתוך {recipes.length}
          </span>
        </header>

        <p className="muted">
          כל {info.sets.singular} נפתח לבד, ברגע שכל הפריטים שלו נאספו.
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
                /*
                  סט נעול מציג את שמו ואת האיור שלו.
                  "???" הפך את היעד לחסר משמעות: פס היעד במסך המשחק
                  אמר "סלט פירות", וכאן זה נראה כמו משהו אחר לגמרי.
                  מה שנשאר מוסתר הוא רק *שמות* הפריטים החסרים —
                  אלה תשובות של חידות שעוד לא נשאלו.
                */
                <div className="book-card locked">
                  <RecipeArt art={recipe.art} size={64} />
                  <span className="book-text">
                    <strong>{recipe.name}</strong>
                    <small>
                      {recipe.held > 0
                        ? `נאספו ${recipe.held} מתוך ${recipe.needed}`
                        : `${count(recipe.needed, WORDS.item)} לאסוף`}
                    </small>
                    <span className="book-slots">
                      {Array.from({ length: recipe.needed }, (_, index) => {
                        const item = recipe.have[index];
                        return item ? (
                          <span className="goal-dot on" key={item.id} title={item.answer}>
                            <Product shape={item.art.shape} color={item.art.color} size={20} />
                          </span>
                        ) : (
                          <span className="goal-dot" key={`empty-${index}`} />
                        );
                      })}
                    </span>
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
