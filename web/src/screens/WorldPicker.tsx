import { AvatarArt } from "../art/avatars";
import { Product } from "../art/Product";
import { WORLDS } from "../../../shared/worlds";
import { levelsInWorld } from "../../../shared/bank";
import { levelOf, progressIn, progressInLevel } from "../../../shared/difficulty";
import { LEVEL_NAMES } from "../../../shared/worlds";
import type { Profile } from "../../../shared/types";
import type { DailyView } from "../game/engine";
import { riddleById } from "../../../shared/bank";

/**
 * בחירת עולם.
 *
 * לכל עולם התקדמות משלו, ולכן הכרטיס מראה איפה השחקן עומד *שם* —
 * לא בסך הכול. ילד שהגיע לרמה 4 בסופר מתחיל את החלל מהתחלה.
 */

const SAMPLE: Record<string, { shape: string; color: string }[]> = {
  market: [
    { shape: "roundFruit", color: "#D6402C" },
    { shape: "carton", color: "#DCE8F2" },
    { shape: "bread", color: "#C4894A" },
  ],
  space: [
    { shape: "ringedPlanet", color: "#E0C88A" },
    { shape: "star", color: "#F5C518" },
    { shape: "rocket", color: "#DCE4EC" },
  ],
  olympics: [
    { shape: "medal", color: "#F5C518" },
    { shape: "torch", color: "#E8703A" },
    { shape: "ball", color: "#E8843A" },
  ],
  disney: [
    { shape: "castle", color: "#B9C7E8" },
    { shape: "wand", color: "#F5C518" },
    { shape: "ears", color: "#2E2E2E" },
  ],
};

export function WorldPicker({
  profile,
  daily,
  onPick,
  onDaily,
  onShift,
  onBack,
}: {
  profile: Profile;
  daily: DailyView;
  onPick: (world: string) => void;
  onDaily: () => void;
  /** שינוי קושי מפורש, לעולם מסוים */
  onShift: (world: string, direction: 1 | -1) => void;
  onBack: () => void;
}) {
  return (
    <div className="picker">
      <header className="picker-head">
        <AvatarArt id={profile.avatar} size={90} />
        <div>
          <h1>לאן היום, {profile.name}?</h1>
          <p>לכל עולם חידות משלו, והתקדמות משלו. אפשר להחליף מתי שרוצים.</p>
        </div>
      </header>

      {/*
        חידת היום יושבת מעל הרשת ולא בתוכה: היא לא עולם, היא הדבר
        היחיד שמשתנה מעצמו כל בוקר.
      */}
      <button
        className={`daily-card ${daily.done ? "done" : ""}`}
        onClick={onDaily}
        disabled={daily.done || daily.gaveUp}
      >
        <span className="daily-star" aria-hidden="true">
          {daily.done ? "⭐" : "🌅"}
        </span>
        <span className="daily-text">
          <strong>חידת היום</strong>
          <small>
            {daily.done
              ? `נפתרה! ${"⭐".repeat(daily.stars)}`
              : daily.gaveUp
                ? "נגמרה להיום. מחר יש חדשה"
                : "חידה אחת ביום, וכוכבים על פתרון"}
          </small>
        </span>
        <span className="daily-score">
          <b>{daily.total}</b>
          <small>{daily.total === 1 ? "כוכב" : "כוכבים"}</small>
          {daily.streak > 1 && <em>🔥 {daily.streak} ימים</em>}
        </span>
      </button>

      {/* איך נצברים הכוכבים — קצר, וליד המקום שבו הם מוצגים */}
      <p className="daily-rule">
        ⭐⭐⭐ פתרון מהרמז הראשון · ⭐⭐ אחרי רמז · ⭐ אחרי שניים
      </p>

      <div className="world-grid">
        {WORLDS.map((world) => {
          const progress = progressIn(profile, world.id);
          const level = levelOf(progress.rating);
          const solved = profile.solved.filter(
            (id) => riddleById.get(id)?.world === world.id,
          ).length;
          const started = solved > 0;
          const levels = levelsInWorld(world.id);

          return (
            <div className="world-slot" key={world.id}>
            <button
              className={`world-card world-${world.id}`}
              onClick={() => onPick(world.id)}
            >
              <span className="world-icon" aria-hidden="true">
                {world.icon}
              </span>
              <strong>{world.fullName}</strong>
              <small className="world-tagline">{world.tagline}</small>

              <span className="world-art" aria-hidden="true">
                {SAMPLE[world.id]?.map((item, index) => (
                  <Product key={index} shape={item.shape} color={item.color} size={46} />
                ))}
              </span>

              <span className="world-meta">
                <span className="world-pill">{world.ageHint}</span>
                <span className="world-pill">
                  רמות {levels[0]}–{levels[levels.length - 1]}
                </span>
              </span>

              <span className="world-status">
                {started ? (
                  <>
                    <b>{LEVEL_NAMES[level]}</b> · {solved} פתורות
                  </>
                ) : (
                  "עוד לא התחלתם כאן"
                )}
              </span>

              {started && (
                <span className="world-bar" aria-hidden="true">
                  {/* ההתקדמות בתוך הרמה הנוכחית, ולא מתוך הבנק */}
                  <span
                    style={{ width: `${Math.round(progressInLevel(progress.rating) * 100)}%` }}
                  />
                </span>
              )}
            </button>

            {/*
              שינוי הקושי יושב מחוץ לכרטיס בכוונה: כרטיס שלוחצים עליו
              כדי להיכנס לא יכול להכיל כפתורים שעושים משהו אחר.
            */}
            <div className="level-shift">
              <button
                onClick={() => onShift(world.id, -1)}
                disabled={level <= levels[0]!}
                aria-label={`${world.name}: קל יותר`}
              >
                קל יותר
              </button>
              <b>{LEVEL_NAMES[level]}</b>
              <button
                onClick={() => onShift(world.id, 1)}
                disabled={level >= levels[levels.length - 1]!}
                aria-label={`${world.name}: קשה יותר`}
              >
                קשה יותר
              </button>
            </div>
            </div>
          );
        })}
      </div>

      <button className="link-btn" onClick={onBack}>
        החלפת שחקן
      </button>
    </div>
  );
}
