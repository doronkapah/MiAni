/**
 * ציורי המוצרים.
 *
 * כל מוצר הוא צורה אחת מתוך רשימה קצרה, בצבע שנקבע לו בבנק החידות.
 * זה נותן גיוון אמיתי — בקבוק, קרטון, שקית, שורש — בלי לצייר 80 ציורים,
 * ובלי אף תמונה שצריך לטעון מהרשת.
 */

export type Shape =
  | "bottle" | "carton" | "box" | "bag" | "can" | "jar" | "tub" | "packet"
  | "sack" | "egg" | "bread" | "roundFruit" | "longFruit" | "root" | "leafy"
  | "berry" | "roll" | "cake" | "spiceJar";

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
