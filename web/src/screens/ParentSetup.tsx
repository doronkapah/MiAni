import { useState } from "react";
import { AvatarArt } from "../art/avatars";
import { Agali } from "../art/Agali";
import { LEVEL_NAMES } from "../../../shared/bank";
import { suggestedLevel, type GroupMode } from "../game/group";
import type { PublicProfile } from "../game/engine";
import * as store from "../store/local";

/** הכנת סבב "הורה שואל": מי משתתף, איך מנקדים, ובאיזו רמה. */
export function ParentSetup({
  profiles,
  onStart,
  onCancel,
}: {
  profiles: PublicProfile[];
  onStart: (input: { profileIds: string[]; mode: GroupMode; level: number }) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<GroupMode>("competitive");
  const [level, setLevel] = useState<number | null>(null);

  const chosen = profiles.filter((profile) => selected.includes(profile.id));
  const suggested = suggestedLevel(
    chosen.map((profile) => store.getProfile(profile.id)!).filter(Boolean),
  );
  const activeLevel = level ?? suggested;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((other) => other !== id) : [...current, id],
    );
  }

  return (
    <div className="picker">
      <header className="picker-head">
        <Agali size={110} mood="thinking" />
        <div>
          <h1>הורה שואל</h1>
          <p>
            אתם מקריאים את הרמזים בקול, הילדים עונים בפה, ואתם מקישים מי פתר. מתאים
            לנסיעה, לארוחה, ולכל רגע שבו אין מקלדת.
          </p>
        </div>
      </header>

      <div className="new-profile">
        <div className="field">
          <span>מי משתתף?</span>
          <div className="avatar-grid">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={`avatar-pick ${selected.includes(profile.id) ? "on" : ""}`}
                onClick={() => toggle(profile.id)}
                aria-pressed={selected.includes(profile.id)}
              >
                <AvatarArt id={profile.avatar} size={60} />
                <small>{profile.name}</small>
              </button>
            ))}
          </div>
          {profiles.length === 0 && (
            <p className="muted">צריך ליצור שחקן אחד לפחות לפני שמתחילים.</p>
          )}
        </div>

        {selected.length > 1 && (
          <div className="field">
            <span>איך מנקדים?</span>
            <div className="mode-cards">
              <button
                className={`mode-card ${mode === "competitive" ? "on" : ""}`}
                onClick={() => setMode("competitive")}
              >
                <strong>🏁 תחרותי</strong>
                <small>מי שפתר ראשון מקבל את הפריט לעגלה שלו. השאר לא.</small>
              </button>
              <button
                className={`mode-card ${mode === "coop" ? "on" : ""}`}
                onClick={() => setMode("coop")}
              >
                <strong>🤝 שיתוף פעולה</strong>
                <small>מספיק שאחד אמר — כולם מקבלים את הפריט. בלי מפסידים.</small>
              </button>
            </div>
          </div>
        )}

        <div className="field">
          <span>רמת קושי</span>
          <div className="chips">
            {[1, 2, 3, 4].map((option) => (
              <button
                key={option}
                className={`chip wide ${activeLevel === option ? "on" : ""}`}
                onClick={() => setLevel(option)}
              >
                {LEVEL_NAMES[option]}
              </button>
            ))}
          </div>
          {chosen.length > 0 && level === null && (
            <p className="muted small">
              נבחרה אוטומטית הרמה של הצעיר ביותר, כדי שכולם יוכלו להשתתף. אפשר לשנות.
            </p>
          )}
        </div>

        <div className="row">
          <button
            className="btn primary big"
            onClick={() => onStart({ profileIds: selected, mode, level: activeLevel })}
            disabled={selected.length === 0}
          >
            מתחילים!
          </button>
          <button className="btn ghost" onClick={onCancel}>
            חזרה
          </button>
        </div>
      </div>
    </div>
  );
}
