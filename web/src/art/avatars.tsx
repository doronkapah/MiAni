/**
 * אווטארים לבחירת פרופיל.
 *
 * שתי קבוצות: המומלצים — חיות ויצורים שילדים מבקשים — ופריטי הסופר,
 * שמתאימים לעולם של המשחק. הקבוצה הראשונה מוצגת ראשונה בכוונה.
 */

export interface Avatar {
  id: string;
  label: string;
  color: string;
  /** קבוצת התצוגה במסך בחירת הפרופיל */
  group: "recommended" | "market";
  draw: () => React.ReactNode;
}

const FACE = "#2A2E27";

function Face({ cx = 50, cy = 54, smile = 10 }: { cx?: number; cy?: number; smile?: number }) {
  return (
    <>
      <circle cx={cx - 9} cy={cy} r="3.5" fill={FACE} />
      <circle cx={cx + 9} cy={cy} r="3.5" fill={FACE} />
      <path
        d={`M${cx - 8} ${cy + 10}q8 ${smile} 16 0`}
        fill="none"
        stroke={FACE}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </>
  );
}

export const AVATARS: Avatar[] = [
  {
    id: "unicorn",
    label: "חד קרן",
    color: "#EFE3F7",
    group: "recommended",
    draw: () => (
      <>
        <circle cx="70" cy="36" r="15" fill="#F07CA8" />
        <circle cx="78" cy="56" r="14" fill="#9B6DD1" />
        <circle cx="72" cy="74" r="12" fill="#6FB8E8" />
        <ellipse cx="44" cy="60" rx="26" ry="25" fill="#F9F4FC" />
        <path d="M28 42 30 24 44 36z" fill="#F9F4FC" />
        <path d="M31 40 32 30 39 36z" fill="#F0D7E6" />
        <path d="M44 36 50 6 58 38z" fill="#F2C53D" />
        <path d="M47 27h8M49 18h6" stroke="#D9A511" strokeWidth="2.5" strokeLinecap="round" />
        <Face cx={42} cy={60} smile={8} />
      </>
    ),
  },
  {
    id: "rabbit",
    label: "ארנב",
    color: "#E6E1DA",
    group: "recommended",
    draw: () => (
      <>
        <ellipse cx="37" cy="26" rx="8" ry="21" transform="rotate(-12 37 26)" fill="#E6E1DA" />
        <ellipse cx="37" cy="28" rx="4" ry="14" transform="rotate(-12 37 28)" fill="#F4C6D5" />
        <ellipse cx="63" cy="26" rx="8" ry="21" transform="rotate(12 63 26)" fill="#E6E1DA" />
        <ellipse cx="63" cy="28" rx="4" ry="14" transform="rotate(12 63 28)" fill="#F4C6D5" />
        <circle cx="50" cy="64" r="25" fill="#EFEAE3" />
        <path d="M47 62h6l-3 4z" fill="#E08BA6" />
        <Face cy={58} smile={8} />
      </>
    ),
  },
  {
    id: "cat",
    label: "חתול",
    color: "#E5904A",
    group: "recommended",
    draw: () => (
      <>
        <path d="M26 44 24 16 48 32z" fill="#E5904A" />
        <path d="M74 44 76 16 52 32z" fill="#E5904A" />
        <path d="M30 40 29 25 42 33z" fill="#F0BE8E" />
        <path d="M70 40 71 25 58 33z" fill="#F0BE8E" />
        <circle cx="50" cy="58" r="27" fill="#E5904A" />
        <path d="M22 58h14M22 66h14M78 58H64M78 66H64" stroke="#8A5A2B" strokeWidth="2" strokeLinecap="round" />
        <path d="M47 60h6l-3 4z" fill="#8A5A2B" />
        <Face cy={54} smile={8} />
      </>
    ),
  },
  {
    id: "dog",
    label: "כלב",
    color: "#C08A4A",
    group: "recommended",
    draw: () => (
      <>
        <ellipse cx="24" cy="52" rx="11" ry="22" fill="#9A6B36" />
        <ellipse cx="76" cy="52" rx="11" ry="22" fill="#9A6B36" />
        <circle cx="50" cy="56" r="27" fill="#C08A4A" />
        <ellipse cx="50" cy="68" rx="14" ry="11" fill="#E0BC8E" />
        <ellipse cx="50" cy="63" rx="5" ry="4" fill="#2A2E27" />
        <path d="M42 74q8 6 16 0" fill="none" stroke="#2A2E27" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="41" cy="48" r="3.5" fill="#2A2E27" />
        <circle cx="59" cy="48" r="3.5" fill="#2A2E27" />
      </>
    ),
  },
  {
    id: "bear",
    label: "דוב",
    color: "#A9703C",
    group: "recommended",
    draw: () => (
      <>
        <circle cx="26" cy="30" r="13" fill="#A9703C" />
        <circle cx="26" cy="30" r="6" fill="#D0A575" />
        <circle cx="74" cy="30" r="13" fill="#A9703C" />
        <circle cx="74" cy="30" r="6" fill="#D0A575" />
        <circle cx="50" cy="58" r="28" fill="#A9703C" />
        <ellipse cx="50" cy="68" rx="15" ry="11" fill="#D9BC93" />
        <ellipse cx="50" cy="63" rx="5.5" ry="4" fill="#2A2E27" />
        <path d="M43 73q7 5 14 0" fill="none" stroke="#2A2E27" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="40" cy="50" r="3.5" fill="#2A2E27" />
        <circle cx="60" cy="50" r="3.5" fill="#2A2E27" />
      </>
    ),
  },
  {
    id: "penguin",
    label: "פינגווין",
    color: "#3B4252",
    group: "recommended",
    draw: () => (
      <>
        <ellipse cx="50" cy="54" rx="30" ry="34" fill="#3B4252" />
        <ellipse cx="50" cy="60" rx="20" ry="27" fill="#F7F4EC" />
        <path d="M20 60q-10 8-6 16 8 0 12-8z" fill="#E8963C" />
        <path d="M80 60q10 8 6 16-8 0-12-8z" fill="#E8963C" />
        <path d="M42 90h-9q-3-6 4-8t9 4z" fill="#E8963C" />
        <path d="M58 90h9q3-6-4-8t-9 4z" fill="#E8963C" />
        <circle cx="42" cy="44" r="6" fill="#FFFFFF" />
        <circle cx="58" cy="44" r="6" fill="#FFFFFF" />
        <circle cx="42" cy="45" r="3" fill="#2A2E27" />
        <circle cx="58" cy="45" r="3" fill="#2A2E27" />
        <path d="M50 52 44 58h12z" fill="#E8963C" />
      </>
    ),
  },
  {
    id: "dragon",
    label: "דרקון",
    color: "#4E9A3E",
    group: "recommended",
    draw: () => (
      <>
        <path d="M32 30 28 10 46 24z" fill="#8ABF5C" />
        <path d="M68 30 72 10 54 24z" fill="#8ABF5C" />
        <circle cx="50" cy="56" r="28" fill="#4E9A3E" />
        <ellipse cx="50" cy="70" rx="17" ry="12" fill="#7FB85F" />
        <circle cx="44" cy="68" r="2.5" fill="#2A2E27" />
        <circle cx="56" cy="68" r="2.5" fill="#2A2E27" />
        <path d="M41 77q9 6 18 0" fill="none" stroke="#2A2E27" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="40" cy="48" r="6" fill="#F7F4EC" />
        <circle cx="60" cy="48" r="6" fill="#F7F4EC" />
        <circle cx="40" cy="49" r="3" fill="#2A2E27" />
        <circle cx="60" cy="49" r="3" fill="#2A2E27" />
      </>
    ),
  },
  {
    id: "frog",
    label: "צפרדע",
    color: "#5EA83C",
    group: "recommended",
    draw: () => (
      <>
        <circle cx="32" cy="30" r="14" fill="#5EA83C" />
        <circle cx="68" cy="30" r="14" fill="#5EA83C" />
        <circle cx="32" cy="29" r="8" fill="#FFFFFF" />
        <circle cx="68" cy="29" r="8" fill="#FFFFFF" />
        <circle cx="33" cy="30" r="4" fill="#2A2E27" />
        <circle cx="67" cy="30" r="4" fill="#2A2E27" />
        <ellipse cx="50" cy="62" rx="32" ry="26" fill="#6FBF48" />
        <path d="M30 66q20 16 40 0" fill="none" stroke="#2A6B24" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="34" cy="56" r="3" fill="#4E9A3E" />
        <circle cx="66" cy="56" r="3" fill="#4E9A3E" />
      </>
    ),
  },
  {
    id: "tomato",
    label: "עגבנייה",
    color: "#D6402C",
    group: "market",
    draw: () => (
      <>
        <circle cx="50" cy="56" r="32" fill="#D6402C" />
        <path d="M50 26c-8-4-14-2-18 4 6 4 12 4 18-4zM50 26c8-4 14-2 18 4-6 4-12 4-18-4z" fill="#3E8E42" />
        <Face />
      </>
    ),
  },
  {
    id: "banana",
    label: "בננה",
    color: "#F2C53D",
    group: "market",
    draw: () => (
      <>
        <path d="M22 24c4 36 22 60 56 62-8 10-24 12-38 4C22 80 14 52 22 24z" fill="#F2C53D" />
        <Face cx={44} cy={58} />
      </>
    ),
  },
  {
    id: "milk",
    label: "חלב",
    color: "#DCE8F2",
    group: "market",
    draw: () => (
      <>
        <path d="M28 34h44v52a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4z" fill="#E8F0F7" />
        <path d="M28 34 50 16l22 18z" fill="#C7D8E6" />
        <Face cy={62} />
      </>
    ),
  },
  {
    id: "carrot",
    label: "גזר",
    color: "#E5781C",
    group: "market",
    draw: () => (
      <>
        <path d="M36 34h28l-10 52a4 4 0 0 1-8 0z" fill="#E5781C" />
        <path d="M50 34c-8-6-12-14-10-22 8 2 13 8 14 16 3-8 9-13 17-14-1 10-8 18-17 20z" fill="#3E8E42" />
        <Face cy={54} smile={8} />
      </>
    ),
  },
  {
    id: "apple",
    label: "תפוח",
    color: "#C62D45",
    group: "market",
    draw: () => (
      <>
        <circle cx="50" cy="58" r="31" fill="#C62D45" />
        <rect x="47" y="18" width="5" height="14" rx="2.5" fill="#7A4520" />
        <path d="M52 30c0-8 5-13 13-15-1 9-6 14-13 15z" fill="#3E8E42" />
        <Face />
      </>
    ),
  },
  {
    id: "bread",
    label: "לחם",
    color: "#C4894A",
    group: "market",
    draw: () => (
      <>
        <path d="M18 54q0-26 32-26t32 26v24a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6z" fill="#C4894A" />
        <Face cy={58} />
      </>
    ),
  },
  {
    id: "grapes",
    label: "ענבים",
    color: "#7B3F98",
    group: "market",
    draw: () => (
      <>
        <circle cx="36" cy="66" r="14" fill="#7B3F98" />
        <circle cx="64" cy="66" r="14" fill="#6A3585" />
        <circle cx="50" cy="44" r="15" fill="#8A4BA8" />
        <rect x="47" y="16" width="5" height="14" rx="2.5" fill="#7A4520" />
        <Face cy={44} smile={8} />
      </>
    ),
  },
  {
    id: "icecream",
    label: "גלידה",
    color: "#F4C6D5",
    group: "market",
    draw: () => (
      <>
        <path d="M32 58h36l-14 30a5 5 0 0 1-8 0z" fill="#D9A05B" />
        <circle cx="50" cy="42" r="22" fill="#F4C6D5" />
        <Face cy={42} />
      </>
    ),
  },
  {
    id: "cucumber",
    label: "מלפפון",
    color: "#4E9A3E",
    group: "market",
    draw: () => (
      <>
        <rect x="34" y="18" width="32" height="70" rx="16" fill="#4E9A3E" />
        <rect x="40" y="26" width="7" height="26" rx="3.5" fill="#6FB85C" />
        <Face cy={56} smile={8} />
      </>
    ),
  },
  {
    id: "orange",
    label: "תפוז",
    color: "#F08A24",
    group: "market",
    draw: () => (
      <>
        <circle cx="50" cy="58" r="31" fill="#F08A24" />
        <circle cx="39" cy="46" r="7" fill="#FFFFFF" opacity="0.3" />
        <rect x="47" y="20" width="5" height="12" rx="2.5" fill="#7A4520" />
        <path d="M52 30c0-7 5-12 12-13-1 8-5 12-12 13z" fill="#3E8E42" />
        <Face />
      </>
    ),
  },
  {
    id: "egg",
    label: "ביצה",
    color: "#F0DFC0",
    group: "market",
    draw: () => (
      <>
        <path d="M50 12c15 0 25 23 25 39s-11 25-25 25-25-9-25-25 10-39 25-39z" fill="#F6EBD6" />
        <Face cy={50} />
      </>
    ),
  },
  {
    id: "watermelon",
    label: "אבטיח",
    color: "#3F8F3A",
    group: "market",
    draw: () => (
      <>
        <path d="M14 44h72a36 36 0 0 1-72 0z" fill="#3F8F3A" />
        <path d="M21 44h58a29 29 0 0 1-58 0z" fill="#F7F1E4" />
        <path d="M25 44h50a25 25 0 0 1-50 0z" fill="#DF3D50" />
        <circle cx="40" cy="56" r="2.6" fill="#2A2E27" />
        <circle cx="60" cy="56" r="2.6" fill="#2A2E27" />
        <circle cx="50" cy="64" r="2.6" fill="#2A2E27" />
        <Face cy={50} smile={6} />
      </>
    ),
  },
  {
    id: "avocado",
    label: "אבוקדו",
    color: "#4E7A2A",
    group: "market",
    draw: () => (
      <>
        <path d="M50 14c17 0 27 20 27 38s-12 30-27 30-27-12-27-30 10-38 27-38z" fill="#4E7A2A" />
        <path d="M50 24c12 0 19 15 19 28s-8 22-19 22-19-9-19-22 7-28 19-28z" fill="#CBD96B" />
        <circle cx="50" cy="62" r="12" fill="#8A5A2B" />
        <Face cy={44} smile={8} />
      </>
    ),
  },
  {
    id: "corn",
    label: "תירס",
    color: "#F2C230",
    group: "market",
    draw: () => (
      <>
        <path d="M30 40c0-16 9-26 20-26s20 10 20 26v18c0 16-9 26-20 26s-20-10-20-26z" fill="#F2C230" />
        <path d="M38 26v46M50 22v52M62 26v46" stroke="#D9A511" strokeWidth="2.5" />
        <path d="M30 58c-9 4-13 14-11 26 12 1 20-7 21-19z" fill="#3E8E42" />
        <Face cy={46} smile={8} />
      </>
    ),
  },
  {
    id: "strawberry",
    label: "תות",
    color: "#D6304A",
    group: "market",
    draw: () => (
      <>
        <path d="M50 88c-16 0-27-14-27-30 0-11 12-18 27-18s27 7 27 18c0 16-11 30-27 30z" fill="#D6304A" />
        <path d="M30 38c6-6 13-8 20-8s14 2 20 8c-6 3-13 4-20 4s-14-1-20-4z" fill="#3E8E42" />
        <rect x="47" y="18" width="5" height="14" rx="2.5" fill="#2C6B30" />
        <circle cx="38" cy="64" r="1.8" fill="#FFE9C9" />
        <circle cx="62" cy="64" r="1.8" fill="#FFE9C9" />
        <circle cx="50" cy="76" r="1.8" fill="#FFE9C9" />
        <Face cy={56} smile={8} />
      </>
    ),
  },
  {
    id: "cheese",
    label: "גבינה",
    color: "#F0C74A",
    group: "market",
    draw: () => (
      <>
        <path d="M16 60 68 26l18 12v30a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z" fill="#F0C74A" />
        <path d="M16 60 68 26l18 12z" fill="#F7DC85" />
        <circle cx="36" cy="66" r="5" fill="#D9A511" />
        <circle cx="74" cy="60" r="4" fill="#D9A511" />
        <Face cx={56} cy={62} smile={8} />
      </>
    ),
  },
  {
    id: "pepper",
    label: "פלפל",
    color: "#D6402C",
    group: "market",
    draw: () => (
      <>
        <path d="M28 46c0-12 10-20 22-20s22 8 22 20v18c0 14-10 24-22 24s-22-10-22-24z" fill="#D6402C" />
        <path d="M50 26c0-8-4-12-4-12s10 1 12 6 8 5 8 5-6 4-16 1z" fill="#3E8E42" />
        <Face cy={54} />
      </>
    ),
  },
];

/** האווטארים לפי קבוצות, בסדר התצוגה */
export const AVATAR_GROUPS: { title: string; avatars: Avatar[] }[] = [
  {
    title: "המומלצים של ארבל!",
    avatars: AVATARS.filter((avatar) => avatar.group === "recommended"),
  },
  {
    title: "מהמדפים",
    avatars: AVATARS.filter((avatar) => avatar.group === "market"),
  },
];

export function AvatarArt({ id, size = 72 }: { id: string; size?: number }) {
  const avatar = AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={avatar.label}>
      {avatar.draw()}
    </svg>
  );
}
