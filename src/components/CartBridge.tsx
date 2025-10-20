// FILE: src/components/CartBridge.tsx
import React from "react";
import CartProvider, { useCart } from "./CartProvider.tsx";
import CartDrawer from "./CartDrawer";

function BridgeListener() {
  const { addItem, setOpen } = useCart();

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;

      const btn = target.closest<HTMLButtonElement>(".add-to-cart");
      if (!btn) return;

      // Pull all the info off the HTML button
      const sku = btn.getAttribute("data-sku") || "";
      const name = btn.getAttribute("data-name") || sku || "Item";
      const price = parseInt(btn.getAttribute("data-price") || "0", 10);
      const qty = parseInt(btn.getAttribute("data-qty") || "1", 10);
      const image = btn.getAttribute("data-image") || ""; // 👈 added line

      if (!sku || !Number.isFinite(price) || !Number.isFinite(qty)) {
        console.warn("[CartBridge] Missing data on Add to Cart:", { sku, price, qty });
        alert("Sorry, this item is missing product info.");
        return;
      }

      e.preventDefault();

      // Send everything (including image) into the React cart
      addItem({
        id: sku,
        name,
        unitCents: price,
        qty,
        priceId: sku,
        image, // 👈 added line
      });

      setOpen(true);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [addItem, setOpen]);

  return null;
}

export default function CartBridge() {
  return (
    <CartProvider>
      <BridgeListener />
      <CartDrawer />
    </CartProvider>
  );
}
