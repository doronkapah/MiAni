/**
 * ההסבר לשחקן חדש.
 *
 * מוצג פעם אחת לכל פרופיל, וזמין תמיד דרך הכפתור "?" בסרגל העליון.
 * קצר בכוונה: שישה משפטים, כל אחד צמוד לדבר שהוא מסביר. ילד בן חמש
 * לא קורא מסך הסבר ארוך, ואם צריך אותו — משהו במשחק לא ברור מספיק.
 */

import { FEATURES } from "../config";
import { getWorld, type World } from "../../../shared/worlds";

type Step = { icon: string; title: string; text: string; needsChat?: boolean };

/* ההסבר מדבר בשפה של העולם שנמצאים בו — "מעבר בסופר" בסופר, "אזור ביקום" בחלל */
const allSteps = (world: World): Step[] => [
  {
    icon: "🕵️",
    title: "מי אני?",
    text: world.intro,
  },
  {
    icon: "🏷️",
    title: `השלט על ה${world.placeLabel}`,
    text: `${world.placeHint} ככל שהרמה עולה — הוא מגלה פחות.`,
  },
  {
    icon: "✏️",
    title: "בדקו!",
    text: "כותבים את הניחוש. גם אם יש שגיאת כתיב — נבין מה התכוונתם.",
  },
  {
    icon: "💡",
    title: "עוד רמז",
    text: "נתקעתם? כל לחיצה חושפת רמז נוסף. ואם החידה לא מוצאת חן — יש כפתור דילוג.",
  },
  {
    icon: "📤",
    title: "שיתוף",
    text: "אפשר לשלוח את החידה לחבר בוואטסאפ ולבקש עזרה. התשובה לא נשלחת איתה.",
  },
  {
    icon: "🔥",
    title: "רצף",
    text: "כל תשובה נכונה ברצף מגדילה את המונה. פתרון בלי רמזים הוא הכי מרשים.",
  },
  {
    icon: "🛒",
    title: "עגלי",
    text: "אפשר לשאול אותו כל שאלה על הפריט — חוץ מהתשובה עצמה. אותה הוא לא יגלה.",
    needsChat: true,
  },
  {
    icon: world.sets.icon,
    title: `${world.collection.name} ו${world.sets.name}`,
    text: `כל מה שפותרים נכנס ${world.collection.into}. כשמצטברים מספיק — נפתח ${world.sets.singular} חדש!`,
  },
];

/** מסתירים את עגלי כשהצ'אט כבוי, כדי לא להבטיח כפתור שלא קיים */
function stepsFor(world: World): Step[] {
  return allSteps(world).filter((step) => !step.needsChat || FEATURES.agaliChat);
}

export function HowToPlay({
  world,
  onClose,
}: {
  world?: string;
  onClose: () => void;
}) {
  const STEPS = stepsFor(getWorld(world ?? ""));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="howto"
        role="dialog"
        aria-modal="true"
        aria-label="איך משחקים"
        onClick={(event) => event.stopPropagation()}
      >
        <h1>איך משחקים?</h1>

        <ul className="howto-list">
          {STEPS.map((step) => (
            <li key={step.title}>
              <span className="howto-icon" aria-hidden="true">
                {step.icon}
              </span>
              <span className="howto-text">
                <strong>{step.title}</strong>
                <small>{step.text}</small>
              </span>
            </li>
          ))}
        </ul>

        <button className="btn primary big" onClick={onClose} autoFocus>
          יאללה, מתחילים!
        </button>
      </div>
    </div>
  );
}

const SEEN_KEY = "agali:howto";

export function hasSeenHowTo(profileId: string): boolean {
  try {
    return localStorage.getItem(`${SEEN_KEY}:${profileId}`) === "1";
  } catch {
    return true;
  }
}

export function markHowToSeen(profileId: string): void {
  try {
    localStorage.setItem(`${SEEN_KEY}:${profileId}`, "1");
  } catch {
    // גלישה פרטית — ההסבר פשוט יופיע שוב
  }
}
