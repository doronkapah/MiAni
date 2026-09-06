import { Agali } from "../art/Agali";

/**
 * המסך הראשון, כשעוד אין אף שחקן.
 *
 * עד עכשיו הביקור הראשון נחת ישר בטופס יצירת פרופיל: שם, גיל,
 * דמות — לפני שמישהו ידע בכלל מה המשחק הזה. עכשיו רואים קודם
 * את שלוש הדרכים להיכנס, ואפשר לנסות חידה בלי למסור כלום.
 */
export function Welcome({
  onTry,
  onSolo,
  onParentMode,
  onTerms,
}: {
  onTry: () => void;
  onSolo: () => void;
  onParentMode: () => void;
  onTerms: () => void;
}) {
  return (
    <div className="picker welcome">
      <header className="picker-head">
        <Agali size={130} mood="cheer" />
        <div>
          <h1>מי אני?</h1>
          <p>
            אני חושב על משהו — מוצר מהסופר, כוכב לכת, ספורטאי אולימפי או דמות
            מדיסני — ונותן רמזים עד שתנחשו. ארבעה עולמות, שש רמות, וחידה אחת
            מיוחדת בכל בוקר.
          </p>
        </div>
      </header>

      <div className="entry-cards">
        <button className="entry-card try" onClick={onTry}>
          <span className="entry-icon" aria-hidden="true">
            🎯
          </span>
          <strong>חידה לנסות</strong>
          <small>חידה אחת, כאן ועכשיו. בלי שם ובלי הרשמה.</small>
        </button>

        <button className="entry-card" onClick={onSolo}>
          <span className="entry-icon" aria-hidden="true">
            🧒
          </span>
          <strong>משחק עצמאי</strong>
          <small>הילד קורא ומקליד את התשובות בעצמו.</small>
        </button>

        <button className="entry-card" onClick={onParentMode}>
          <span className="entry-icon" aria-hidden="true">
            🚗
          </span>
          <strong>הורה שואל</strong>
          <small>אתם מקריאים בקול, הילדים עונים בפה. לנסיעה ולארוחה.</small>
        </button>
      </div>

      <p className="welcome-note">
        הכול נשמר על המכשיר הזה בלבד. אין הרשמה, אין פרסומות, ואין איסוף מידע.
      </p>

      <div className="picker-links">
        <button className="link-btn" onClick={onTerms}>
          תנאי שימוש
        </button>
      </div>
    </div>
  );
}
