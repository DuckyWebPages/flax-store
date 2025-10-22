// FILE: src/components/CartApp.tsx
import React, { useEffect } from "react";
import CartProvider, { useCart } from "./CartProvider.tsx";
import CartDrawer from "./CartDrawer";

/* --- keep badge + storage in sync with the React cart --- */
function syncBadgeAndStorage(items: any[]) {
  const arr = Array.isArray(items) ? items : [];
  const objShape = JSON.stringify({ items: arr });
  const arrShape = JSON.stringify(arr);
  try { localStorage.setItem("flh_cart_v1", objShape); } catch {}
  try { localStorage.setItem("cart", objShape); } catch {}
  try { localStorage.setItem("cartItems", arrShape); } catch {}
  try { localStorage.setItem("__cart_touch", String(Date.now())); } catch {}

  const badge = document.getElementById("cart-badge");
  if (badge) {
    const total = arr.reduce((n, it) => n + Number(it?.qty || 0), 0);
    badge.textContent = String(total);
    badge.style.display = total > 0 ? "inline-block" : "none";
  }

  const detail = { cart: { items: arr } };
  window.dispatchEvent(new CustomEvent("flh:cart:updated", { detail }));
}

/* --- bridge so the rest of the site can open the drawer / add items --- */
function CartBridge() {
  const { addItem, setOpen, items } = useCart();

  useEffect(() => {
    (window as any).cartOpen = () => setOpen(true);

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

    const onAdd = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      (window as any).FLH_ADD(detail);
    };
    window.addEventListener("flh:add-to-cart", onAdd);
    return () => window.removeEventListener("flh:add-to-cart", onAdd);
  }, [addItem, setOpen]);

  // 🔁 Whenever cart items change, mirror to storage + badge
  useEffect(() => {
    syncBadgeAndStorage(items || []);
  }, [items]);

  return null;
}

export default function CartApp() {
  // ✅ Singleton guard: prevents a second drawer from mounting
  if (typeof window !== "undefined" && (window as any).__FLH_CART_MOUNTED) {
    return null;
  }
  if (typeof window !== "undefined") {
    (window as any).__FLH_CART_MOUNTED = true;
  }

  return (
    <CartProvider>
      <CartBridge />
      <CartDrawer />
    </CartProvider>
  );
}
