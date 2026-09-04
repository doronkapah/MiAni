/** אווטארים לבחירת פרופיל — פריטי סופר עם פנים. */

export interface Avatar {
  id: string;
  label: string;
  color: string;
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
    id: "tomato",
    label: "עגבנייה",
    color: "#D6402C",
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
    draw: () => (
      <>
        <path d="M28 46c0-12 10-20 22-20s22 8 22 20v18c0 14-10 24-22 24s-22-10-22-24z" fill="#D6402C" />
        <path d="M50 26c0-8-4-12-4-12s10 1 12 6 8 5 8 5-6 4-16 1z" fill="#3E8E42" />
        <Face cy={54} />
      </>
    ),
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
