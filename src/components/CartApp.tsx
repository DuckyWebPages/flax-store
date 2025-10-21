// FILE: src/components/CartApp.tsx
import React, { useEffect } from "react";
import CartProvider, { useCart } from "./CartProvider.tsx";  // ✅ import CartProvider (default) + useCart
import CartDrawer from "./CartDrawer";

// Bridge so the rest of the site can open the drawer and add items
function CartBridge() {
  const { addItem, setOpen } = useCart();

  useEffect(() => {
    // Header button uses this to open the drawer
    (window as any).cartOpen = () => setOpen(true);

    // Programmatic add: window.FLH_ADD({ id, name, qty, unitCents?, priceId?, image? })
    (window as any).FLH_ADD = (raw: any) => {
      const id        = String(raw?.id ?? "").trim();
      if (!id) return;
      const qty       = Math.max(1, Number(raw?.qty ?? 1));
      const name      = String(raw?.name ?? "");
      const unitCents = Number(raw?.unitCents ?? raw?.price ?? 0);
      const priceId   = String(raw?.priceId ?? "");
      const image     = String(raw?.image ?? raw?.imageUrl ?? "");
      addItem({ id, name, qty, unitCents, priceId, image });
      setOpen(true);
    };

    // Optional event-based add
    const onAdd = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      (window as any).FLH_ADD(detail);
    };
    window.addEventListener("flh:add-to-cart", onAdd);
    return () => window.removeEventListener("flh:add-to-cart", onAdd);
  }, [addItem, setOpen]);

  return null;
}

export default function CartApp() {
  return (
    <CartProvider>
      <CartBridge />
      <CartDrawer />
    </CartProvider>
  );
}
