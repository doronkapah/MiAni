import "dotenv/config";

export const PORT = Number(process.env.PORT ?? 5174);

/**
 * מפתח ה-API של השרת המקומי — אופציונלי לגמרי.
 * כשהוא קיים, הדפדפן יכול לבקש מהשרת לדבר עם עגלי במקומו,
 * וכך אין צורך להדביק מפתח בדפדפן.
 */
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY?.trim() || "";

export const HAS_API_KEY = ANTHROPIC_API_KEY.length > 0;

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
