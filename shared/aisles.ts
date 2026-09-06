/**
 * המקומות שבכל עולם.
 *
 * לאיור יש תפקיד: השלט והפריטים סביבו מראים איפה הפריט הסודי נמצא —
 * מדף בסופר, אזור ביקום, ענף ספורט. הרמז נחלש ככל שהרמה עולה:
 * ברמות 1–2 המקום המדויק, ברמה 3 האזור הכללי, ומרמה 4 שום דבר.
 */

import type { WorldId } from "./worlds";
import { getWorld } from "./worlds";

export interface DecorItem {
  shape: string;
  color: string;
}

type PlaceMap = Record<string, DecorItem[]>;

/** מוצרי הרקע של כל מעבר בסופר */
const MARKET: PlaceMap = {
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

/** אזורי היקום */
const SPACE: PlaceMap = {
  "המערכת הפנימית": [
    { shape: "planet", color: "#B08A5E" },
    { shape: "planet", color: "#E0A860" },
    { shape: "planet", color: "#3D7FC4" },
    { shape: "planet", color: "#C4543A" },
    { shape: "star", color: "#F5C518" },
  ],
  "ענקי הגז": [
    { shape: "planet", color: "#C89A6A" },
    { shape: "ringedPlanet", color: "#E0C88A" },
    { shape: "planet", color: "#7FCBD4" },
    { shape: "planet", color: "#3A5FC4" },
    { shape: "moon", color: "#B8BEC4" },
  ],
  "ירחים": [
    { shape: "moon", color: "#CFD4D9" },
    { shape: "moon", color: "#E8DCC0" },
    { shape: "moon", color: "#C4906A" },
    { shape: "moon", color: "#9AA6B0" },
    { shape: "planet", color: "#7A8894" },
  ],
  "קצה המערכת": [
    { shape: "comet", color: "#9ED6E8" },
    { shape: "moon", color: "#B0A898" },
    { shape: "comet", color: "#CFE6F5" },
    { shape: "moon", color: "#8A8578" },
    { shape: "star", color: "#DCE4EC" },
  ],
  "כוכבים ושמשות": [
    { shape: "star", color: "#F5C518" },
    { shape: "star", color: "#E85A3A" },
    { shape: "star", color: "#7FA8F5" },
    { shape: "star", color: "#F5F0E0" },
    { shape: "star", color: "#D66AC4" },
  ],
  "גלקסיות ומעבר": [
    { shape: "galaxy", color: "#8A6FC4" },
    { shape: "galaxy", color: "#4A7FC4" },
    { shape: "star", color: "#F5E6C0" },
    { shape: "galaxy", color: "#C46A9A" },
    { shape: "star", color: "#9ED6E8" },
  ],
  "חלליות": [
    { shape: "rocket", color: "#DCE4EC" },
    { shape: "satellite", color: "#C0C8D0" },
    { shape: "rocket", color: "#E8703A" },
    { shape: "satellite", color: "#F5C518" },
    { shape: "rocket", color: "#B0BCC8" },
  ],
  "מצפים ותחנות": [
    { shape: "satellite", color: "#E0C060" },
    { shape: "satellite", color: "#B8C4D0" },
    { shape: "star", color: "#F5F0E0" },
    { shape: "satellite", color: "#8AA0B4" },
    { shape: "rocket", color: "#D0D8E0" },
  ],
};

/** ענפי הספורט */
const OLYMPICS: PlaceMap = {
  "אתלטיקה": [
    { shape: "shoe", color: "#E8563A" },
    { shape: "stopwatch", color: "#3A4A5A" },
    { shape: "medal", color: "#F5C518" },
    { shape: "shoe", color: "#3A7FC4" },
    { shape: "trophy", color: "#E0A860" },
  ],
  "משחקי כדור": [
    { shape: "ball", color: "#E8843A" },
    { shape: "ball", color: "#F5F0E8" },
    { shape: "ball", color: "#F5C518" },
    { shape: "trophy", color: "#D9A511" },
    { shape: "ball", color: "#4A9A4A" },
  ],
  "ענפי המים": [
    { shape: "wave", color: "#3FA9C8" },
    { shape: "medal", color: "#F5C518" },
    { shape: "wave", color: "#6FC8E0" },
    { shape: "stopwatch", color: "#2A5A7A" },
    { shape: "wave", color: "#4A88C4" },
  ],
  "אולימפיאדת החורף": [
    { shape: "snowflake", color: "#BFE3F2" },
    { shape: "shoe", color: "#8AA6C0" },
    { shape: "snowflake", color: "#E8F4FA" },
    { shape: "medal", color: "#C0C8D0" },
    { shape: "snowflake", color: "#9ECBE8" },
  ],
  "התעמלות": [
    { shape: "ribbon", color: "#E85A9A" },
    { shape: "medal", color: "#F5C518" },
    { shape: "ribbon", color: "#7A5AC4" },
    { shape: "trophy", color: "#E0A860" },
    { shape: "ribbon", color: "#3FA9A0" },
  ],
  "לחימה": [
    { shape: "belt", color: "#2A2E33" },
    { shape: "medal", color: "#F5C518" },
    { shape: "belt", color: "#F5F0E8" },
    { shape: "belt", color: "#8A5A2B" },
    { shape: "trophy", color: "#C0C8D0" },
  ],
  "סמלים וטקסים": [
    { shape: "torch", color: "#E8703A" },
    { shape: "rings", color: "#3A7FC4" },
    { shape: "medal", color: "#F5C518" },
    { shape: "torch", color: "#F5C518" },
    { shape: "rings", color: "#2A2E33" },
  ],
  "היסטוריה אולימפית": [
    { shape: "trophy", color: "#D9A511" },
    { shape: "rings", color: "#4A9A4A" },
    { shape: "medal", color: "#C0C8D0" },
    { shape: "torch", color: "#E0A860" },
    { shape: "medal", color: "#C48A4A" },
  ],
};

/** האזורים של עולם דיסני */
const DISNEY: PlaceMap = {
  "נסיכות וממלכות": [
    { shape: "crown", color: "#F2C53D" },
    { shape: "castle", color: "#B9C7E8" },
    { shape: "slipper", color: "#CFE4F5" },
    { shape: "rose", color: "#D6402C" },
    { shape: "crown", color: "#E8A0B4" },
    { shape: "castle", color: "#D8C3E8" },
  ],
  "חברים וחיות": [
    { shape: "ears", color: "#2E2E2E" },
    { shape: "paw", color: "#C4894A" },
    { shape: "fish", color: "#E5781C" },
    { shape: "paw", color: "#E0A040" },
    { shape: "ears", color: "#4A4A4A" },
    { shape: "fish", color: "#4FA8D8" },
  ],
  "נבלים": [
    { shape: "horns", color: "#4B2E6B" },
    { shape: "potion", color: "#5CB85C" },
    { shape: "horns", color: "#2E2E3E" },
    { shape: "potion", color: "#7B3F98" },
    { shape: "crown", color: "#3A3A4A" },
  ],
  "פיקסאר": [
    { shape: "lampPixar", color: "#F2E3A8" },
    { shape: "box", color: "#4FA8D8" },
    { shape: "ball", color: "#D6402C" },
    { shape: "star", color: "#F5C518" },
    { shape: "lampPixar", color: "#E8EDF2" },
  ],
  "קלאסיקות מצוירות": [
    { shape: "filmReel", color: "#3A3A3A" },
    { shape: "ears", color: "#2E2E2E" },
    { shape: "paw", color: "#8B5E3C" },
    { shape: "filmReel", color: "#5A5A5A" },
    { shape: "star", color: "#EFE6D2" },
  ],
  "מוזיקה וקסם": [
    { shape: "wand", color: "#F5C518" },
    { shape: "note", color: "#7B3F98" },
    { shape: "lamp", color: "#E0A040" },
    { shape: "note", color: "#4FA8D8" },
    { shape: "wand", color: "#E8E0F5" },
    { shape: "lamp", color: "#D9A616" },
  ],
  "מאחורי המסך": [
    { shape: "filmReel", color: "#3A3A3A" },
    { shape: "pencil", color: "#E8B972" },
    { shape: "filmReel", color: "#4A4A4A" },
    { shape: "pencil", color: "#C4894A" },
    { shape: "note", color: "#8A9384" },
  ],
  "פארקים ואטרקציות": [
    { shape: "castle", color: "#E8A0B4" },
    { shape: "ticket", color: "#F2C53D" },
    { shape: "castle", color: "#B9C7E8" },
    { shape: "ticket", color: "#4FA8D8" },
    { shape: "ears", color: "#2E2E2E" },
  ],
};

const PLACES: Record<WorldId, PlaceMap> = {
  market: MARKET,
  space: SPACE,
  olympics: OLYMPICS,
  disney: DISNEY,
};

/** פריטים חסרי זהות, למדף שלא אמור לרמוז */
const NEUTRAL: Record<WorldId, DecorItem[]> = {
  market: [
    { shape: "box", color: "#CBC6BC" },
    { shape: "can", color: "#B9BFC4" },
    { shape: "bottle", color: "#C6CDD2" },
    { shape: "packet", color: "#D2CCC1" },
    { shape: "jar", color: "#C2BDB2" },
    { shape: "sack", color: "#D8D2C6" },
  ],
  space: [
    { shape: "star", color: "#9AA4AE" },
    { shape: "planet", color: "#8A929A" },
    { shape: "star", color: "#AEB6BE" },
    { shape: "moon", color: "#96A0A8" },
    { shape: "star", color: "#A6AEB6" },
    { shape: "planet", color: "#7E868E" },
  ],
  olympics: [
    { shape: "medal", color: "#A8B0B8" },
    { shape: "ball", color: "#9AA2AA" },
    { shape: "medal", color: "#B2BAC2" },
    { shape: "trophy", color: "#969EA6" },
    { shape: "ball", color: "#A0A8B0" },
    { shape: "medal", color: "#8E969E" },
  ],
  disney: [
    { shape: "star", color: "#A8A0B8" },
    { shape: "filmReel", color: "#98909E" },
    { shape: "star", color: "#B0A8C0" },
    { shape: "note", color: "#8E8898" },
    { shape: "filmReel", color: "#A29AAA" },
    { shape: "star", color: "#948C9E" },
  ],
};

/** האזור הרחב שאליו שייך המקום — הרמז החלש של רמה 3 */
const ZONES: Record<WorldId, Record<string, string>> = {
  market: {
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
  },
  space: {
    "המערכת הפנימית": "מערכת השמש",
    "ענקי הגז": "מערכת השמש",
    "ירחים": "מערכת השמש",
    "קצה המערכת": "מערכת השמש",
    "כוכבים ושמשות": "היקום הרחוק",
    "גלקסיות ומעבר": "היקום הרחוק",
    "חלליות": "מעשה ידי אדם",
    "מצפים ותחנות": "מעשה ידי אדם",
  },
  disney: {
    "נסיכות וממלכות": "אגדות ושירים",
    "מוזיקה וקסם": "אגדות ושירים",
    "חברים וחיות": "חברים והרפתקאות",
    "פיקסאר": "חברים והרפתקאות",
    "נבלים": "הסרטים הגדולים",
    "קלאסיקות מצוירות": "הסרטים הגדולים",
    "מאחורי המסך": "מחוץ למסך",
    "פארקים ואטרקציות": "מחוץ למסך",
  },
  olympics: {
    "אתלטיקה": "מסלול ומגרש",
    "משחקי כדור": "מסלול ומגרש",
    "ענפי המים": "מים וקרח",
    "אולימפיאדת החורף": "מים וקרח",
    "התעמלות": "אולם",
    "לחימה": "אולם",
    "סמלים וטקסים": "מסביב למשחקים",
    "היסטוריה אולימפית": "מסביב למשחקים",
  },
};

export interface AisleView {
  /** מה כתוב על השלט */
  sign: string;
  decor: DecorItem[];
  /** האם השלט מסגיר את המקום המדויק */
  precise: boolean;
  world: string;
}

function decorFor(world: WorldId, place: string): DecorItem[] {
  return PLACES[world][place] ?? NEUTRAL[world];
}

/**
 * מה מציגים על השלט, לפי הרמה.
 *
 * רמות 1–2: המקום המדויק, עם פריטים שמתאימים לו.
 * רמה 3: רק האזור הכללי, עם פריטים ניטרליים.
 * רמות 4 ומעלה: שום דבר.
 */
export function aisleView(world: string, aisle: string, level: number): AisleView {
  const id = getWorld(world).id;
  if (level <= 2) {
    return { sign: aisle, decor: decorFor(id, aisle), precise: true, world: id };
  }
  if (level === 3) {
    return {
      sign: ZONES[id][aisle] ?? "אי־שם",
      decor: NEUTRAL[id],
      precise: false,
      world: id,
    };
  }
  return { sign: getWorld(world).mysteryPlace, decor: NEUTRAL[id], precise: false, world: id };
}

/** אחרי הפתרון תמיד מראים את המקום האמיתי */
export function solvedAisleView(world: string, aisle: string): AisleView {
  const id = getWorld(world).id;
  return { sign: aisle, decor: decorFor(id, aisle), precise: true, world: id };
}

/** כל המקומות של עולם, לבדיקות ולסקריפטים */
export function placesOf(world: WorldId): string[] {
  return Object.keys(PLACES[world]);
}

export { PLACES as PLACE_DECOR };
