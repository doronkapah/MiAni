/** ציורי המנות. אותו קו של שאר המשחק: SVG כתוב ביד, בלי תמונות. */

function Omelet() {
  return (
    <>
      <ellipse cx="50" cy="72" rx="40" ry="14" fill="#E8EDF2" />
      <ellipse cx="50" cy="69" rx="33" ry="11" fill="#F7FAFC" />
      <path d="M22 68q6-26 28-26t28 26q-14 6-28 6t-28-6z" fill="#F2C230" />
      <path d="M34 52q10-8 22-2" fill="none" stroke="#E0A21A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="42" cy="62" r="3" fill="#7FB85F" />
      <circle cx="58" cy="60" r="3" fill="#C62D25" />
    </>
  );
}

function FruitSalad() {
  return (
    <>
      <path d="M16 48h68l-6 26a10 10 0 0 1-10 8H32a10 10 0 0 1-10-8z" fill="#DCE8F2" />
      <ellipse cx="50" cy="48" rx="34" ry="10" fill="#EDF3F8" />
      <circle cx="36" cy="46" r="7" fill="#D6304A" />
      <circle cx="50" cy="43" r="7" fill="#F2C53D" />
      <circle cx="64" cy="46" r="7" fill="#7B3F98" />
      <circle cx="43" cy="52" r="6" fill="#3F8F3A" />
      <circle cx="58" cy="52" r="6" fill="#F08A24" />
      <path d="M50 34c0-7 5-11 11-12-1 8-5 12-11 12z" fill="#3E8E42" />
    </>
  );
}

function ChocoBalls() {
  return (
    <>
      <ellipse cx="50" cy="76" rx="38" ry="12" fill="#E8EDF2" />
      <ellipse cx="50" cy="73" rx="31" ry="9" fill="#F7FAFC" />
      <circle cx="34" cy="62" r="14" fill="#4A2C18" />
      <circle cx="66" cy="62" r="14" fill="#5A3520" />
      <circle cx="50" cy="46" r="15" fill="#6B4226" />
      <circle cx="30" cy="57" r="1.8" fill="#E8DCC8" />
      <circle cx="40" cy="66" r="1.8" fill="#E8DCC8" />
      <circle cx="62" cy="56" r="1.8" fill="#E8DCC8" />
      <circle cx="70" cy="66" r="1.8" fill="#E8DCC8" />
      <circle cx="46" cy="42" r="1.8" fill="#E8DCC8" />
      <circle cx="55" cy="51" r="1.8" fill="#E8DCC8" />
    </>
  );
}

function Pancakes() {
  return (
    <>
      <ellipse cx="50" cy="80" rx="40" ry="12" fill="#E8EDF2" />
      <ellipse cx="50" cy="76" rx="32" ry="9" fill="#F7FAFC" />
      <ellipse cx="50" cy="68" rx="30" ry="10" fill="#D9A05B" />
      <ellipse cx="50" cy="58" rx="30" ry="10" fill="#E8B972" />
      <ellipse cx="50" cy="48" rx="30" ry="10" fill="#D9A05B" />
      <ellipse cx="50" cy="38" rx="30" ry="10" fill="#E8B972" />
      <path
        d="M26 36q6 10 12 2t12 6 12-6 12 2v6q-6-8-12 0t-12-6-12 6-12-2z"
        fill="#B4652A"
      />
      <rect x="44" y="24" width="12" height="9" rx="2" fill="#F2E3A8" />
    </>
  );
}

const ART: Record<string, () => React.ReactNode> = {
  omelet: Omelet,
  fruitsalad: FruitSalad,
  chocoballs: ChocoBalls,
  pancakes: Pancakes,
};

export function RecipeArt({
  art,
  size = 120,
  title,
}: {
  art: string;
  size?: number;
  title?: string;
}) {
  const Draw = ART[art] ?? Omelet;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <Draw />
    </svg>
  );
}
