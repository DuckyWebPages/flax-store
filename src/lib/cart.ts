export type CartItem = {
  id: string;        // your internal product id
  priceId: string;   // Stripe Price ID (price_xxx)
  name: string;
  unitCents: number; // display only
  image: string;
  qty: number;
};

const KEY = "flax_cart_v1";

const read = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (items: CartItem[]) => localStorage.setItem(KEY, JSON.stringify(items));

export const getCart = () => read();

export const addToCart = (item: Omit<CartItem, "qty">, qty = 1) => {
  const cart = read();
  const i = cart.findIndex(x => x.id === item.id);
  if (i >= 0) cart[i].qty += qty;
  else cart.push({ ...item, qty });
  write(cart);
};

export const setQty = (id: string, qty: number) => {
  write(read().map(i => (i.id === id ? { ...i, qty } : i)).filter(i => i.qty > 0));
};

export const removeItem = (id: string) => write(read().filter(i => i.id !== id));
export const clearCart = () => write([]);
export const subtotalCents = () => read().reduce((s, i) => s + i.unitCents * i.qty, 0);
