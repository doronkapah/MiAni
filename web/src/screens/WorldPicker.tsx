import { AvatarArt } from "../art/avatars";
import { Product } from "../art/Product";
import { WORLDS } from "../../../shared/worlds";
import { levelsInWorld, worldRiddles } from "../../../shared/bank";
import { levelOf, progressIn } from "../../../shared/difficulty";
import { LEVEL_NAMES } from "../../../shared/worlds";
import type { Profile } from "../../../shared/types";
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
};

export function WorldPicker({
  profile,
  onPick,
  onBack,
}: {
  profile: Profile;
  onPick: (world: string) => void;
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

      <div className="world-grid">
        {WORLDS.map((world) => {
          const progress = progressIn(profile, world.id);
          const level = levelOf(progress.rating);
          const total = worldRiddles(world.id).length;
          const solved = profile.solved.filter(
            (id) => riddleById.get(id)?.world === world.id,
          ).length;
          const started = solved > 0;
          const levels = levelsInWorld(world.id);

          return (
            <button
              className={`world-card world-${world.id}`}
              key={world.id}
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
                <span className="world-pill">{total} חידות</span>
                <span className="world-pill">
                  רמות {levels[0]}–{levels[levels.length - 1]}
                </span>
              </span>

              <span className="world-status">
                {started ? (
                  <>
                    <b>{LEVEL_NAMES[level]}</b> · פתרתם {solved} מתוך {total}
                  </>
                ) : (
                  "עוד לא התחלתם כאן"
                )}
              </span>

              {started && (
                <span className="world-bar" aria-hidden="true">
                  <span style={{ width: `${Math.round((solved / total) * 100)}%` }} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button className="link-btn" onClick={onBack}>
        החלפת שחקן
      </button>
    </div>
  );
}
