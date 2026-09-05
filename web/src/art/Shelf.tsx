/**
 * מדף הסופר — הרקע שמאחורי החידה.
 *
 * השלט והמוצרים שעליו הם רמז אמיתי: הם מספרים באיזה מעבר הפריט
 * נמצא, וברמות הגבוהות מגלים פחות (shared/aisles.ts).
 *
 * הפריט הסודי מוצג כארגז עטוף עם סימן שאלה, כי הצורה שלו לבדה
 * הייתה מגלה חצי מהחידה. כרטיס החידה יושב עליו מלמטה.
 */

import { Product } from "./Product";
import type { AisleView } from "../../../shared/aisles";
import type { Art } from "../../../shared/types";

function MysteryCrate({ size = 92 }: { size?: number }) {
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
        <Product shape={solvedArt.shape} color={solvedArt.color} size={92} title="הפריט שנפתר" />
      ) : (
        <MysteryCrate />
      )}
    </div>
  );

  // שתי שורות מדף. הפריט הסודי באמצע העליונה, שאר המוצרים סביבו.
  const top = aisle.decor.filter((_, index) => index % 2 === 0).slice(0, 4);
  const bottom = aisle.decor.filter((_, index) => index % 2 === 1).slice(0, 5);

  const draw = (items: typeof top, row: number) =>
    items.map((item, index) => (
      <div className="decor" key={`${item.shape}-${row}-${index}`}>
        <Product shape={item.shape} color={item.color} size={54} />
      </div>
    ));

  const topRow = draw(top, 0);
  const middle = Math.ceil(topRow.length / 2);

  return (
    <div className={`shelf world-${aisle.world}`} aria-hidden="true">
      <div className={`shelf-sign ${aisle.precise ? "" : "vague"}`}>
        <span>{aisle.sign}</span>
      </div>

      <div className="shelf-row">
        <div className="shelf-items">
          {[...topRow.slice(0, middle), star, ...topRow.slice(middle)]}
        </div>
        <div className="shelf-plank" />
      </div>

      <div className="shelf-row">
        <div className="shelf-items">{draw(bottom, 1)}</div>
        <div className="shelf-plank" />
      </div>
    </div>
  );
}
