export type CartItem = {
  id: string;
  name: string;
  unitCents: number;
  image?: string;
};

type StoredItem = CartItem & { qty: number };
const KEY = "flax_cart_v1";

const read = (): StoredItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (items: StoredItem[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const Cart = {
  all(): StoredItem[] { return read(); },
  count(): number { return read().reduce((n, i) => n + i.qty, 0); },
  totalCents(): number { return read().reduce((n, i) => n + i.qty * i.unitCents, 0); },

  add(item: CartItem, qty = 1) {
    const items = read();
    const i = items.findIndex(x => x.id === item.id);
    if (i >= 0) items[i].qty += qty; else items.push({ ...item, qty });
    write(items);
    window.dispatchEvent(new CustomEvent("cart:updated"));
  },

  setQty(id: string, qty: number) {
    const items = read().map(i => i.id === id ? { ...i, qty } : i).filter(i => i.qty > 0);
    write(items);
    window.dispatchEvent(new CustomEvent("cart:updated"));
  },

  remove(id: string) {
    write(read().filter(i => i.id !== id));
    window.dispatchEvent(new CustomEvent("cart:updated"));
  },

  clear() {
    write([]);
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }
};
