/** עגלי — עגלת הקניות המדברת. דמות ניטרלית מגדרית. */

export function Agali({
  size = 120,
  mood = "happy",
}: {
  size?: number;
  mood?: "happy" | "thinking" | "cheer";
}) {
  const eyeY = mood === "thinking" ? 44 : 42;
  return (
    <svg viewBox="0 0 140 120" width={size} height={size * (120 / 140)} role="img" aria-label="עגלי, עגלת הקניות">
      {/* ידית */}
      <path
        d="M14 18h16l8 14"
        fill="none"
        stroke="var(--green-deep)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* גוף העגלה */}
      <path d="M34 30h92l-16 52H50z" fill="var(--green)" />
      <path d="M34 30h92l-3 10H37z" fill="var(--green-deep)" />
      {/* סורגים */}
      <path
        d="M56 42v34M76 42v34M96 42v34M45 56h74"
        stroke="var(--green-deep)"
        strokeWidth="3"
        opacity="0.35"
      />
      {/* גלגלים */}
      <circle cx="58" cy="96" r="10" fill="#2A2E27" />
      <circle cx="58" cy="96" r="4" fill="#8A9384" />
      <circle cx="104" cy="96" r="10" fill="#2A2E27" />
      <circle cx="104" cy="96" r="4" fill="#8A9384" />
      {/* פנים */}
      <circle cx="66" cy={eyeY} r="6" fill="#FFFFFF" />
      <circle cx="94" cy={eyeY} r="6" fill="#FFFFFF" />
      <circle cx={mood === "thinking" ? 68 : 66} cy={eyeY + 1} r="3" fill="#1C2118" />
      <circle cx={mood === "thinking" ? 96 : 94} cy={eyeY + 1} r="3" fill="#1C2118" />
      {mood === "cheer" ? (
        <path d="M68 56q12 14 24 0z" fill="#FFFFFF" />
      ) : (
        <path
          d="M68 56q12 10 24 0"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
