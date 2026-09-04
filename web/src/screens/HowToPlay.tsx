/**
 * ההסבר לשחקן חדש.
 *
 * מוצג פעם אחת לכל פרופיל, וזמין תמיד דרך הכפתור "?" בסרגל העליון.
 * קצר בכוונה: שישה משפטים, כל אחד צמוד לדבר שהוא מסביר. ילד בן חמש
 * לא קורא מסך הסבר ארוך, ואם צריך אותו — משהו במשחק לא ברור מספיק.
 */

const STEPS: { icon: string; title: string; text: string }[] = [
  {
    icon: "🕵️",
    title: "מי אני?",
    text: "יש פריט סודי בסופר. הרמזים מספרים עליו, אחד־אחד.",
  },
  {
    icon: "🏷️",
    title: "השלט על המדף",
    text: "הוא מגלה באיזה מעבר הפריט נמצא. ככל שהרמה עולה — הוא מגלה פחות.",
  },
  {
    icon: "✏️",
    title: "בדקו!",
    text: "כותבים את הניחוש. גם אם יש שגיאת כתיב — נבין מה התכוונתם.",
  },
  {
    icon: "💡",
    title: "עוד רמז",
    text: "נתקעתם? כל לחיצה חושפת רמז נוסף.",
  },
  {
    icon: "🛒",
    title: "עגלי",
    text: "אפשר לשאול אותו כל שאלה על הפריט — חוץ מהתשובה עצמה. אותה הוא לא יגלה.",
  },
  {
    icon: "📖",
    title: "העגלה והמתכונים",
    text: "כל פריט שפותרים נכנס לעגלה. כשמצטברים המצרכים של מנה — נפתח מתכון חדש!",
  },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
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
