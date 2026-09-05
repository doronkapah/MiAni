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

/* --- החלל --- */

function Neighbours() {
  return (
    <>
      <circle cx="26" cy="34" r="18" fill="#F5B93D" />
      <circle cx="26" cy="34" r="13" fill="#FFD873" />
      <circle cx="63" cy="58" r="20" fill="#3E7FC1" />
      <path d="M50 52q10-7 18-2t13-2q-3 16-18 20T48 62z" fill="#4C9E52" />
      <circle cx="84" cy="30" r="8" fill="#D9DEE4" />
      <circle cx="81" cy="28" r="2.4" fill="#B6BDC6" />
      <circle cx="87" cy="33" r="1.6" fill="#B6BDC6" />
    </>
  );
}

function GasGiants() {
  return (
    <>
      <circle cx="30" cy="40" r="21" fill="#D89A62" />
      <path d="M10 34h40M10 42h40M13 50h34" stroke="#B87843" strokeWidth="3" strokeLinecap="round" />
      <circle cx="41" cy="38" r="5" fill="#C4553A" />
      <circle cx="70" cy="36" r="14" fill="#E3CC8E" />
      <ellipse cx="70" cy="36" rx="24" ry="5" fill="none" stroke="#C9A94F" strokeWidth="3.5" />
      <circle cx="32" cy="78" r="11" fill="#8FD3DC" />
      <circle cx="68" cy="80" r="11" fill="#4A6FCB" />
    </>
  );
}

function DeepSky() {
  return (
    <>
      <ellipse cx="50" cy="52" rx="40" ry="26" fill="#2A2350" />
      <ellipse cx="50" cy="52" rx="24" ry="14" fill="#4C3E82" />
      <circle cx="50" cy="52" r="8" fill="#F0E4B8" />
      <path
        d="M50 52q22-12 34 4M50 52q-22 12-34-4"
        fill="none"
        stroke="#B9A8E8"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="24" r="2" fill="#FFFFFF" />
      <circle cx="78" cy="20" r="1.6" fill="#FFFFFF" />
      <circle cx="86" cy="72" r="2.2" fill="#FFFFFF" />
      <circle cx="16" cy="76" r="1.6" fill="#FFFFFF" />
    </>
  );
}

function Rovers() {
  return (
    <>
      <ellipse cx="50" cy="82" rx="42" ry="9" fill="#C9764A" />
      <rect x="30" y="44" width="40" height="22" rx="5" fill="#C6CED8" />
      <rect x="36" y="30" width="28" height="12" rx="3" fill="#7E8B9B" />
      <path d="M50 30V18" stroke="#7E8B9B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="16" r="4" fill="#E8EDF2" />
      <circle cx="36" cy="70" r="8" fill="#3D4550" />
      <circle cx="64" cy="70" r="8" fill="#3D4550" />
      <circle cx="36" cy="70" r="3" fill="#8B95A3" />
      <circle cx="64" cy="70" r="3" fill="#8B95A3" />
      <rect x="16" y="48" width="12" height="14" rx="2" fill="#3C63B4" />
      <rect x="72" y="48" width="12" height="14" rx="2" fill="#3C63B4" />
    </>
  );
}

function Pioneers() {
  return (
    <>
      <circle cx="50" cy="46" r="26" fill="#22304A" />
      <path d="M50 20a26 26 0 0 1 0 52z" fill="#2E4265" />
      <circle cx="50" cy="42" r="15" fill="#8FC7E8" />
      <path d="M40 36q10-6 20 0" fill="none" stroke="#D9EEFB" strokeWidth="3" strokeLinecap="round" />
      <rect x="34" y="70" width="32" height="16" rx="4" fill="#E4E9EF" />
      <rect x="42" y="74" width="16" height="8" rx="2" fill="#C4553A" />
      <circle cx="20" cy="22" r="2" fill="#FFD873" />
      <circle cx="82" cy="26" r="1.8" fill="#FFD873" />
    </>
  );
}

/* --- האולימפיאדה --- */

function Ceremony() {
  return (
    <>
      <path d="M46 46h8l-3 34h-2z" fill="#B8863B" />
      <path d="M50 44q-12-6-8-18 4 6 8 4 4-8 0-16 16 10 12 24-2 6-12 6z" fill="#EE7F35" />
      <circle cx="26" cy="72" r="9" fill="none" stroke="#3C7BC4" strokeWidth="3.5" />
      <circle cx="42" cy="72" r="9" fill="none" stroke="#2E2E2E" strokeWidth="3.5" />
      <circle cx="58" cy="72" r="9" fill="none" stroke="#C4453A" strokeWidth="3.5" />
      <circle cx="74" cy="72" r="9" fill="none" stroke="#4C9E52" strokeWidth="3.5" />
      <circle cx="50" cy="82" r="9" fill="none" stroke="#F2C230" strokeWidth="3.5" />
    </>
  );
}

function IsraelPride() {
  return (
    <>
      <rect x="14" y="24" width="72" height="46" rx="4" fill="#F7FAFC" />
      <rect x="14" y="30" width="72" height="7" fill="#3C63B4" />
      <rect x="14" y="57" width="72" height="7" fill="#3C63B4" />
      <path d="M50 36l10 17H40z" fill="none" stroke="#3C63B4" strokeWidth="3" />
      <path d="M50 58L40 41h20z" fill="none" stroke="#3C63B4" strokeWidth="3" />
      <circle cx="76" cy="78" r="13" fill="#F2C230" />
      <circle cx="76" cy="78" r="8" fill="#E0A81A" />
      <path d="M70 66l-4-12h20l-4 12z" fill="#C4453A" />
    </>
  );
}

function TrackLegends() {
  return (
    <>
      <path d="M8 78h84" stroke="#C4553A" strokeWidth="10" strokeLinecap="round" />
      <path d="M8 66h84" stroke="#E8EDF2" strokeWidth="2" strokeDasharray="7 7" />
      <path d="M24 62l14-6 10 10-12 8z" fill="#3C63B4" />
      <path d="M24 62l-8 8h14z" fill="#2E4A86" />
      <path d="M58 58l14-6 10 10-12 8z" fill="#F2C230" />
      <path d="M58 58l-8 8h14z" fill="#D9A616" />
      <circle cx="50" cy="26" r="12" fill="#2E8B8B" />
      <path d="M50 20v7l5 3" fill="none" stroke="#F7FAFC" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 12h8" stroke="#2E8B8B" strokeWidth="4" strokeLinecap="round" />
    </>
  );
}

function WinterGames() {
  return (
    <>
      <path d="M6 84h88" stroke="#DCEBF5" strokeWidth="8" strokeLinecap="round" />
      <path d="M22 78l24-46" stroke="#3C63B4" strokeWidth="5" strokeLinecap="round" />
      <path d="M34 80l24-46" stroke="#C4453A" strokeWidth="5" strokeLinecap="round" />
      <g stroke="#7EC8E3" strokeWidth="3" strokeLinecap="round">
        <path d="M74 20v26M62 26l24 14M86 26L62 40" />
      </g>
      <circle cx="74" cy="33" r="3.5" fill="#DCEBF5" />
    </>
  );
}

function AllTime() {
  return (
    <>
      <path d="M34 20h32v18a16 16 0 0 1-32 0z" fill="#F2C230" />
      <path d="M34 24H22v6a12 12 0 0 0 12 10z" fill="none" stroke="#D9A616" strokeWidth="4" />
      <path d="M66 24h12v6a12 12 0 0 1-12 10z" fill="none" stroke="#D9A616" strokeWidth="4" />
      <rect x="44" y="54" width="12" height="14" fill="#D9A616" />
      <path d="M30 68h40l4 12H26z" fill="#8B5E2A" />
      <path d="M44 28l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#FFF3C4" />
    </>
  );
}

const ART: Record<string, () => React.ReactNode> = {
  omelet: Omelet,
  fruitsalad: FruitSalad,
  chocoballs: ChocoBalls,
  pancakes: Pancakes,
  neighbours: Neighbours,
  gasgiants: GasGiants,
  deepsky: DeepSky,
  rovers: Rovers,
  pioneers: Pioneers,
  ceremony: Ceremony,
  israelpride: IsraelPride,
  trackLegends: TrackLegends,
  winterGames: WinterGames,
  allTime: AllTime,
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
