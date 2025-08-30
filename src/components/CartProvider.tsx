import React, { createContext, useContext, useEffect, useState } from "react";
import { Cart, type CartItem } from "../lib/cart";

type Stored = ReturnType<typeof Cart.all>[number];

type Ctx = {
  items: Stored[];
  count: number;
  totalCents: number;
  add: (item: CartItem, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Stored[]>([]);
  const [open, setOpen] = useState(false);

  const sync = () => setItems(Cart.all());

  useEffect(() => {
    sync();
    const h = () => sync();
    window.addEventListener("cart:updated", h as EventListener);
    return () => window.removeEventListener("cart:updated", h as EventListener);
  }, []);

  // 🔗 BRIDGE: accept DOM events & expose window.cart helper
  useEffect(() => {
    type Incoming =
      | (Partial<CartItem> & {
          /** Common alternates that buttons may send */
          sku?: string;
          priceId?: string;
          quantity?: number;
          qty?: number;
        })
      | { item: CartItem; quantity?: number; qty?: number };

    const onAdd = (evt: Event) => {
      const e = evt as CustomEvent<Incoming>;
      const d = e.detail || ({} as Incoming);

      // Normalize qty
      const qty = Number.isFinite((d as any).quantity)
        ? Number((d as any).quantity)
        : Number.isFinite((d as any).qty)
        ? Number((d as any).qty)
        : 1;

      // Prefer a full item if provided
      let item: CartItem | null = (d as any).item ?? null;

      if (!item) {
        // Derive an id: prefer id → sku → priceId → name
        const id =
          (d as any).id ??
          (d as any).sku ??
          (d as any).priceId ??
          (d as any).name;

        if (!id) return; // nothing to add

        item = {
          // @ts-expect-error - we allow partials; Cart.add will validate
          id,
          name: (d as any).name ?? String(id),
          unitCents:
            typeof (d as any).unitCents === "number" ? (d as any).unitCents : 0,
          image: (d as any).image,
        } as CartItem;
      }

      // Use your existing cart core + open the drawer
      Cart.add(item, qty);
      setOpen(true);
    };

    const onOpen = () => setOpen(true);
    const onClear = () => Cart.clear();

    window.addEventListener("cart:add", onAdd as EventListener);
    document.addEventListener("cart:add", onAdd as EventListener);
    window.addEventListener("cart:open", onOpen as EventListener);
    window.addEventListener("cart:clear", onClear as EventListener);

    // Global helper for legacy buttons/scripts
    (window as any).cart = {
      add: (item: CartItem, qty: number = 1) => {
        Cart.add(item, qty);
        setOpen(true);
      },
      open: () => setOpen(true),
      close: () => setOpen(false),
      clear: () => Cart.clear(),
      setQty: (id: string, qty: number) => Cart.setQty(id, qty),
      remove: (id: string) => Cart.remove(id),
    };

    return () => {
      window.removeEventListener("cart:add", onAdd as EventListener);
      document.removeEventListener("cart:add", onAdd as EventListener);
      window.removeEventListener("cart:open", onOpen as EventListener);
      window.removeEventListener("cart:clear", onClear as EventListener);
      // Optionally: delete (window as any).cart;
    };
  }, []);

  const value: Ctx = {
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    totalCents: items.reduce((n, i) => n + i.qty * i.unitCents, 0),
    add: (item, qty) => Cart.add(item, qty),
    setQty: (id, qty) => Cart.setQty(id, qty),
    remove: (id) => Cart.remove(id),
    clear: () => Cart.clear(),
    open,
    setOpen,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

// 👇 Make sure THIS export exists (the build error says it was missing)
export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
};
