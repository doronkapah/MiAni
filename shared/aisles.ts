/**
 * המדפים של הסופר.
 *
 * לאיור של המדף יש עכשיו תפקיד: הוא מראה באיזה מעבר הפריט נמצא,
 * והמוצרים שעליו מתאימים למעבר הזה. זה רמז חזותי אמיתי — ילד בן
 * חמש שרואה מדף פירות וירקות כבר יודע לאן לכוון.
 *
 * ככל שהרמה עולה הרמז נחלש: ברמה 3 מוצג רק האזור הכללי, וברמה 4
 * לא מוצג כלום. אלוף הסופר צריך להסתדר עם המילים בלבד.
 */

export interface DecorItem {
  shape: string;
  color: string;
}

/** מוצרי הרקע של כל מעבר — קישוט, אבל קישוט שמספר משהו */
export const AISLE_DECOR: Record<string, DecorItem[]> = {
  "פירות וירקות": [
    { shape: "roundFruit", color: "#D6402C" },
    { shape: "longFruit", color: "#F2C53D" },
    { shape: "root", color: "#E5781C" },
    { shape: "leafy", color: "#4E9A3E" },
    { shape: "berry", color: "#7B3F98" },
    { shape: "roundFruit", color: "#F08A24" },
  ],
  "יבשים": [
    { shape: "sack", color: "#EFE6D2" },
    { shape: "box", color: "#E0A040" },
    { shape: "packet", color: "#E8C87A" },
    { shape: "bag", color: "#C08A4A" },
    { shape: "spiceJar", color: "#B4452A" },
    { shape: "jar", color: "#D99A2B" },
  ],
  "מקרר": [
    { shape: "carton", color: "#DCE8F2" },
    { shape: "tub", color: "#F6F4EA" },
    { shape: "packet", color: "#EFC7B0" },
    { shape: "egg", color: "#F0DFC0" },
    { shape: "tub", color: "#F3F0E4" },
    { shape: "packet", color: "#F0D078" },
  ],
  "מקפיא": [
    { shape: "tub", color: "#F4C6D5" },
    { shape: "box", color: "#BFE3F2" },
    { shape: "packet", color: "#A8C6D8" },
    { shape: "box", color: "#CFE6F5" },
    { shape: "bag", color: "#9EC0D6" },
  ],
  "מאפייה": [
    { shape: "bread", color: "#C4894A" },
    { shape: "bread", color: "#D8A755" },
    { shape: "cake", color: "#E8A0B4" },
    { shape: "packet", color: "#E0BC8E" },
    { shape: "bread", color: "#B4763A" },
  ],
  "משקאות": [
    { shape: "bottle", color: "#79C6E8" },
    { shape: "bottle", color: "#F08A24" },
    { shape: "jar", color: "#4A2C18" },
    { shape: "box", color: "#B5652E" },
    { shape: "bottle", color: "#C42B22" },
  ],
  "ממתקים": [
    { shape: "packet", color: "#6B4226" },
    { shape: "packet", color: "#3B2418" },
    { shape: "box", color: "#E8A0B4" },
    { shape: "packet", color: "#C8945A" },
    { shape: "bag", color: "#D6304A" },
  ],
  "חטיפים": [
    { shape: "bag", color: "#F5A623" },
    { shape: "bag", color: "#D6402C" },
    { shape: "bag", color: "#4E9A3E" },
    { shape: "packet", color: "#F0C74A" },
    { shape: "bag", color: "#6FB8E8" },
  ],
  "שימורים": [
    { shape: "can", color: "#9BA7B0" },
    { shape: "can", color: "#F2C230" },
    { shape: "can", color: "#D9C79A" },
    { shape: "jar", color: "#4C6B2F" },
    { shape: "can", color: "#C62D25" },
  ],
  "פיצוחים": [
    { shape: "bag", color: "#A9703C" },
    { shape: "bag", color: "#6B5B45" },
    { shape: "bag", color: "#C9A87C" },
    { shape: "bag", color: "#7A4520" },
    { shape: "sack", color: "#D2743B" },
  ],
  "רטבים": [
    { shape: "bottle", color: "#C42B22" },
    { shape: "jar", color: "#F5EEDC" },
    { shape: "bottle", color: "#D8B31E" },
    { shape: "jar", color: "#D8CBA8" },
    { shape: "bottle", color: "#97A83A" },
  ],
  "ניקיון": [
    { shape: "bottle", color: "#3FA9A0" },
    { shape: "box", color: "#3A6FB0" },
    { shape: "bottle", color: "#E8709C" },
    { shape: "box", color: "#8A6FC4" },
    { shape: "bottle", color: "#59B7D8" },
  ],
  "כלי בית": [
    { shape: "roll", color: "#F5F2EC" },
    { shape: "roll", color: "#C7CDD2" },
    { shape: "roll", color: "#F2EDE1" },
    { shape: "box", color: "#D9D3CC" },
    { shape: "packet", color: "#B8C2C9" },
  ],
};

/** מוצרים חסרי זהות, למדף שלא אמור לרמוז */
const NEUTRAL_DECOR: DecorItem[] = [
  { shape: "box", color: "#CBC6BC" },
  { shape: "can", color: "#B9BFC4" },
  { shape: "bottle", color: "#C6CDD2" },
  { shape: "packet", color: "#D2CCC1" },
  { shape: "jar", color: "#C2BDB2" },
  { shape: "sack", color: "#D8D2C6" },
];

/** האזור הרחב שאליו שייך המעבר — הרמז החלש של רמה 3 */
const ZONES: Record<string, string> = {
  "פירות וירקות": "מזון טרי",
  "מקרר": "מזון טרי",
  "מקפיא": "מזון טרי",
  "מאפייה": "מזון טרי",
  "יבשים": "מדפי היבשים",
  "שימורים": "מדפי היבשים",
  "פיצוחים": "מדפי היבשים",
  "רטבים": "מדפי היבשים",
  // משקאות נכנס לאותו אזור עם המתוקים בכוונה: כשהוא לבד, שם האזור
  // זהה לשם המעבר, והרמז של רמה 3 לא נחלש בכלל.
  "ממתקים": "מתוקים, חטיפים ומשקאות",
  "חטיפים": "מתוקים, חטיפים ומשקאות",
  "משקאות": "מתוקים, חטיפים ומשקאות",
  "ניקיון": "לא לאכילה",
  "כלי בית": "לא לאכילה",
};

export interface AisleView {
  /** מה כתוב על שלט המדף */
  sign: string;
  decor: DecorItem[];
  /** האם השלט מסגיר את המעבר המדויק */
  precise: boolean;
}

/**
 * מה מציגים על המדף, לפי הרמה.
 *
 * רמות 1–2: המעבר המדויק, עם מוצרים שמתאימים לו.
 * רמה 3: רק האזור הכללי, עם מוצרים ניטרליים.
 * רמה 4: שום דבר. אלוף הסופר עובד עם המילים בלבד.
 */
export function aisleView(aisle: string, level: number): AisleView {
  if (level <= 2) {
    return {
      sign: aisle,
      decor: AISLE_DECOR[aisle] ?? NEUTRAL_DECOR,
      precise: true,
    };
  }
  if (level === 3) {
    return { sign: ZONES[aisle] ?? "אי־שם בסופר", decor: NEUTRAL_DECOR, precise: false };
  }
  return { sign: "מדף מסתורי", decor: NEUTRAL_DECOR, precise: false };
}

/** אחרי הפתרון תמיד מראים את המעבר האמיתי */
export function solvedAisleView(aisle: string): AisleView {
  return { sign: aisle, decor: AISLE_DECOR[aisle] ?? NEUTRAL_DECOR, precise: true };
}
