import { useMemo, useState } from "react";
import { AvatarArt } from "../art/avatars";
import { riddleById } from "../../../shared/bank";
import * as store from "../store/local";
import {
  activity,
  childRow,
  clearStats,
  hardestRiddles,
  readStats,
  totals,
  type DayBar,
} from "../lib/stats";

/**
 * סיכום שימוש, מקומי לגמרי.
 *
 * כל המספרים כאן מגיעים ממונים ששמורים על המכשיר. שום דבר לא נשלח
 * לשום מקום, ואין כאן שירות מדידה חיצוני.
 */

const percent = (value: number) => `${Math.round(value * 100)}%`;

const relativeDay = (at: number) => {
  const days = Math.floor((Date.now() - at) / 86_400_000);
  if (days <= 0) return "היום";
  if (days === 1) return "אתמול";
  if (days < 30) return `לפני ${days} ימים`;
  return new Date(at).toLocaleDateString("he-IL");
};

/**
 * פעילות יומית — סדרה אחת, ולכן בצבע אחד ובלי מקרא.
 * מסומן ערך רק על היום החזק ביותר; שאר המספרים נחשפים במעבר עכבר.
 */
function ActivityChart({ bars }: { bars: DayBar[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const peak = Math.max(1, ...bars.map((bar) => bar.solved));
  const active = hovered === null ? null : bars[hovered];
  const peakIndex = bars.findIndex((bar) => bar.solved === peak && peak > 0);

  return (
    <figure className="chart">
      <figcaption>
        חידות שנפתרו בשבועיים האחרונים
        <span className="chart-readout">
          {active ? `${active.label} · ${active.solved}` : `שיא: ${peak} ביום`}
        </span>
      </figcaption>

      <div
        className="chart-bars"
        role="img"
        aria-label={`פעילות יומית: ${bars.map((bar) => `${bar.label} ${bar.solved}`).join(", ")}`}
      >
        {bars.map((bar, index) => (
          <div
            className="chart-col"
            key={bar.day}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(index)}
            onBlur={() => setHovered(null)}
            tabIndex={0}
          >
            {index === peakIndex && <span className="chart-peak">{bar.solved}</span>}
            <span
              className={`chart-bar ${hovered === index ? "on" : ""} ${bar.solved === 0 ? "empty" : ""}`}
              style={{ height: `${Math.max(3, (bar.solved / peak) * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <div className="chart-axis">
        <span>{bars[0]?.label}</span>
        <span>{bars[bars.length - 1]?.label}</span>
      </div>
    </figure>
  );
}

export function Stats({ onClose }: { onClose: () => void }) {
  const [version, setVersion] = useState(0);

  const data = useMemo(() => {
    const stats = readStats();
    const profiles = store.listProfiles();
    return {
      total: totals(stats),
      bars: activity(14, stats),
      hardest: hardestRiddles(6, stats),
      children: profiles.map((profile) => ({
        profile,
        row: childRow(profile.id, stats),
      })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const { total } = data;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="stats-modal"
        role="dialog"
        aria-modal="true"
        aria-label="סיכום שימוש"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="book-head">
          <h1>📊 סיכום שימוש</h1>
          {total.firstPlay && (
            <span className="book-count">מאז {new Date(total.firstPlay).toLocaleDateString("he-IL")}</span>
          )}
        </header>

        {total.guesses === 0 ? (
          <p className="muted">עוד לא שיחקו. אחרי כמה חידות יהיה כאן מה לראות.</p>
        ) : (
          <>
            <div className="tiles">
              <div className="tile">
                <dt>חידות שנפתרו</dt>
                <dd>{total.solved}</dd>
              </div>
              <div className="tile">
                <dt>ניחושים בסך הכול</dt>
                <dd>{total.guesses}</dd>
              </div>
              <div className="tile">
                <dt>ימי משחק</dt>
                <dd>{total.activeDays}</dd>
              </div>
              <div className="tile">
                <dt>פעמים "גלה לי"</dt>
                <dd>{total.reveals}</dd>
              </div>
            </div>

            <ActivityChart bars={data.bars} />

            <section>
              <h2>לפי שחקן</h2>
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <th>שחקן</th>
                      <th>נפתרו</th>
                      <th>דיוק</th>
                      <th>רמזים לחידה</th>
                      <th>גלה לי</th>
                      <th>שיחק לאחרונה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.children.map(({ profile, row }) => (
                      <tr key={profile.id}>
                        <td className="who-cell">
                          <AvatarArt id={profile.avatar} size={26} />
                          {profile.name}
                        </td>
                        <td className="num">{row.solved}</td>
                        <td className="num">{percent(row.accuracy)}</td>
                        <td className="num">{row.hintsPerRiddle.toFixed(1)}</td>
                        <td className="num">{row.reveals}</td>
                        <td className="num">{relativeDay(row.lastPlay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {data.hardest.length > 0 && (
              <section>
                <h2>החידות שהכי הקשו</h2>
                <p className="muted small">
                  לפי ניחושים שגויים ופעמים שביקשו לגלות. שימושי כדי לדעת מה כדאי לנסח
                  מחדש.
                </p>
                <ul className="hard-list">
                  {data.hardest.map((entry) => {
                    const riddle = riddleById.get(entry.id);
                    return (
                      <li key={entry.id}>
                        <strong>{riddle?.answer ?? entry.id}</strong>
                        <span className="muted">
                          {entry.wrong} ניחושים שגויים · {entry.reveals} פעמים גילו ·{" "}
                          {entry.solved ? `${entry.avgHints.toFixed(1)} רמזים בממוצע` : "עוד לא נפתרה"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        <p className="muted small">
          כל המספרים כאן נשמרים על המכשיר הזה בלבד ולא נשלחים לשום מקום. הם נכללים
          בקובץ הגיבוי, כדי שיעברו איתכם למכשיר אחר.
        </p>

        <div className="row">
          <button className="btn primary" onClick={onClose}>
            סגירה
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              clearStats();
              setVersion((v) => v + 1);
            }}
            disabled={total.guesses === 0}
          >
            איפוס הנתונים
          </button>
        </div>
      </div>
    </div>
  );
}
