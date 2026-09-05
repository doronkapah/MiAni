import { Product } from "../art/Product";
import type { CartItem } from "../game/engine";

/**
 * העגלה, כמסך שנפתח בלחיצה.
 *
 * קודם היא ישבה קבוע בתחתית העמוד ולקחה מקום מכל חידה. עכשיו היא
 * במרחק הקשה אחת, ובפנים יש מקום להציג את הפריטים בגודל שרואים.
 */
export function Cart({
  items,
  onClose,
}: {
  items: CartItem[];
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="cart-modal"
        role="dialog"
        aria-modal="true"
        aria-label="העגלה שלי"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="book-head">
          <h1>🛒 העגלה שלי</h1>
          <span className="book-count">{items.length} פריטים</span>
        </header>

        {items.length === 0 ? (
          <p className="muted">
            העגלה עוד ריקה. כל פריט שפותרים נכנס לכאן — וכשמצטברים המצרכים של מנה,
            נפתח מתכון.
          </p>
        ) : (
          <div className="cart-grid">
            {items
              .slice()
              .reverse()
              .map((item) => (
                <div className="cart-tile" key={item.id}>
                  <Product shape={item.art.shape} color={item.art.color} size={56} />
                  <small>{item.name}</small>
                </div>
              ))}
          </div>
        )}

        <button className="btn primary big" onClick={onClose}>
          חזרה למשחק
        </button>
      </div>
    </div>
  );
}
