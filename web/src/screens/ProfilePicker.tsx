import { useState } from "react";
import { AVATARS, AVATAR_GROUPS, AvatarArt } from "../art/avatars";
import { Agali } from "../art/Agali";
import { Terms } from "./Terms";
import type { PublicProfile } from "../game/engine";

const AGES = [4, 5, 6, 7, 8, 9, 10];

export function ProfilePicker({
  profiles,
  onPick,
  onCreate,
  onDelete,
  onParentPanel,
  onParentMode,
}: {
  profiles: PublicProfile[];
  onPick: (profile: PublicProfile) => void;
  onCreate: (input: {
    name: string;
    age: number;
    address: "male" | "female";
    avatar: string;
  }) => void;
  onDelete: (id: string) => void;
  onParentPanel: () => void;
  onParentMode: () => void;
}) {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [age, setAge] = useState(7);
  const [address, setAddress] = useState<"male" | "female">("female");
  const [avatar, setAvatar] = useState(AVATARS[0]!.id);
  const [busy, setBusy] = useState(false);
  const [managing, setManaging] = useState(false);
  const [terms, setTerms] = useState(false);

  function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      onCreate({ name: name.trim(), age, address, avatar });
      setName("");
      setCreating(false);
    } finally {
      setBusy(false);
    }
  }

  if (terms) return <Terms onClose={() => setTerms(false)} />;

  return (
    <div className="picker">
      <header className="picker-head">
        <Agali size={130} mood="cheer" />
        <div>
          <h1>מי משחק היום?</h1>
          <p>אני עגלי, ואני מחכה לכם ליד המדפים.</p>
        </div>
      </header>

      {!creating && (
        <>
          <div className="play-modes">
            <div className="play-mode on">
              <strong>🧒 ילד משחק</strong>
              <small>בוחרים שחקן ומתחילים. הילד מקליד את התשובות.</small>
            </div>
            <button className="play-mode" onClick={onParentMode}>
              <strong>🚗 הורה שואל</strong>
              <small>אתם מקריאים, הילדים עונים בפה. לנסיעה ולארוחה.</small>
            </button>
          </div>

          <div className="profile-grid">
            {profiles.map((profile) => (
              <div className="profile-card-wrap" key={profile.id}>
                <button className="profile-card" onClick={() => onPick(profile)}>
                  <AvatarArt id={profile.avatar} size={92} />
                  <strong>{profile.name}</strong>
                  <span className="level-pill">{profile.levelName}</span>
                  <span className="cart-count">🛒 {profile.solvedCount}</span>
                </button>
                {managing && (
                  <button
                    className="delete-btn"
                    onClick={() => onDelete(profile.id)}
                    aria-label={`מחיקת הפרופיל של ${profile.name}`}
                  >
                    מחיקה
                  </button>
                )}
              </div>
            ))}
            <button className="profile-card new" onClick={() => setCreating(true)}>
              <span className="plus">+</span>
              <strong>שחקן חדש</strong>
            </button>
          </div>
          <div className="picker-links">
            {profiles.length > 0 && (
              <button className="link-btn" onClick={() => setManaging((m) => !m)}>
                {managing ? "סיימתי" : "עריכת שחקנים"}
              </button>
            )}
            <button className="link-btn" onClick={onParentPanel}>
              לוח הורים
            </button>
            <button className="link-btn" onClick={() => setTerms(true)}>
              תנאי שימוש
            </button>
          </div>
        </>
      )}

      {creating && (
        <div className="new-profile">
          <label className="field">
            <span>איך קוראים לך?</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              placeholder="השם שלי"
              autoFocus
            />
          </label>

          <div className="field">
            <span>בן או בת כמה?</span>
            <div className="chips">
              {AGES.map((option) => (
                <button
                  key={option}
                  className={`chip ${age === option ? "on" : ""}`}
                  onClick={() => setAge(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>איך לפנות אליך?</span>
            <div className="chips">
              <button
                className={`chip wide ${address === "female" ? "on" : ""}`}
                onClick={() => setAddress("female")}
              >
                בלשון נקבה
              </button>
              <button
                className={`chip wide ${address === "male" ? "on" : ""}`}
                onClick={() => setAddress("male")}
              >
                בלשון זכר
              </button>
            </div>
          </div>

          <div className="field">
            <span>בחרו דמות</span>
            {AVATAR_GROUPS.map((group) => (
              <div className="avatar-group" key={group.title}>
                <h3 className="avatar-group-title">{group.title}</h3>
                <div className="avatar-grid">
                  {group.avatars.map((option) => (
                    <button
                      key={option.id}
                      className={`avatar-pick ${avatar === option.id ? "on" : ""}`}
                      onClick={() => setAvatar(option.id)}
                      aria-label={option.label}
                      title={option.label}
                    >
                      <AvatarArt id={option.id} size={64} />
                      <small>{option.label}</small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <button className="btn primary big" onClick={submit} disabled={!name.trim() || busy}>
              יאללה, מתחילים!
            </button>
            {profiles.length > 0 && (
              <button className="btn ghost" onClick={() => setCreating(false)}>
                ביטול
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
