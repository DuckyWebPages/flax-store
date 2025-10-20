// FILE: src/components/CartButton.tsx
import React from "react";
import CartProvider, { useCart } from "./CartProvider.tsx";


export default function CartButton() {
  const { items, setOpen } = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}                 // ← open the drawer
      aria-label="Open cart"
      style={{
        position: "fixed", right: 16, top: 16, zIndex: 10000,
        background: "#111", color: "#fff", border: "none",
        borderRadius: 999, padding: "10px 14px", fontWeight: 700,
        boxShadow: "0 4px 12px rgba(0,0,0,.25)", cursor: "pointer"
      }}
    >
      Cart ({count})
    </button>
  );
}
