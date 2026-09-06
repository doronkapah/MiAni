/**
 * העולמות של המשחק.
 *
 * המנגנון זהה בכל עולם — פריט סודי, רמזים שנחשפים אחד־אחד, אוסף
 * שמצטבר — אבל השפה, האיור והמקומות משתנים. זה מה שמאפשר לאותו
 * משחק לשרת ילד בן חמש שמזהה בננה, ומבוגר שמזהה אצן מ-1968.
 */

export type WorldId = "market" | "space" | "olympics" | "disney";

export interface World {
  id: WorldId;
  /** השם הקצר, לכפתורים */
  name: string;
  /** השם המלא, לכותרות */
  fullName: string;
  icon: string;
  tagline: string;
  /** גילאים שהעולם מתאים להם, לתצוגה בלבד */
  ageHint: string;
  /** איך קוראים ל"מדף" בעולם הזה */
  placeLabel: string;
  /** מה כתוב על השלט כשאסור לרמוז */
  mysteryPlace: string;
  /** משפט הפתיחה במסך ההסבר */
  intro: string;
  /** מה השלט מגלה — גם זה במסך ההסבר */
  placeHint: string;
  /** האוסף שמצטבר */
  /** האוסף. `into` הוא הצורה אחרי למד היחס: "נכנס <into> של דנה" */
  collection: { name: string; icon: string; empty: string; into: string };
  /** מה שנפתח כשאוספים מספיק — מתכון, מסע, נבחרת */
  sets: { name: string; singular: string; icon: string; linesLabel: string };
  /** הרמות שיש בעולם הזה חידות עבורן */
  levels: number[];
}

export const WORLDS: World[] = [
  {
    id: "market",
    name: "הסופר",
    fullName: "חידות בסופר",
    icon: "🛒",
    tagline: "בין המדפים, בין הפירות ובין החטיפים. מכירים כל פריט מהבית.",
    ageHint: "גילאי 4 ומעלה",
    placeLabel: "מדף",
    mysteryPlace: "מדף מסתורי",
    intro: "יש פריט סודי בסופר. הרמזים מספרים עליו, אחד־אחד.",
    placeHint: "הוא מגלה באיזה מעבר בסופר הפריט נמצא.",
    collection: {
      name: "העגלה שלי",
      icon: "🛒",
      empty: "העגלה עוד ריקה. כל פריט שפותרים נכנס לכאן.",
      into: "לעגלה",
    },
    sets: { name: "מתכונים", singular: "מתכון", icon: "📖", linesLabel: "איך מכינים" },
    levels: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "space",
    name: "החלל",
    fullName: "חידות מהחלל",
    icon: "🪐",
    tagline: "כוכבי לכת, ירחים, שמשות ומה שביניהם. מהשמש ועד קצה המערכת.",
    ageHint: "גילאי 6 ומעלה",
    placeLabel: "אזור",
    mysteryPlace: "אי־שם ביקום",
    intro: "יש גרם שמימי סודי אי־שם ביקום. הרמזים מספרים עליו, אחד־אחד.",
    placeHint: "הוא מגלה באיזה אזור ביקום מחפשים.",
    collection: {
      name: "יומן החלל",
      icon: "🔭",
      empty: "היומן עוד ריק. כל גרם שמימי שמזהים נרשם בו.",
      into: "ליומן החלל",
    },
    sets: { name: "מסעות", singular: "מסע", icon: "🚀", linesLabel: "מה יש במסע" },
    levels: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "olympics",
    name: "אולימפיאדה",
    fullName: "חידות אולימפיות",
    icon: "🏅",
    tagline: "ספורטאים, ענפים ורגעים גדולים — ישראלים ובינלאומיים.",
    ageHint: "גילאי 8 ומעלה",
    placeLabel: "ענף",
    mysteryPlace: "ענף עלום",
    intro: "יש ספורטאי, ענף או רגע אולימפי סודי. הרמזים מספרים עליו, אחד־אחד.",
    placeHint: "הוא מגלה באיזה ענף ספורט מדובר.",
    collection: {
      name: "ארון המדליות",
      icon: "🏅",
      empty: "הארון עוד ריק. כל מי שמזהים מקבל בו מקום.",
      into: "לארון המדליות",
    },
    sets: { name: "נבחרות", singular: "נבחרת", icon: "🏆", linesLabel: "על הנבחרת" },
    levels: [2, 3, 4, 5, 6],
  },
  {
    id: "disney",
    name: "דיסני",
    fullName: "חידות דיסני",
    icon: "🏰",
    tagline: "נסיכות, חיות מדברות ונבלים. מהסרטים שכולם גדלו עליהם.",
    ageHint: "גילאי 4 ומעלה",
    placeLabel: "אזור",
    mysteryPlace: "אי־שם בממלכה",
    intro: "יש דמות, סרט או מקום סודי מעולם דיסני. הרמזים מספרים עליו, אחד־אחד.",
    placeHint: "הוא מגלה באיזה אזור בממלכה מחפשים.",
    collection: {
      name: "אלבום הקסם",
      icon: "✨",
      empty: "האלבום עוד ריק. כל מי שמזהים מקבל בו עמוד.",
      into: "לאלבום הקסם",
    },
    sets: { name: "סיפורים", singular: "סיפור", icon: "🎬", linesLabel: "על הסיפור" },
    levels: [1, 2, 3, 4, 5, 6],
  },
];

export const worldById = new Map<string, World>(WORLDS.map((world) => [world.id, world]));

export const DEFAULT_WORLD: WorldId = "market";

export function getWorld(id: string): World {
  return worldById.get(id) ?? WORLDS[0]!;
}

/**
 * שמות הרמות.
 *
 * ניטרליים לעולם בכוונה: "מדף הגן" עבד בסופר ולא עובד בחלל,
 * והמשחק כבר לא רק לילדים.
 */
export const LEVEL_NAMES: Record<number, string> = {
  1: "מתחילים",
  2: "מתקדמים",
  3: "יודעי דבר",
  4: "אלופים",
  5: "מומחים",
  6: "אגדות",
};

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 6;
