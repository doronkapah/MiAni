/**
 * מדף הסופר — הרקע הקבוע של המשחק.
 *
 * הפריט הסודי מוצג כארגז עטוף עם סימן שאלה, כי הצורה שלו לבדה
 * הייתה מגלה חצי מהחידה. אחרי הפתרון הוא מתחלף במוצר האמיתי.
 */

import { Product } from "./Product";
import type { Art } from "../../../shared/types";

/** מוצרי רקע קבועים — קישוט בלבד, לא קשורים לחידה */
const DECOR: { shape: string; color: string; row: number }[] = [
  { shape: "box", color: "#E0A040", row: 0 },
  { shape: "can", color: "#9BA7B0", row: 0 },
  { shape: "bottle", color: "#79C6E8", row: 0 },
  { shape: "jar", color: "#D99A2B", row: 1 },
  { shape: "sack", color: "#EFE6D2", row: 1 },
  { shape: "carton", color: "#DCE8F2", row: 2 },
  { shape: "packet", color: "#6B4226", row: 2 },
  { shape: "tub", color: "#F4C6D5", row: 2 },
];

function MysteryCrate({ size = 108 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="הפריט הסודי">
      <ellipse cx="50" cy="93" rx="30" ry="5" fill="#000000" opacity="0.12" />
      <rect x="20" y="26" width="60" height="62" rx="8" fill="var(--tag)" />
      <rect x="20" y="26" width="60" height="14" rx="8" fill="var(--tag-deep)" />
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontSize="42"
        fontFamily="Secular One, sans-serif"
        fill="var(--tag-ink)"
      >
        ?
      </text>
    </svg>
  );
}

export function Shelf({
  aisleName,
  solvedArt,
  celebrating,
}: {
  aisleName: string;
  solvedArt?: Art | null;
  celebrating?: boolean;
}) {
  const star = (
    <div className={`mystery ${celebrating ? "mystery-pop" : ""}`} key="mystery">
      {solvedArt ? (
        <Product shape={solvedArt.shape} color={solvedArt.color} size={108} title="הפריט שנפתר" />
      ) : (
        <MysteryCrate />
      )}
    </div>
  );

  return (
    <div className="shelf">
      <div className="shelf-sign">{aisleName}</div>
      {[0, 1, 2].map((row) => {
        const decor = DECOR.filter((item) => item.row === row).map((item, index) => (
          <div className="decor" key={`${item.shape}-${index}`}>
            <Product shape={item.shape} color={item.color} size={64} />
          </div>
        ));
        // הפריט הסודי יושב באמצע המדף האמצעי, בין מוצרי הרקע
        const items =
          row === 1 ? [...decor.slice(0, 1), star, ...decor.slice(1)] : decor;

        return (
          <div className="shelf-row" key={row}>
            <div className="shelf-items">{items}</div>
            <div className="shelf-plank" />
          </div>
        );
      })}
    </div>
  );
}
