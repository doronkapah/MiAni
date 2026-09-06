import { Product } from "../art/Product";
import type { CartItem } from "../game/engine";
import { getWorld } from "../../../shared/worlds";
import { WORDS, count } from "../../../shared/hebrew";

/**
 * העגלה, כמסך שנפתח בלחיצה.
 *
 * קודם היא ישבה קבוע בתחתית העמוד ולקחה מקום מכל חידה. עכשיו היא
 * במרחק הקשה אחת, ובפנים יש מקום להציג את הפריטים בגודל שרואים.
 */
export function Cart({
  items,
  world,
  onClose,
}: {
  items: CartItem[];
  world: string;
  onClose: () => void;
}) {
  const info = getWorld(world);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="cart-modal"
        role="dialog"
        aria-modal="true"
        aria-label={info.collection.name}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="book-head">
          <h1>
            {info.collection.icon} {info.collection.name}
          </h1>
          <span className="book-count">{count(items.length, WORDS.item)}</span>
        </header>

        {items.length === 0 ? (
          <p className="muted">{info.collection.empty}</p>
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
