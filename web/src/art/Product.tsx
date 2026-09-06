/**
 * ציורי המוצרים.
 *
 * כל מוצר הוא צורה אחת מתוך רשימה קצרה, בצבע שנקבע לו בבנק החידות.
 * זה נותן גיוון אמיתי — בקבוק, קרטון, שקית, שורש — בלי לצייר 80 ציורים,
 * ובלי אף תמונה שצריך לטעון מהרשת.
 */

export type Shape =
  // הסופר
  | "bottle" | "carton" | "box" | "bag" | "can" | "jar" | "tub" | "packet"
  | "sack" | "egg" | "bread" | "roundFruit" | "longFruit" | "root" | "leafy"
  | "berry" | "roll" | "cake" | "spiceJar"
  // החלל
  | "planet" | "ringedPlanet" | "moon" | "star" | "comet" | "galaxy"
  | "rocket" | "satellite"
  // האולימפיאדה
  | "medal" | "trophy" | "ball" | "torch" | "rings" | "stopwatch"
  | "shoe" | "wave" | "snowflake" | "ribbon" | "belt"
  // דיסני
  | "castle" | "crown" | "wand" | "ears" | "lamp" | "lampPixar" | "rose"
  | "slipper" | "fish" | "paw" | "horns" | "potion" | "note" | "filmReel"
  | "pencil" | "ticket";

/** מכהה צבע, לצללית ולפרטים */
export function darken(hex: string, amount = 0.22): string {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const num = Number.parseInt(full, 16);
  const channels = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map((c) =>
    Math.max(0, Math.round(c * (1 - amount))),
  );
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** מבהיר צבע, לתוויות ולהדגשים */
export function lighten(hex: string, amount = 0.3): string {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  const num = Number.parseInt(full, 16);
  const channels = [(num >> 16) & 255, (num >> 8) & 255, num & 255].map((c) =>
    Math.min(255, Math.round(c + (255 - c) * amount)),
  );
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const LEAF = "#3E8E42";
const LEAF_DARK = "#2C6B30";

function Body({ shape, color }: { shape: Shape; color: string }) {
  const dark = darken(color);
  const light = lighten(color);

  switch (shape) {
    case "bottle":
      return (
        <>
          <rect x="42" y="12" width="16" height="18" rx="3" fill={dark} />
          <path d="M40 28h20l10 16v44a6 6 0 0 1-6 6H36a6 6 0 0 1-6-6V44z" fill={color} />
          <rect x="34" y="52" width="32" height="20" rx="3" fill={light} />
          <rect x="40" y="8" width="20" height="9" rx="3" fill={dark} />
        </>
      );
    case "carton":
      return (
        <>
          <path d="M28 30h44v56a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4z" fill={color} />
          <path d="M28 30 50 12l22 18z" fill={light} />
          <rect x="44" y="6" width="12" height="10" rx="2" fill={dark} />
          <rect x="36" y="48" width="28" height="18" rx="3" fill={dark} opacity="0.25" />
        </>
      );
    case "box":
      return (
        <>
          <rect x="24" y="18" width="52" height="72" rx="5" fill={color} />
          <rect x="24" y="36" width="52" height="24" fill={light} />
          <rect x="32" y="42" width="36" height="4" rx="2" fill={dark} opacity="0.45" />
          <rect x="32" y="50" width="24" height="4" rx="2" fill={dark} opacity="0.3" />
        </>
      );
    case "bag":
      return (
        <>
          <path d="M26 26q24-8 48 0v58a6 6 0 0 1-6 6H32a6 6 0 0 1-6-6z" fill={color} />
          <path d="M26 26q24-8 48 0l-6 8q-18-6-36 0z" fill={dark} />
          <ellipse cx="50" cy="62" rx="17" ry="13" fill={light} opacity="0.75" />
        </>
      );
    case "can":
      return (
        <>
          <rect x="28" y="22" width="44" height="62" fill={color} />
          <ellipse cx="50" cy="22" rx="22" ry="7" fill={light} />
          <ellipse cx="50" cy="84" rx="22" ry="7" fill={dark} />
          <rect x="28" y="42" width="44" height="20" fill={dark} opacity="0.3" />
        </>
      );
    case "jar":
      return (
        <>
          <rect x="28" y="30" width="44" height="58" rx="8" fill={color} />
          <rect x="30" y="16" width="40" height="14" rx="4" fill={dark} />
          <rect x="34" y="46" width="32" height="22" rx="4" fill={light} opacity="0.8" />
        </>
      );
    case "tub":
      return (
        <>
          <path d="M30 34h40l-5 50a6 6 0 0 1-6 5H41a6 6 0 0 1-6-5z" fill={color} />
          <rect x="26" y="24" width="48" height="12" rx="4" fill={dark} />
          <ellipse cx="50" cy="60" rx="14" ry="10" fill={light} opacity="0.75" />
        </>
      );
    case "packet":
      return (
        <>
          <path d="M22 32h56v40H22z" fill={color} />
          <path d="M22 32 12 24v56l10-8z" fill={dark} />
          <path d="M78 32 88 24v56l-10-8z" fill={dark} />
          <rect x="34" y="42" width="32" height="20" rx="3" fill={light} opacity="0.8" />
        </>
      );
    case "sack":
      return (
        <>
          <path d="M30 32q20-6 40 0l6 48a8 8 0 0 1-8 9H32a8 8 0 0 1-8-9z" fill={color} />
          <path d="M30 32q20-10 40 0-8 6-20 6t-20-6z" fill={dark} />
          <rect x="38" y="56" width="24" height="16" rx="3" fill={dark} opacity="0.25" />
        </>
      );
    case "egg":
      return (
        <>
          <path d="M50 10c16 0 26 24 26 40s-11 26-26 26-26-10-26-26 10-40 26-40z" fill={color} />
          <ellipse cx="41" cy="42" rx="7" ry="10" fill="#FFFFFF" opacity="0.55" />
        </>
      );
    case "bread":
      return (
        <>
          <path d="M18 52q0-26 32-26t32 26v26a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill={color} />
          <path d="M32 40q6-8 12 0M50 38q6-8 12 0" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="18" y="70" width="64" height="14" rx="5" fill={dark} opacity="0.35" />
        </>
      );
    case "roundFruit":
      return (
        <>
          <circle cx="50" cy="58" r="32" fill={color} />
          <circle cx="39" cy="46" r="8" fill="#FFFFFF" opacity="0.35" />
          <path d="M50 27c0-8 5-13 12-15-1 9-5 14-12 15z" fill={LEAF} />
          <rect x="47" y="16" width="5" height="14" rx="2.5" fill={LEAF_DARK} />
        </>
      );
    case "longFruit":
      return (
        <>
          <path d="M22 22c4 34 20 58 54 62-6 10-20 12-34 6C25 82 16 52 22 22z" fill={color} />
          <path d="M22 22c4 34 20 58 54 62l-4 5C42 84 22 58 18 24z" fill={darken(color, 0.35)} />
          <rect x="16" y="14" width="10" height="12" rx="4" fill={LEAF_DARK} />
        </>
      );
    case "root":
      return (
        <>
          <path d="M38 34h24l-8 50a4 4 0 0 1-8 0z" fill={color} />
          <path d="M42 48h16M43 60h14M45 72h10" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          <path d="M50 34c-8-6-12-14-10-22 8 2 13 8 14 16 3-8 9-13 17-14-1 10-8 18-17 20z" fill={LEAF} />
        </>
      );
    case "leafy":
      return (
        <>
          <path d="M50 88V44" stroke={LEAF_DARK} strokeWidth="6" strokeLinecap="round" />
          <path d="M50 46c-14 4-24-2-28-16 14-4 24 2 28 16z" fill={color} />
          <path d="M50 46c14 4 24-2 28-16-14-4-24 2-28 16z" fill={darken(color, 0.15)} />
          <path d="M50 66c-12 3-20-2-24-13 12-3 20 2 24 13z" fill={lighten(color, 0.15)} />
          <path d="M50 66c12 3 20-2 24-13-12-3-20 2-24 13z" fill={color} />
        </>
      );
    case "berry":
      return (
        <>
          <circle cx="38" cy="62" r="16" fill={color} />
          <circle cx="62" cy="62" r="16" fill={darken(color, 0.14)} />
          <circle cx="50" cy="40" r="15" fill={lighten(color, 0.1)} />
          <rect x="47" y="14" width="5" height="14" rx="2.5" fill={LEAF_DARK} />
          <path d="M50 26c-9 0-15-4-17-12 9-1 15 3 17 12z" fill={LEAF} />
        </>
      );
    case "roll":
      return (
        <>
          <rect x="20" y="28" width="60" height="48" rx="8" fill={color} />
          <ellipse cx="20" cy="52" rx="9" ry="24" fill={dark} />
          <ellipse cx="20" cy="52" rx="4" ry="10" fill={lighten(color, 0.5)} />
          <path d="M80 28q8 24 0 48" stroke={dark} strokeWidth="3" fill="none" />
        </>
      );
    case "cake":
      return (
        <>
          <path d="M22 56h56v26a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z" fill={color} />
          <path d="M22 56q7 10 14 0t14 0 14 0 14 0v8H22z" fill={lighten(color, 0.45)} />
          <rect x="47" y="30" width="6" height="20" rx="3" fill="#F7F3EA" />
          <path d="M50 22c4 4 4 8 0 8s-4-4 0-8z" fill="#F5A623" />
        </>
      );
    case "spiceJar":
      return (
        <>
          <rect x="34" y="36" width="32" height="52" rx="6" fill={color} />
          <rect x="32" y="22" width="36" height="14" rx="4" fill={dark} />
          <circle cx="42" cy="29" r="2" fill={lighten(color, 0.6)} />
          <circle cx="50" cy="29" r="2" fill={lighten(color, 0.6)} />
          <circle cx="58" cy="29" r="2" fill={lighten(color, 0.6)} />
          <rect x="38" y="52" width="24" height="18" rx="3" fill={light} opacity="0.8" />
        </>
      );
    // ------------------------------------------------------ החלל

    case "planet":
      return (
        <>
          <circle cx="50" cy="52" r="30" fill={color} />
          <path d="M26 38q14 8 30 2t22-8" stroke={dark} strokeWidth="5" fill="none" opacity="0.5" />
          <path d="M22 58q18 10 34 2t24-6" stroke={dark} strokeWidth="4" fill="none" opacity="0.4" />
          <circle cx="38" cy="40" r="7" fill={light} opacity="0.4" />
        </>
      );
    case "ringedPlanet":
      return (
        <>
          <ellipse cx="50" cy="54" rx="46" ry="11" fill="none" stroke={dark} strokeWidth="5" opacity="0.75" />
          <circle cx="50" cy="52" r="26" fill={color} />
          <path d="M28 44q16 7 26 1t18-6" stroke={dark} strokeWidth="4" fill="none" opacity="0.45" />
          <ellipse cx="50" cy="56" rx="46" ry="11" fill="none" stroke={light} strokeWidth="2" opacity="0.9" />
        </>
      );
    case "moon":
      return (
        <>
          <circle cx="50" cy="52" r="26" fill={color} />
          <circle cx="40" cy="42" r="6" fill={dark} opacity="0.45" />
          <circle cx="60" cy="58" r="8" fill={dark} opacity="0.35" />
          <circle cx="46" cy="64" r="4" fill={dark} opacity="0.4" />
        </>
      );
    case "star":
      return (
        <>
          <circle cx="50" cy="50" r="28" fill={color} opacity="0.25" />
          <circle cx="50" cy="50" r="19" fill={color} />
          <path
            d="M50 12v12M50 76v12M12 50h12M76 50h12M25 25l8 8M67 67l8 8M75 25l-8 8M33 67l-8 8"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />
        </>
      );
    case "comet":
      return (
        <>
          <path d="M18 82 46 46l10 10z" fill={color} opacity="0.35" />
          <path d="M26 82 50 52l6 6z" fill={color} opacity="0.6" />
          <circle cx="60" cy="38" r="14" fill={color} />
          <circle cx="55" cy="33" r="5" fill={light} opacity="0.7" />
        </>
      );
    case "galaxy":
      return (
        <>
          <ellipse cx="50" cy="50" rx="38" ry="16" fill={color} opacity="0.3" transform="rotate(-20 50 50)" />
          <ellipse cx="50" cy="50" rx="26" ry="10" fill={color} opacity="0.55" transform="rotate(-20 50 50)" />
          <ellipse cx="50" cy="50" rx="11" ry="6" fill={light} transform="rotate(-20 50 50)" />
          <circle cx="24" cy="38" r="2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="76" cy="62" r="2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="70" cy="32" r="1.6" fill="#FFFFFF" opacity="0.7" />
        </>
      );
    case "rocket":
      return (
        <>
          <path d="M50 8c12 14 16 30 16 44H34c0-14 4-30 16-44z" fill={color} />
          <path d="M34 52 22 70h12zM66 52l12 18H66z" fill={dark} />
          <rect x="42" y="52" width="16" height="22" rx="4" fill={dark} />
          <circle cx="50" cy="36" r="7" fill={lighten(color, 0.6)} />
          <path d="M44 76q6 14 12 0z" fill="#E8703A" />
        </>
      );
    case "satellite":
      return (
        <>
          <rect x="40" y="36" width="20" height="30" rx="4" fill={color} />
          <rect x="8" y="42" width="28" height="18" rx="3" fill={dark} />
          <rect x="64" y="42" width="28" height="18" rx="3" fill={dark} />
          <path d="M8 51h28M64 51h28M22 42v18M78 42v18" stroke={light} strokeWidth="2" opacity="0.6" />
          <circle cx="50" cy="26" r="8" fill="none" stroke={color} strokeWidth="4" />
          <path d="M50 34v4" stroke={color} strokeWidth="4" />
        </>
      );

    // ------------------------------------------------ האולימפיאדה

    case "medal":
      return (
        <>
          <path d="M36 12 46 44h8L44 12zM64 12 54 44h-8l10-32z" fill={dark} />
          <circle cx="50" cy="62" r="26" fill={color} />
          <circle cx="50" cy="62" r="18" fill={light} opacity="0.55" />
          <path
            d="M50 50l4 8 9 1-6.5 6 1.5 9-8-4.5-8 4.5 1.5-9-6.5-6 9-1z"
            fill={dark}
            opacity="0.7"
          />
        </>
      );
    case "trophy":
      return (
        <>
          <path d="M30 16h40v22a20 20 0 0 1-40 0z" fill={color} />
          <path d="M30 20H18a12 12 0 0 0 12 12zM70 20h12a12 12 0 0 1-12 12z" fill={dark} />
          <rect x="44" y="56" width="12" height="16" fill={dark} />
          <rect x="30" y="72" width="40" height="12" rx="4" fill={dark} />
          <path d="M42 26h16" stroke={light} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "ball":
      return (
        <>
          <circle cx="50" cy="52" r="30" fill={color} />
          <path
            d="M50 22v60M20 52h60M28 30q22 22 44 44M72 30q-22 22-44 44"
            stroke={dark}
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <circle cx="40" cy="40" r="6" fill={light} opacity="0.35" />
        </>
      );
    case "torch":
      return (
        <>
          <path d="M44 44h12l-3 44h-6z" fill={dark} />
          <rect x="38" y="36" width="24" height="10" rx="3" fill={darken(color, 0.4)} />
          <path d="M50 4c10 12 12 20 8 26-2-4-5-6-5-6s2 8-3 12c-6-4-8-12-6-18 1-5 4-10 6-14z" fill={color} />
          <path d="M50 14c4 6 5 11 3 15-3-3-5-4-5-4s0 5-2 7c-3-3-4-8-3-12z" fill={lighten(color, 0.55)} />
        </>
      );
    case "rings":
      return (
        <>
          <circle cx="30" cy="42" r="16" fill="none" stroke={color} strokeWidth="5" />
          <circle cx="50" cy="42" r="16" fill="none" stroke={dark} strokeWidth="5" />
          <circle cx="70" cy="42" r="16" fill="none" stroke={color} strokeWidth="5" opacity="0.75" />
          <circle cx="40" cy="60" r="16" fill="none" stroke={dark} strokeWidth="5" opacity="0.75" />
          <circle cx="60" cy="60" r="16" fill="none" stroke={color} strokeWidth="5" opacity="0.6" />
        </>
      );
    case "stopwatch":
      return (
        <>
          <rect x="42" y="8" width="16" height="10" rx="3" fill={dark} />
          <circle cx="50" cy="56" r="30" fill={color} />
          <circle cx="50" cy="56" r="23" fill={lighten(color, 0.75)} />
          <path d="M50 56V38M50 56l14 9" stroke={dark} strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="56" r="4" fill={dark} />
        </>
      );
    case "shoe":
      return (
        <>
          <path d="M14 70q0-10 10-12l18-4 14-14q6-6 12 0l16 16q8 8 8 14v6H18a4 4 0 0 1-4-4z" fill={color} />
          <path d="M14 74h76v8a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill={dark} />
          <path d="M44 54l14 12M54 44l14 12" stroke={light} strokeWidth="4" strokeLinecap="round" />
        </>
      );
    case "wave":
      return (
        <>
          <path d="M6 56q12-16 24 0t24 0 24 0 16-6v34H6z" fill={color} opacity="0.65" />
          <path d="M6 68q12-16 24 0t24 0 24 0 16-6v22H6z" fill={dark} opacity="0.75" />
          <circle cx="34" cy="34" r="9" fill={lighten(color, 0.6)} />
          <path d="M22 42q10-8 22-2" stroke={lighten(color, 0.4)} strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case "snowflake":
      return (
        <>
          <path
            d="M50 12v76M18 31l64 38M82 31L18 69"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M50 26l-9-9M50 26l9-9M50 74l-9 9M50 74l9 9M30 40l-12-2M30 40l-2-12M70 60l12 2M70 60l2 12M70 40l12-2M70 40l2-12M30 60l-12 2M30 60l-2 12"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </>
      );
    case "ribbon":
      return (
        <>
          <path
            d="M14 74q10-30 26-30t14 16-14 12-6-18 16-22 24 8"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
          />
          <rect x="72" y="22" width="8" height="46" rx="4" fill={dark} />
          <circle cx="76" cy="20" r="6" fill={light} />
        </>
      );
    case "belt":
      return (
        <>
          <path d="M8 44h84v18H8z" fill={color} />
          <rect x="40" y="38" width="22" height="30" rx="4" fill={dark} />
          <rect x="46" y="44" width="10" height="18" rx="2" fill={light} opacity="0.6" />
          <path d="M8 62q10 18 22 22M92 62q-10 18-22 22" stroke={color} strokeWidth="9" fill="none" strokeLinecap="round" />
        </>
      );

    // --- דיסני ---

    case "castle":
      return (
        <>
          <path d="M18 88V44h14v44zM68 88V44h14v44z" fill={color} />
          <path d="M38 88V34h24v54z" fill={light} />
          <path d="M18 44l7-14 7 14zM68 44l7-14 7 14zM38 34l12-18 12 18z" fill={dark} />
          <path d="M50 16v-8l10 3-10 3z" fill="#D6402C" />
          <path d="M44 88V68a6 6 0 0 1 12 0v20z" fill={dark} />
          <rect x="22" y="52" width="6" height="8" rx="2" fill={dark} />
          <rect x="72" y="52" width="6" height="8" rx="2" fill={dark} />
        </>
      );

    case "crown":
      return (
        <>
          <path d="M20 72 14 32l16 12 20-24 20 24 16-12-6 40z" fill={color} />
          <rect x="20" y="72" width="60" height="12" rx="4" fill={dark} />
          <circle cx="50" cy="54" r="5" fill={light} />
          <circle cx="32" cy="60" r="3.5" fill={light} />
          <circle cx="68" cy="60" r="3.5" fill={light} />
        </>
      );

    case "wand":
      return (
        <>
          <path d="M42 54 26 86a4 4 0 0 0 6 5l24-28z" fill={dark} />
          <path d="M50 8l7 20 21 2-16 14 5 21-17-11-17 11 5-21-16-14 21-2z" fill={color} />
          <circle cx="50" cy="36" r="6" fill={light} />
        </>
      );

    case "ears":
      return (
        <>
          <circle cx="26" cy="26" r="16" fill={color} />
          <circle cx="74" cy="26" r="16" fill={color} />
          <circle cx="50" cy="60" r="28" fill={color} />
          <circle cx="50" cy="66" r="16" fill={light} opacity="0.35" />
        </>
      );

    case "lamp":
      return (
        <>
          <path d="M22 60q0-20 26-20t26 20z" fill={color} />
          <path d="M18 60h64a4 4 0 0 1-4 12H22a4 4 0 0 1-4-12z" fill={dark} />
          <path d="M74 48q14 2 14 12t-12 10" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
          <path d="M40 34q4-8 10-8" fill="none" stroke={dark} strokeWidth="5" strokeLinecap="round" />
          <circle cx="50" cy="22" r="4" fill={light} />
        </>
      );

    case "lampPixar":
      return (
        <>
          <ellipse cx="50" cy="88" rx="24" ry="6" fill={dark} />
          <path d="M50 84 34 56M34 56l14-20" fill="none" stroke={dark} strokeWidth="6" strokeLinecap="round" />
          <path d="M48 36 30 24l-8 20 26 6z" fill={color} />
          <circle cx="36" cy="42" r="6" fill={light} />
        </>
      );

    case "rose":
      return (
        <>
          <path d="M50 56v32" stroke={LEAF_DARK} strokeWidth="5" strokeLinecap="round" />
          <path d="M50 74q-14-2-16-14 14-2 16 14z" fill={LEAF} />
          <circle cx="50" cy="38" r="22" fill={color} />
          <circle cx="50" cy="38" r="13" fill={dark} />
          <circle cx="50" cy="38" r="5" fill={light} />
        </>
      );

    case "slipper":
      return (
        <>
          <path d="M22 74q4-24 26-24 20 0 26 16-16 6-30 8t-22 0z" fill={color} opacity="0.85" />
          <path d="M22 74h52v6H22z" fill={dark} />
          <path d="M66 80l6 12" stroke={dark} strokeWidth="5" strokeLinecap="round" />
          <circle cx="46" cy="52" r="4" fill={light} />
        </>
      );

    case "fish":
      return (
        <>
          <ellipse cx="46" cy="52" rx="30" ry="20" fill={color} />
          <path d="M74 52 92 36v32z" fill={dark} />
          <path d="M30 40q10 4 10 24M52 34q6 6 6 18" fill="none" stroke={dark} strokeWidth="5" />
          <circle cx="26" cy="46" r="5" fill="#FFFFFF" />
          <circle cx="25" cy="46" r="2.5" fill="#1B1B1B" />
        </>
      );

    case "paw":
      return (
        <>
          <ellipse cx="50" cy="66" rx="22" ry="18" fill={color} />
          <ellipse cx="28" cy="42" rx="9" ry="11" fill={color} />
          <ellipse cx="44" cy="32" rx="9" ry="11" fill={color} />
          <ellipse cx="60" cy="32" rx="9" ry="11" fill={color} />
          <ellipse cx="74" cy="42" rx="9" ry="11" fill={color} />
          <ellipse cx="50" cy="66" rx="11" ry="9" fill={dark} opacity="0.5" />
        </>
      );

    case "horns":
      return (
        <>
          <path d="M28 84q-14-30-6-56 14 10 18 34z" fill={color} />
          <path d="M72 84q14-30 6-56-14 10-18 34z" fill={color} />
          <path d="M40 62h20l-4 26H44z" fill={dark} />
          <circle cx="50" cy="52" r="6" fill={light} />
        </>
      );

    case "potion":
      return (
        <>
          <rect x="42" y="12" width="16" height="14" rx="3" fill={dark} />
          <path d="M38 26h24v10l14 34a10 10 0 0 1-9 16H33a10 10 0 0 1-9-16l14-34z" fill={light} opacity="0.45" />
          <path d="M28 60h44l4 10a10 10 0 0 1-9 16H33a10 10 0 0 1-9-16z" fill={color} />
          <circle cx="44" cy="70" r="3" fill={light} />
          <circle cx="58" cy="76" r="2.2" fill={light} />
        </>
      );

    case "note":
      return (
        <>
          <path d="M42 78V22l30-8v56" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="34" cy="78" rx="13" ry="10" fill={color} />
          <ellipse cx="64" cy="70" rx="13" ry="10" fill={color} />
        </>
      );

    case "filmReel":
      return (
        <>
          <circle cx="50" cy="50" r="34" fill={color} />
          <circle cx="50" cy="50" r="8" fill={light} />
          <circle cx="50" cy="26" r="7" fill={light} />
          <circle cx="50" cy="74" r="7" fill={light} />
          <circle cx="26" cy="50" r="7" fill={light} />
          <circle cx="74" cy="50" r="7" fill={light} />
          <circle cx="50" cy="50" r="34" fill="none" stroke={dark} strokeWidth="4" />
        </>
      );

    case "pencil":
      return (
        <>
          <path d="M34 12h32v56H34z" fill={color} />
          <path d="M34 68h32L50 92z" fill={light} />
          <path d="M44 82l6 10 6-10z" fill="#2E2E2E" />
          <rect x="34" y="12" width="32" height="10" fill={dark} />
        </>
      );

    case "ticket":
      return (
        <>
          <path d="M14 32h72v14a6 6 0 0 0 0 12v14H14V58a6 6 0 0 0 0-12z" fill={color} />
          <path d="M46 34v32" stroke={dark} strokeWidth="3" strokeDasharray="5 5" />
          <circle cx="66" cy="50" r="8" fill={light} />
        </>
      );

    default:
      return <rect x="26" y="24" width="48" height="64" rx="6" fill={color} />;
  }
}

export function Product({
  shape,
  color,
  size = 96,
  title,
}: {
  shape: string;
  color: string;
  size?: number;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <ellipse cx="50" cy="93" rx="30" ry="5" fill="#000000" opacity="0.12" />
      <Body shape={shape as Shape} color={color} />
    </svg>
  );
}
