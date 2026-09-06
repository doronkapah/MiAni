import { useEffect, useState } from "react";

/**
 * הסבר קצר, ליד הדבר שהוא מסביר.
 *
 * ההדרכה הקודמת הייתה מודאל של תשעה שלבים שנפתח לפני החידה
 * הראשונה — כלומר לפני שלמישהו היה הקשר להיתלות בו. ילד בן חמש
 * לא קורא מסך הסבר, והורה סוגר אותו כדי להתחיל לשחק.
 *
 * במקום זה: משפט אחד, מופיע ברגע שהדבר רלוונטי, ונעלם אחרי
 * שראו אותו. כל טיפ נספר פעם אחת לכל שחקן.
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
    /* אין אחסון — הטיפ פשוט לא יזכר */
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

export function Tip({
  id,
  profileId,
  when = true,
  children,
}: {
  /** מזהה הטיפ, כדי לזכור שראו אותו */
  id: string;
  profileId: string;
  /** מציגים רק כשזה נכון — הרגע שבו ההסבר רלוונטי */
  when?: boolean;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!when || seen(profileId, id)) return;
    setShow(true);
    remember(profileId, id);
  }, [when, profileId, id]);

  if (!show) return null;

  return (
    <p className="tip" role="note">
      <span className="tip-mark" aria-hidden="true">
        💡
      </span>
      <span>{children}</span>
      <button className="tip-close" onClick={() => setShow(false)} aria-label="הבנתי">
        ×
      </button>
    </p>
  );
}
