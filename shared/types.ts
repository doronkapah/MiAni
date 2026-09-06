/** טיפוסים משותפים לשרת ולקליינט. */

/** מצב חידת היום של היום הנוכחי */
export interface DailyState {
  day: string;
  riddleId: string;
  cluesRevealed: number;
  solved: boolean;
  gaveUp: boolean;
  stars: number;
}

export type ArtShape =
  | "bottle" | "carton" | "box" | "bag" | "can" | "jar" | "tub" | "packet"
  | "sack" | "egg" | "bread" | "roundFruit" | "longFruit" | "root" | "leafy"
  | "berry" | "roll" | "cake" | "spiceJar";

export interface Art {
  shape: ArtShape;
  color: string;
}

export interface Riddle {
  id: string;
  /** לאיזה עולם החידה שייכת — market, space, olympics */
  world: string;
  /** 1–4 */
  level: number;
  /** המקום שבו הפריט נמצא — מדף, אזור בחלל, ענף ספורט */
  aisle: string;
  /** התשובה הקנונית, בלי ניקוד */
  answer: string;
  /** אותה תשובה מנוקדת, מוצגת רק אחרי שפותרים */
  answerNikud: string;
  /** תשובות מקבילות שמתקבלות במלואן */
  aliases: string[];
  /** רמזים לפי סדר החשיפה, בלי ניקוד */
  clues: string[];
  /**
   * אותם רמזים בדיוק, מנוקדים — לקוראים המתחילים.
   * חובה ברמות 1–4; ברמות 5–6 מיותר, והשדה פשוט חסר.
   */
  cluesNikud?: string[];
  /**
   * ניחושים הגיוניים שמתאימים לרמזים, ואינם התשובה.
   *
   * "דובדבן" עונה מצוין על "אני עגול ואדום, וגדלתי על עץ" —
   * הוא פשוט לא החידה הזאת. הרשימה נכתבת ביד, בלי AI, והמשחק
   * משתמש בה כדי להודות לילד שהוא חשב נכון, ולהציע רמז שיבדיל.
   */
  alsoFits?: string[];
  /** משפט הסבר קצר שמוצג אחרי הפתרון */
  reveal: string;
  art: Art;
}

export type AddressForm = "male" | "female";

export interface WorldProgress {
  /** דירוג עשרוני; הרמה בפועל היא Math.floor */
  rating: number;
  /** פתרונות חזקים רצופים — לעליית רמה */
  streak: number;
  /** רצף חידות שנפתרו. נשבר בגילוי או בדילוג. */
  answerStreak: number;
}

/**
 * כמה טוב קוראים — קובע ניקוד והקראה, ולא את קושי החידות.
 *   notYet   — עדיין לא קורא: הקראה אוטומטית
 *   learning — מפענח: ניקוד דלוק, הקראה בלחיצה
 *   fluent   — קורא שוטף
 */
export type Reading = "notYet" | "learning" | "fluent";

/** איך עונים: בהקלדה, או בבחירה מתוך תמונות */
export type Answering = "typing" | "pictures";

export interface Profile {
  id: string;
  name: string;
  age: number;
  /** לשון פנייה — בעברית כל פועל בגוף שני מגודר */
  address: AddressForm;
  /** מזהה האווטאר מתוך web/src/art/avatars */
  avatar: string;
  /**
   * התקדמות נפרדת לכל עולם.
   *
   * מיומנות בזיהוי מצרכים היא לא מיומנות בזיהוי כוכבי לכת. ילד
   * שהגיע לרמה 4 בסופר מתחיל את החלל מהתחלה, ולא נזרק לרמה שלא
   * ראה בה שום דבר.
   */
  worlds: Record<string, WorldProgress>;
  /**
   * יכולת קריאה. אופציונלי — פרופילים ישנים נגזרים מהגיל.
   */
  reading?: Reading;
  /** איך עונים על החידה */
  answering?: Answering;
  /** מזהי חידות שנפתרו, לפי סדר */
  solved: string[];
  /** חידות שנחשפו ב"גלה לי" — יחזרו לתור בעוד כמה ימים */
  revealed: { id: string; at: number }[];
  /** מזהי המתכונים שכבר נפתחו */
  recipes: string[];
  createdAt: number;
  /** מונה הודעות צ'אט יומי */
  chat: { day: string; count: number };

  /**
   * חידת היום — מצב היום הנוכחי בלבד.
   *
   * אופציונלי כדי שפרופילים שנוצרו לפני הפיצ'ר ימשיכו לעבוד.
   */
  daily?: DailyState;
  /** כוכבים שנצברו מחידות יום */
  stars?: number;
  /** כמה ימים ברצף נפתרה חידת היום */
  dailyStreak?: number;
  /** הרצף הארוך ביותר עד כה */
  bestDailyStreak?: number;
  /** היום האחרון שבו נפתרה חידת היום */
  lastDailyDay?: string;
}

/** מצב החידה הפעילה, נשמר בשרת בלבד — התשובה לא יוצאת ללקוח */
export interface ActiveRound {
  riddleId: string;
  cluesRevealed: number;
  wrongGuesses: number;
  startedAt: number;
  history: { role: "user" | "assistant"; content: string }[];
}

export type AnswerStatus = "correct" | "close" | "wrong";
