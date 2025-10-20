// FILE: src/components/CartRoot.tsx
import React from "react";
import CartProvider from "./CartProvider.tsx";
import CartDrawer from "./CartDrawer.tsx";
import CartButton from "./CartButton.tsx";   // ← add this

export default function CartRoot() {
  return (
    <CartProvider>
      <CartButton />     {/* ← gives you the header/floating button to open the drawer */}
      <CartDrawer />
    </CartProvider>
  );
}
