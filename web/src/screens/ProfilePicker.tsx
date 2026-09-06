import { useState } from "react";
import { AVATARS, AVATAR_GROUPS, AvatarArt } from "../art/avatars";
import { Agali } from "../art/Agali";
import { Terms } from "./Terms";
import type { PublicProfile } from "../game/engine";
import {
  ANSWERING_LABELS,
  READING_LABELS,
  defaultReading,
} from "../../../shared/ability";
import type { Answering, Reading } from "../../../shared/types";

// 18 = "מבוגר". החידות של הכוכבים והאולימפיאדה מגיעות לרמות שגם הורים מזיעים בהן.
const AGES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18];
const ADULT = 18;

/** כמה דמויות מוצגות לפני שמבקשים "עוד" — רשת אחת, בלי גלילה */
const FIRST_AVATARS = 8;

export function ProfilePicker({
  profiles,
  startCreating = false,
  onDoneCreating,
  onTry,
  onPick,
  onCreate,
  onDelete,
  onParentPanel,
  onParentMode,
}: {
  profiles: PublicProfile[];
  /** האם להיפתח ישר בטופס — כשהגיעו לכאן מ"משחק עצמאי" */
  startCreating?: boolean;
  onDoneCreating?: () => void;
  onTry?: () => void;
  onPick: (profile: PublicProfile) => void;
  onCreate: (input: {
    name: string;
    age: number;
    address: "male" | "female";
    avatar: string;
    reading: Reading;
    answering: Answering;
  }) => void;
  onDelete: (id: string) => void;
  onParentPanel: () => void;
  onParentMode: () => void;
}) {
  const [creating, setCreating] = useState(startCreating);
  const [allAvatars, setAllAvatars] = useState(false);
  // הגיל רק מציע — אפשר לשנות, וזה נשמר בנפרד ממנו
  const [reading, setReading] = useState<Reading>(defaultReading(7));
  const [answering, setAnswering] = useState<Answering>("typing");
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
      onCreate({ name: name.trim(), age, address, avatar, reading, answering });
      setName("");
      setCreating(false);
      onDoneCreating?.();
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
          <p>אני עגלי. יש לי חידות מהסופר, מהחלל ומהאולימפיאדה.</p>
        </div>
      </header>

      {!creating && (
        <>
          <div className="play-modes">
            <div className="play-mode on">
              <strong>🧒 משחק רגיל</strong>
              <small>בוחרים שחקן, בוחרים עולם, ומקלידים את התשובות.</small>
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
                  <span className="cart-count">🧩 {profile.totalSolved} חידות</span>
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
            {onTry && (
              <button className="link-btn" onClick={onTry}>
                חידה לנסות
              </button>
            )}
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
                  onClick={() => {
                    setAge(option);
                    // הגיל מציע ברירת מחדל, והבחירה למטה גוברת עליה
                    setReading(defaultReading(option));
                    setAnswering(option <= 5 ? "pictures" : "typing");
                  }}
                >
                  {option === ADULT ? "מבוגר" : option}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>קורא/ת כבר?</span>
            <div className="chips">
              {(Object.keys(READING_LABELS) as Reading[]).map((option) => (
                <button
                  key={option}
                  className={`chip wide ${reading === option ? "on" : ""}`}
                  onClick={() => setReading(option)}
                >
                  {READING_LABELS[option].title}
                </button>
              ))}
            </div>
            <p className="muted small">{READING_LABELS[reading].note}</p>
          </div>

          <div className="field">
            <span>איך עונים?</span>
            <div className="chips">
              {(Object.keys(ANSWERING_LABELS) as Answering[]).map((option) => (
                <button
                  key={option}
                  className={`chip wide ${answering === option ? "on" : ""}`}
                  onClick={() => setAnswering(option)}
                >
                  {ANSWERING_LABELS[option].title}
                </button>
              ))}
            </div>
            <p className="muted small">{ANSWERING_LABELS[answering].note}</p>
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
            {/*
              עשרים ושבע דמויות במסך אחד הן לא בחירה, הן עיכוב. מראים
              שמונה — מספיק כדי למצוא משהו שאוהבים — והשאר מחכה למי שרוצה.
            */}
            {!allAvatars ? (
              <>
                <div className="avatar-grid">
                  {AVATARS.slice(0, FIRST_AVATARS).map((option) => (
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
                <button className="link-btn" onClick={() => setAllAvatars(true)}>
                  עוד דמויות ({AVATARS.length - FIRST_AVATARS})
                </button>
              </>
            ) : (
              AVATAR_GROUPS.map((group) => (
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
              ))
            )}
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
