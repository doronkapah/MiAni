/** טיפוסים משותפים לשרת ולקליינט. */

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
  /** 1–4 */
  level: number;
  /** המדף שבו הפריט נמצא, מוצג לילד אחרי הפתרון */
  aisle: string;
  /** התשובה הקנונית, בלי ניקוד */
  answer: string;
  /** אותה תשובה מנוקדת, מוצגת רק אחרי שפותרים */
  answerNikud: string;
  /** תשובות מקבילות שמתקבלות במלואן */
  aliases: string[];
  /** רמזים לפי סדר החשיפה, בלי ניקוד */
  clues: string[];
  /** אותם רמזים בדיוק, מנוקדים — לקוראים המתחילים */
  cluesNikud?: string[];
  /** משפט הסבר קצר שמוצג אחרי הפתרון */
  reveal: string;
  art: Art;
}

export type AddressForm = "male" | "female";

export interface Profile {
  id: string;
  name: string;
  age: number;
  /** לשון פנייה — בעברית כל פועל בגוף שני מגודר */
  address: AddressForm;
  /** מזהה האווטאר מתוך web/src/art/avatars */
  avatar: string;
  /** דירוג עשרוני; הרמה בפועל היא Math.floor, מוגבל ל-1..4 */
  rating: number;
  /** מספר פתרונות רצופים בקצה העליון של הרמה — לעליית רמה */
  streak: number;
  /** רצף חידות שנפתרו ברצף. נשבר בגילוי או בדילוג. */
  answerStreak: number;
  /** מזהי חידות שנפתרו, לפי סדר */
  solved: string[];
  /** חידות שנחשפו ב"גלה לי" — יחזרו לתור בעוד כמה ימים */
  revealed: { id: string; at: number }[];
  /** מזהי המתכונים שכבר נפתחו */
  recipes: string[];
  createdAt: number;
  /** מונה הודעות צ'אט יומי */
  chat: { day: string; count: number };
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
