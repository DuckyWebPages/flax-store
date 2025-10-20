import React from "react";
import { useCart } from "./CartProvider.tsx";
import CartDrawer from "./CartDrawer";

export default function CartApp() {
  return (
    <CartProvider>
      <CartDrawer />
    </CartProvider>
  );
}
