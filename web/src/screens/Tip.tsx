import { useCallback, useMemo, useState } from "react";

/**
 * הסבר קצר, ליד הדבר שהוא מסביר — אחד בכל רגע.
 *
 * ההדרכה הקודמת הייתה מודאל של תשעה שלבים לפני החידה הראשונה,
 * וזה הוחלף בטיפים בהקשר. אבל שלושה טיפים שמופיעים יחד הם בדיוק
 * אותה בעיה בתחפושת: הם דחפו את התשובות מתחת לקפל המסך.
 *
 * לכן יש כאן תור: רשימה מסודרת לפי חשיבות, ומוצג ממנה הראשון
 * שרלוונטי ושעוד לא נראה. טיפ נסגר כשהפעולה שהוא מסביר בוצעה —
 * מי שכבר ביקש רמז לא צריך שיסבירו לו על רמזים.
 */

const KEY = "agali:tip";

function seen(profileId: string, id: string): boolean {
  try {
    return localStorage.getItem(`${KEY}:${profileId}:${id}`) === "1";
  } catch {
    // בלי אחסון עדיף לא להציק בכלל מאשר להציק בכל טעינה
    return true;
  }
}

function remember(profileId: string, id: string): void {
  try {
    localStorage.setItem(`${KEY}:${profileId}:${id}`, "1");
  } catch {
    /* אין אחסון — הטיפ פשוט לא ייזכר */
  }
}

/** מאפס את כל הטיפים של שחקן, מלוח ההורים */
export function resetTips(profileId: string): void {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(`${KEY}:${profileId}:`)) localStorage.removeItem(key);
    }
  } catch {
    /* אין אחסון */
  }
}

export interface Candidate {
  id: string;
  /** מוצג רק כשזה נכון — הרגע שבו ההסבר רלוונטי */
  when: boolean;
}

export interface Coach {
  /** מזהה הטיפ היחיד שמוצג עכשיו, אם יש */
  current: string | null;
  /** סוגר טיפ ומסמן שראו אותו — גם כשהפעולה בוצעה בלי לסגור ידנית */
  done: (id: string) => void;
}

/**
 * בוחר טיפ אחד מתוך רשימה מסודרת.
 * הראשון ברשימה שרלוונטי ושעוד לא נראה — וזהו.
 */
export function useCoach(profileId: string, candidates: Candidate[]): Coach {
  const [closed, setClosed] = useState<string[]>([]);

  const done = useCallback(
    (id: string) => {
      remember(profileId, id);
      setClosed((list) => (list.includes(id) ? list : [...list, id]));
    },
    [profileId],
  );

  const current = useMemo(() => {
    for (const candidate of candidates) {
      if (!candidate.when) continue;
      if (closed.includes(candidate.id)) continue;
      if (seen(profileId, candidate.id)) continue;
      return candidate.id;
    }
    return null;
  }, [candidates, closed, profileId]);

  return { current, done };
}

export function Tip({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <p className="tip" role="note">
      <span className="tip-mark" aria-hidden="true">
        💡
      </span>
      <span>{children}</span>
      <button className="tip-close" onClick={onClose} aria-label="הבנתי">
        ×
      </button>
    </p>
  );
}
