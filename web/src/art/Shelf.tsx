/**
 * מדף הסופר.
 *
 * השלט והמוצרים שעליו הם רמז אמיתי: הם מספרים באיזה מעבר הפריט
 * נמצא. ברמות הגבוהות הרמז נחלש — ראו shared/aisles.ts.
 *
 * הפריט הסודי עצמו מוצג כארגז עטוף עם סימן שאלה, כי הצורה שלו
 * לבדה הייתה מגלה חצי מהחידה.
 */

import { Product } from "./Product";
import type { AisleView } from "../../../shared/aisles";
import type { Art } from "../../../shared/types";

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
  aisle,
  solvedArt,
  celebrating,
}: {
  aisle: AisleView;
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

  // שלוש שורות מדף, והמוצרים של המעבר מתחלקים ביניהן
  const rows = [0, 1, 2].map((row) =>
    aisle.decor.filter((_, index) => index % 3 === row),
  );

  return (
    <div className="shelf">
      <div className={`shelf-sign ${aisle.precise ? "" : "vague"}`}>{aisle.sign}</div>
      {rows.map((items, row) => {
        const drawn = items.map((item, index) => (
          <div className="decor" key={`${item.shape}-${row}-${index}`}>
            <Product shape={item.shape} color={item.color} size={64} />
          </div>
        ));
        // הפריט הסודי יושב באמצע המדף האמצעי, בין מוצרי הרקע
        const content = row === 1 ? [...drawn.slice(0, 1), star, ...drawn.slice(1)] : drawn;

        return (
          <div className="shelf-row" key={row}>
            <div className="shelf-items">{content}</div>
            <div className="shelf-plank" />
          </div>
        );
      })}
    </div>
  );
}
