// FILE: src/components/CartProvider.tsx
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";

export type CartItem = {
  id: string;
  name: string;
  unitCents: number;
  qty: number;
  priceId: string;
  image?: string; // 👈 allows product images
};

type CartContextType = {
  items: CartItem[];
  totalCents: number;
  addItem: (item: CartItem) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const addItem = useCallback((item: CartItem) => {
  if (!item.priceId) {
  console.warn("addItem: missing priceId; adding anyway", item);
}

  setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                qty: i.qty + item.qty,
                unitCents: item.unitCents,
                image: i.image || item.image || "", // 👈 keep or update image
              }
            : i
        );
      }
      return [...prev, { ...item }]; // 👈 new item carries its image
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty } : i));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.unitCents * i.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, totalCents, addItem, setQty, remove, clear, open, setOpen }),
    [items, totalCents, addItem, setQty, remove, clear, open]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
